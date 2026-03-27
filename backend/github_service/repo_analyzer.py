"""
AI-powered GitHub repository analyzer.
Takes raw GitHub repo data and generates professional resume bullet points.
"""
import json
import asyncio
from typing import Optional
from langchain_core.messages import HumanMessage

from .github_client import get_repo_languages, get_readme, get_contributor_commit_count, get_key_files


def _score_repo(repo: dict, username: str) -> float:
    """
    Score a repo for relevance/quality. Higher = more worth analyzing.
    Filters out forks, archived repos, and empty repos.
    """
    if repo.get("fork"):
        return -1
    if repo.get("archived"):
        return -1
    if repo.get("size", 0) < 2:
        return -1

    stars = repo.get("stargazers_count", 0)
    forks = repo.get("forks_count", 0)

    # Recency bonus: repos pushed in last year
    from datetime import datetime, timezone
    pushed = repo.get("pushed_at", "")
    recency = 0
    if pushed:
        try:
            pushed_dt = datetime.fromisoformat(pushed.replace("Z", "+00:00"))
            days_old = (datetime.now(timezone.utc) - pushed_dt).days
            if days_old < 365:
                recency = max(0, 5 - days_old // 73)  # up to 5 bonus points
        except Exception:
            pass

    return stars * 3 + forks * 2 + recency + 1


def select_top_repos(repos: list[dict], username: str, max_repos: int = 15) -> list[dict]:
    """Pick the top N repos worth analyzing, filtering junk."""
    scored = [(r, _score_repo(r, username)) for r in repos]
    scored = [(r, s) for r, s in scored if s > 0]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [r for r, _ in scored[:max_repos]]


def _build_analysis_prompt(repo: dict, username: str, languages: dict,
                            readme: str, user_commits: int, key_files: dict) -> str:
    """Build the LLM prompt for analyzing one repository."""

    # Language breakdown as readable string
    total_bytes = sum(languages.values()) or 1
    lang_breakdown = ", ".join(
        f"{lang} {round(bytes_ / total_bytes * 100)}%"
        for lang, bytes_ in sorted(languages.items(), key=lambda x: -x[1])[:5]
    )
    if not lang_breakdown:
        lang_breakdown = repo.get("language") or "Unknown"

    # Trim README to first 2000 chars
    readme_excerpt = (readme[:2000] + "...") if len(readme) > 2000 else readme
    if not readme_excerpt.strip():
        readme_excerpt = "(No README available)"

    # Key file signals
    signals = []
    if key_files.get("has_tests"):
        signals.append("Has test suite")
    if key_files.get("has_docker"):
        signals.append("Dockerized")
    if key_files.get("has_ci"):
        signals.append("CI/CD pipeline configured")
    if key_files.get("dependencies_raw"):
        dep_preview = key_files["dependencies_raw"][:300]
        signals.append(f"Dependencies: {dep_preview}")
    signals_text = "\n".join(signals) if signals else "No additional signals detected"

    stars = repo.get("stargazers_count", 0)
    forks = repo.get("forks_count", 0)

    return f"""You are a professional resume writer. Given information about a GitHub repository, write professional resume-style project bullet points.

REPOSITORY INFORMATION:
Name: {repo['name']}
Description: {repo.get('description') or 'No description'}
Primary Language: {repo.get('language') or 'Unknown'}
Language Breakdown: {lang_breakdown}
Topics/Tags: {', '.join(repo.get('topics', [])) or 'None'}
Stars: {stars} | Forks: {forks}
User's Commits: {user_commits}
Created: {repo.get('created_at', 'Unknown')} | Last Active: {repo.get('pushed_at', 'Unknown')}
Stars > 10: {'Yes' if stars > 10 else 'No'}

CODE SIGNALS:
{signals_text}

README (first 2000 chars):
{readme_excerpt}

TASK:
1. Write 2-4 bullet points suitable for a resume Projects section.
   - Start each with a strong action verb (Built, Developed, Designed, Implemented, Architected...)
   - Include specific technologies from the language breakdown and README
   - Include scale/impact where evidence exists (stars, forks, commit count)
   - If stars > 10, mention community adoption/open-source traction
   - If has_tests or has_ci, mention code quality / engineering practices
   - If Dockerized, mention containerization
   - Mention the core problem being solved if clear from README
   - DO NOT fabricate specifics not present in the provided data
   - DO NOT use vague filler phrases like "utilized various technologies"

2. List the top 3-8 technologies actually used (from languages + topics + README mentions + dependencies)

3. Write a single-sentence project summary (for context, not the resume)

4. Assign 1-4 domain tags from: [backend, frontend, fullstack, machine-learning, data, devops, mobile, api, open-source, automation, tooling, game, security, other]

OUTPUT FORMAT — return ONLY valid JSON, no markdown:
{{
  "bullets": ["...", "...", "..."],
  "technologies": ["Python", "FastAPI", "PostgreSQL"],
  "summary": "...",
  "tags": ["backend", "api"]
}}"""


async def analyze_repo(
    repo: dict,
    username: str,
    token: str,
    llm,
    semaphore: asyncio.Semaphore,
) -> dict:
    """
    Analyze a single repo: fetch supplementary data, run LLM, return enriched dict.
    Uses semaphore to limit concurrent LLM calls.
    """
    owner = repo.get("owner", {}).get("login", username)
    repo_name = repo["name"]

    # Fetch supplementary data (these are sync HTTP calls — run in thread pool)
    loop = asyncio.get_event_loop()
    languages, readme, user_commits, key_files = await asyncio.gather(
        loop.run_in_executor(None, get_repo_languages, owner, repo_name, token),
        loop.run_in_executor(None, get_readme, owner, repo_name, token),
        loop.run_in_executor(None, get_contributor_commit_count, owner, repo_name, username, token),
        loop.run_in_executor(None, get_key_files, owner, repo_name, token),
    )

    # Skip repos where user has very few commits (they barely contributed)
    if user_commits > 0 and user_commits < 3:
        return {**repo, "_skip": True}

    prompt = _build_analysis_prompt(repo, username, languages, readme, user_commits, key_files)

    async with semaphore:
        try:
            # LLM call — run sync invoke in executor to not block event loop
            response = await loop.run_in_executor(
                None, lambda: llm.invoke([HumanMessage(content=prompt)])
            )
            raw = response.content.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                raw = raw.rsplit("```", 1)[0]

            data = json.loads(raw)
        except Exception as e:
            print(f"  ⚠ Failed to analyze {repo_name}: {e}")
            data = {
                "bullets": [f"Developed {repo_name} using {repo.get('language', 'multiple technologies')}"],
                "technologies": [repo.get("language", "Unknown")] if repo.get("language") else [],
                "summary": repo.get("description") or repo_name,
                "tags": ["other"],
            }

    return {
        **repo,
        "ai_bullets": data.get("bullets", []),
        "ai_technologies": data.get("technologies", []),
        "ai_summary": data.get("summary", ""),
        "ai_tags": data.get("tags", []),
        "all_languages": languages,
        "user_commits": user_commits,
    }


async def analyze_repos_parallel(
    repos: list[dict],
    username: str,
    token: str,
    llm,
    max_concurrent: int = 3,
) -> list[dict]:
    """Analyze multiple repos in parallel with controlled concurrency."""
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [analyze_repo(r, username, token, llm, semaphore) for r in repos]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    enriched = []
    for r in results:
        if isinstance(r, Exception):
            print(f"  ⚠ Repo analysis exception: {r}")
            continue
        if isinstance(r, dict) and not r.get("_skip"):
            enriched.append(r)
    return enriched
