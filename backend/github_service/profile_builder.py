"""
Assembles individual repo analyses into a structured GitHubProfile.
Also computes aggregate stats: dominant languages, skill set, activity level.
"""
from collections import Counter
from datetime import datetime, timezone
from typing import Optional


def _activity_level(repos: list[dict]) -> str:
    """Determine overall activity from recent push dates."""
    if not repos:
        return "inactive"
    now = datetime.now(timezone.utc)
    recent = 0
    for r in repos:
        pushed = r.get("pushed_at", "")
        if not pushed:
            continue
        try:
            pushed_dt = datetime.fromisoformat(pushed.replace("Z", "+00:00"))
            if (now - pushed_dt).days < 180:
                recent += 1
        except Exception:
            pass
    ratio = recent / len(repos)
    if ratio > 0.5:
        return "active"
    elif ratio > 0.2:
        return "moderate"
    return "inactive"


def _dominant_languages(analyzed_repos: list[dict]) -> list[str]:
    """Return top languages by total byte count across all repos."""
    totals: Counter = Counter()
    for repo in analyzed_repos:
        for lang, bytes_ in repo.get("all_languages", {}).items():
            totals[lang] += bytes_
    return [lang for lang, _ in totals.most_common(6)]


def _all_skills(analyzed_repos: list[dict]) -> list[str]:
    """Collect unique technologies detected across all repos."""
    seen = set()
    skills = []
    for repo in analyzed_repos:
        for tech in repo.get("ai_technologies", []):
            if tech.lower() not in seen:
                seen.add(tech.lower())
                skills.append(tech)
    return skills


def build_github_profile(user_info: dict, analyzed_repos: list[dict]) -> dict:
    """
    Build a GitHubProfile-compatible dict from user info and analyzed repos.
    Returns a plain dict (serializable to JSON for MongoDB storage).
    """
    username = user_info.get("login", "")

    repos_out = []
    for r in analyzed_repos:
        repos_out.append({
            "name": r.get("name", ""),
            "url": r.get("html_url", ""),
            "description": r.get("description") or "",
            "primary_language": r.get("language") or "",
            "all_languages": r.get("all_languages", {}),
            "topics": r.get("topics", []),
            "stars": r.get("stargazers_count", 0),
            "forks": r.get("forks_count", 0),
            "user_commits": r.get("user_commits", 0),
            "created_at": r.get("created_at", ""),
            "last_pushed": r.get("pushed_at", ""),
            "is_fork": r.get("fork", False),
            "ai_bullets": r.get("ai_bullets", []),
            "ai_technologies": r.get("ai_technologies", []),
            "ai_summary": r.get("ai_summary", ""),
            "ai_tags": r.get("ai_tags", []),
            "include_in_resume": True,
        })

    total_stars = sum(r.get("stargazers_count", 0) for r in analyzed_repos)

    return {
        "username": username,
        "bio": user_info.get("bio") or "",
        "total_public_repos": user_info.get("public_repos", 0),
        "repos": repos_out,
        "dominant_languages": _dominant_languages(analyzed_repos),
        "all_skills_detected": _all_skills(analyzed_repos),
        "activity_level": _activity_level(analyzed_repos),
        "open_source_stars": total_stars,
        "fetched_at": datetime.utcnow().isoformat(),
    }


def profile_to_context_string(profile: dict) -> str:
    """
    Converts a stored GitHubProfile dict into a plain-text context block
    ready to inject into an LLM prompt.
    """
    lines = [
        f"GITHUB USER: {profile.get('username', 'Unknown')}",
    ]
    if profile.get("bio"):
        lines.append(f"Bio: {profile['bio']}")
    lines += [
        f"Public Repos: {profile.get('total_public_repos', 0)}",
        f"Activity Level: {profile.get('activity_level', 'unknown')}",
        f"Open Source Stars (total): {profile.get('open_source_stars', 0)}",
    ]

    dominant = profile.get("dominant_languages", [])
    if dominant:
        lines.append(f"Dominant Languages: {', '.join(dominant)}")

    all_skills = profile.get("all_skills_detected", [])
    if all_skills:
        lines.append(f"All Detected Skills/Technologies: {', '.join(all_skills[:30])}")

    repos = [r for r in profile.get("repos", []) if r.get("include_in_resume", True)]
    if repos:
        lines.append("\nNOTABLE PROJECTS:")
        for i, repo in enumerate(repos[:12], 1):
            star_str = f" (⭐ {repo['stars']} stars)" if repo.get("stars", 0) > 5 else ""
            lines.append(f"\n[{i}] {repo['name']}{star_str}")
            if repo.get("ai_summary"):
                lines.append(f"    Summary: {repo['ai_summary']}")
            if repo.get("ai_technologies"):
                lines.append(f"    Technologies: {', '.join(repo['ai_technologies'])}")
            if repo.get("ai_bullets"):
                lines.append("    Bullets:")
                for b in repo["ai_bullets"]:
                    lines.append(f"      • {b}")

    return "\n".join(lines)
