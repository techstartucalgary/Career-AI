"""
GitHub REST API v3 wrapper.
All calls are server-side — the access token never leaves the backend.
"""
import os
import base64
from typing import Optional
import httpx

GITHUB_API = "https://api.github.com"
GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token"


def _headers(token: str) -> dict:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def exchange_code_for_token(code: str) -> Optional[str]:
    """Exchange OAuth authorization code for access token."""
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")
    callback_url = os.getenv("GITHUB_CALLBACK_URL", "http://localhost:8000/api/github/oauth/callback")

    resp = httpx.post(
        GITHUB_OAUTH_TOKEN_URL,
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": callback_url,
        },
        headers={"Accept": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("access_token")


def get_user(token: str) -> dict:
    """Fetch authenticated user info."""
    resp = httpx.get(f"{GITHUB_API}/user", headers=_headers(token), timeout=10)
    resp.raise_for_status()
    return resp.json()


def get_repos(username: str, token: str) -> list[dict]:
    """
    Fetch all public repos for a user (paginated, up to 100).
    Returns raw GitHub repo objects sorted by last push date.
    """
    repos = []
    page = 1
    while True:
        resp = httpx.get(
            f"{GITHUB_API}/users/{username}/repos",
            params={"sort": "pushed", "per_page": 100, "page": page, "type": "owner"},
            headers=_headers(token),
            timeout=15,
        )
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        repos.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    return repos


def get_repo_languages(owner: str, repo: str, token: str) -> dict:
    """Get byte-count breakdown of languages in a repo."""
    try:
        resp = httpx.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/languages",
            headers=_headers(token),
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {}


def get_readme(owner: str, repo: str, token: str) -> str:
    """Fetch and decode the README for a repo. Returns empty string if missing."""
    try:
        resp = httpx.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/readme",
            headers=_headers(token),
            timeout=10,
        )
        if resp.status_code == 404:
            return ""
        resp.raise_for_status()
        data = resp.json()
        content = data.get("content", "")
        encoding = data.get("encoding", "base64")
        if encoding == "base64":
            return base64.b64decode(content).decode("utf-8", errors="replace")
        return content
    except Exception:
        return ""


def get_contributor_commit_count(owner: str, repo: str, username: str, token: str) -> int:
    """Return total commits by this user in this repo (from contributor stats)."""
    try:
        resp = httpx.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/stats/contributors",
            headers=_headers(token),
            timeout=15,
        )
        if resp.status_code in (202, 204):
            # GitHub is computing stats async — retry once after 2s
            import time
            time.sleep(2)
            resp = httpx.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/stats/contributors",
                headers=_headers(token),
                timeout=15,
            )
        if resp.status_code != 200:
            return 0
        contributors = resp.json()
        for c in contributors:
            if c.get("author", {}).get("login", "").lower() == username.lower():
                return c.get("total", 0)
        return 0
    except Exception:
        return 0


def get_key_files(owner: str, repo: str, token: str) -> dict:
    """
    Light code inspection: read dependency manifests and CI config presence.
    Returns a dict with detected file contents / presence flags.
    """
    result = {
        "has_tests": False,
        "has_docker": False,
        "has_ci": False,
        "dependencies_raw": "",
    }

    # Check root directory listing
    try:
        resp = httpx.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/contents/",
            headers=_headers(token),
            timeout=10,
        )
        if resp.status_code == 200:
            files = {f["name"].lower() for f in resp.json() if isinstance(resp.json(), list)}
            result["has_docker"] = "dockerfile" in files or "docker-compose.yml" in files
            test_dirs = {"tests", "test", "__tests__", "spec"}
            result["has_tests"] = bool(test_dirs & files)
    except Exception:
        pass

    # Check CI
    try:
        resp = httpx.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/contents/.github/workflows",
            headers=_headers(token),
            timeout=10,
        )
        result["has_ci"] = resp.status_code == 200
    except Exception:
        pass

    # Try reading dependency file
    for dep_file in ["requirements.txt", "package.json", "go.mod", "Cargo.toml", "build.gradle"]:
        try:
            resp = httpx.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contents/{dep_file}",
                headers=_headers(token),
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("content", "")
                if data.get("encoding") == "base64":
                    content = base64.b64decode(content).decode("utf-8", errors="replace")
                result["dependencies_raw"] = content[:1500]  # cap at 1500 chars
                break
        except Exception:
            continue

    return result
