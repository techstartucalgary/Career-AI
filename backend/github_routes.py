"""
GitHub OAuth + Profile endpoints.

OAuth flow (browser-based, no frontend changes needed):
  1. User hits GET /api/github/connect?token=<jwt>
  2. Backend redirects to GitHub OAuth authorization page
  3. GitHub redirects back to GET /api/github/oauth/callback?code=...&state=...
  4. Backend exchanges code, stores encrypted token, redirects to success page
  5. All subsequent calls use Authorization: Bearer <jwt> header

Profile endpoints:
  GET  /api/github/status      - connected? username?
  GET  /api/github/profile     - return cached GitHubProfile (fetch+analyze if needed)
  POST /api/github/refresh     - force re-fetch and re-analyze
  POST /api/github/disconnect  - remove token from DB
  GET  /api/github/context     - return context string ready for LLM injection
"""
import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse

from dependencies import get_current_user
from database import col
from bson import ObjectId

from github_service.crypto import encrypt_token, decrypt_token
from github_service.github_client import (
    exchange_code_for_token, get_user, get_repos
)
from github_service.repo_analyzer import select_top_repos, analyze_repos_parallel
from github_service.profile_builder import build_github_profile, profile_to_context_string
from ai_service.ai_service import AIService

router = APIRouter(prefix="/api/github", tags=["GitHub Integration"])

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
CACHE_TTL_HOURS = int(os.getenv("GITHUB_CACHE_TTL_HOURS", "24"))
MAX_REPOS = int(os.getenv("GITHUB_MAX_REPOS_TO_ANALYZE", "15"))

# ─────────────────────────────────────────────────────────────────────────────
# OAuth endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/connect")
async def github_connect(token: str = Query(..., description="Your CareerCompanion JWT token")):
    """
    Redirect the browser to GitHub's OAuth authorization page.
    Pass your JWT as ?token=<jwt> — this ties the callback back to your account.

    Usage: open http://localhost:8000/api/github/connect?token=<your_jwt> in a browser.
    """
    client_id = os.getenv("GITHUB_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GITHUB_CLIENT_ID not configured")

    callback_url = os.getenv(
        "GITHUB_CALLBACK_URL", "http://localhost:8000/api/github/oauth/callback"
    )
    scope = "read:user,public_repo"

    # Embed the JWT as the state so we know which user to link on callback
    import urllib.parse
    params = urllib.parse.urlencode({
        "client_id": client_id,
        "redirect_uri": callback_url,
        "scope": scope,
        "state": token,
    })
    return RedirectResponse(url=f"{GITHUB_AUTHORIZE_URL}?{params}")


@router.get("/oauth/callback")
async def github_oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
):
    """
    GitHub redirects here after user authorizes the app.
    Exchanges the code for an access token and stores it encrypted in MongoDB.
    """
    jwt_token = state

    # Validate the JWT and extract user_id
    try:
        user_id = get_current_user(jwt_token)
    except Exception:
        return HTMLResponse(_error_page("Invalid or expired session. Please log in to CareerCompanion and try again."), status_code=400)

    # Exchange code for GitHub access token
    try:
        access_token = exchange_code_for_token(code)
    except Exception as e:
        return HTMLResponse(_error_page(f"GitHub token exchange failed: {e}"), status_code=500)

    if not access_token:
        return HTMLResponse(_error_page("GitHub did not return an access token. Please try again."), status_code=400)

    # Fetch GitHub username
    try:
        gh_user = get_user(access_token)
        username = gh_user.get("login", "")
    except Exception as e:
        return HTMLResponse(_error_page(f"Could not fetch GitHub profile: {e}"), status_code=500)

    # Store encrypted token in MongoDB
    encrypted = encrypt_token(access_token)
    col.update_one(
        {"_id": user_id},
        {"$set": {
            "github.access_token": encrypted,
            "github.username": username,
            "github.connected_at": datetime.utcnow().isoformat(),
            "github.profile_cache": None,
            "github.cache_updated_at": None,
        }}
    )

    frontend_url = os.getenv("FRONTEND_GITHUB_SUCCESS_URL", "http://localhost:8081")
    return HTMLResponse(_success_page(username, frontend_url))


# ─────────────────────────────────────────────────────────────────────────────
# Profile endpoints (require Authorization: Bearer <jwt> header)
# ─────────────────────────────────────────────────────────────────────────────

def _get_user_id_from_request(request: Request) -> ObjectId:
    """Extract and validate JWT from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = auth[7:]
    try:
        return get_current_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def _get_github_doc(user_id: ObjectId) -> dict:
    """Fetch user's github subdocument from MongoDB."""
    user = col.find_one({"_id": user_id}, {"github": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("github") or {}


@router.get("/status")
async def github_status(request: Request):
    """Check if the current user has connected their GitHub account."""
    user_id = _get_user_id_from_request(request)
    gh = _get_github_doc(user_id)

    connected = bool(gh.get("access_token"))
    return {
        "connected": connected,
        "username": gh.get("username") if connected else None,
        "connected_at": gh.get("connected_at") if connected else None,
        "cache_updated_at": gh.get("cache_updated_at") if connected else None,
    }


@router.get("/profile")
async def get_github_profile(request: Request, force_refresh: bool = Query(False)):
    """
    Return the user's GitHub profile with AI-generated project bullets.
    Uses cached data if fresh (< CACHE_TTL_HOURS old), otherwise fetches and re-analyzes.
    Pass ?force_refresh=true to bypass cache.
    """
    user_id = _get_user_id_from_request(request)
    gh = _get_github_doc(user_id)

    if not gh.get("access_token"):
        raise HTTPException(status_code=400, detail="GitHub not connected. Visit /api/github/connect?token=<jwt>")

    # Check cache freshness
    if not force_refresh and gh.get("profile_cache") and gh.get("cache_updated_at"):
        try:
            updated = datetime.fromisoformat(gh["cache_updated_at"])
            age_hours = (datetime.utcnow() - updated).total_seconds() / 3600
            if age_hours < CACHE_TTL_HOURS:
                return {"success": True, "profile": gh["profile_cache"], "from_cache": True}
        except Exception:
            pass

    # Fetch fresh data
    token = decrypt_token(gh["access_token"])
    username = gh.get("username", "")

    try:
        user_info = get_user(token)
        raw_repos = get_repos(username, token)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {e}")

    top_repos = select_top_repos(raw_repos, username, max_repos=MAX_REPOS)

    # Initialize LLM (reuses same provider config as rest of backend)
    ai = AIService()

    print(f"🔍 Analyzing {len(top_repos)} repos for @{username}...")
    analyzed = await analyze_repos_parallel(top_repos, username, token, ai.llm)

    profile = build_github_profile(user_info, analyzed)

    # Cache in MongoDB
    col.update_one(
        {"_id": user_id},
        {"$set": {
            "github.profile_cache": profile,
            "github.cache_updated_at": datetime.utcnow().isoformat(),
        }}
    )
    print(f"✅ GitHub profile built for @{username}: {len(analyzed)} repos analyzed")
    return {"success": True, "profile": profile, "from_cache": False}


@router.get("/context")
async def get_github_context(request: Request):
    """
    Return the GitHub profile formatted as a plain-text context string,
    ready to be passed as `github_context` to /api/resume/tailor or /api/cover-letter/generate.
    """
    user_id = _get_user_id_from_request(request)
    gh = _get_github_doc(user_id)

    if not gh.get("profile_cache"):
        raise HTTPException(
            status_code=400,
            detail="No GitHub profile cached. Call GET /api/github/profile first."
        )

    context_str = profile_to_context_string(gh["profile_cache"])
    return {"success": True, "context": context_str}


@router.post("/refresh")
async def refresh_github_profile(request: Request):
    """Force re-fetch and re-analyze the user's GitHub repos (ignores cache)."""
    # Delegates to get_github_profile with force_refresh=True
    request._query_params = {"force_refresh": "true"}
    return await get_github_profile(request, force_refresh=True)


@router.post("/disconnect")
async def github_disconnect(request: Request):
    """Remove the user's GitHub connection and delete all cached data."""
    user_id = _get_user_id_from_request(request)
    col.update_one(
        {"_id": user_id},
        {"$unset": {"github": ""}}
    )
    return {"success": True, "message": "GitHub disconnected successfully"}


@router.put("/repos/{repo_name}/toggle")
async def toggle_repo(repo_name: str, request: Request):
    """
    Toggle a specific repo's include_in_resume flag.
    Lets users exclude irrelevant repos from AI context.
    """
    user_id = _get_user_id_from_request(request)
    gh = _get_github_doc(user_id)

    profile = gh.get("profile_cache")
    if not profile:
        raise HTTPException(status_code=400, detail="No cached profile. Fetch profile first.")

    repos = profile.get("repos", [])
    toggled = False
    for repo in repos:
        if repo["name"] == repo_name:
            repo["include_in_resume"] = not repo.get("include_in_resume", True)
            toggled = True
            break

    if not toggled:
        raise HTTPException(status_code=404, detail=f"Repo '{repo_name}' not found in profile")

    profile["repos"] = repos
    col.update_one({"_id": user_id}, {"$set": {"github.profile_cache": profile}})
    return {"success": True, "repo": repo_name, "include_in_resume": repo["include_in_resume"]}


# ─────────────────────────────────────────────────────────────────────────────
# HTML helper pages (shown directly in browser after OAuth)
# ─────────────────────────────────────────────────────────────────────────────

def _success_page(username: str, frontend_url: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <title>GitHub Connected — CareerCompanion</title>
  <style>
    body {{ font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; height: 100vh; margin: 0; background: #0d1117; color: #c9d1d9; }}
    .card {{ text-align: center; padding: 2rem 3rem; border: 1px solid #30363d;
             border-radius: 12px; background: #161b22; max-width: 400px; }}
    .check {{ font-size: 3rem; }}
    h1 {{ color: #58a6ff; margin: 0.5rem 0; }}
    p {{ color: #8b949e; margin: 0.25rem 0; }}
    .username {{ color: #3fb950; font-weight: bold; }}
  </style>
  <script>
    // Reload the opener (the CareerCompanion page) so it picks up the new connection,
    // then close this popup after a short delay.
    try {{
      if (window.opener && !window.opener.closed) {{
        window.opener.location.reload();
      }}
    }} catch(e) {{}}
    setTimeout(() => window.close(), 2000);
  </script>
</head>
<body>
  <div class="card">
    <div class="check">✅</div>
    <h1>GitHub Connected!</h1>
    <p>Logged in as <span class="username">@{username}</span></p>
    <p style="margin-top:1rem">This window will close automatically...</p>
  </div>
</body>
</html>"""


def _error_page(message: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <title>GitHub Connection Error — CareerCompanion</title>
  <style>
    body {{ font-family: system-ui, sans-serif; display: flex; align-items: center;
           justify-content: center; height: 100vh; margin: 0; background: #0d1117; color: #c9d1d9; }}
    .card {{ text-align: center; padding: 2rem 3rem; border: 1px solid #30363d;
             border-radius: 12px; background: #161b22; max-width: 400px; }}
    h1 {{ color: #f85149; }}
    p {{ color: #8b949e; }}
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:3rem">❌</div>
    <h1>Connection Failed</h1>
    <p>{message}</p>
    <p style="margin-top:1rem"><a href="javascript:window.close()" style="color:#58a6ff">Close this tab</a></p>
  </div>
</body>
</html>"""
