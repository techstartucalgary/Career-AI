"""
Helper utilities
"""

import hashlib
import re
from typing import List, Set


def generate_cache_key(question_text: str, avatar_id: str, voice_id: str) -> str:
    """
    Generate cache key for a video

    Args:
        question_text: Question text
        avatar_id: Avatar identifier
        voice_id: Voice identifier

    Returns:
        Cache key (MD5 hash)
    """
    cache_input = f"{question_text.strip()}{avatar_id}{voice_id}"
    return hashlib.md5(cache_input.encode('utf-8')).hexdigest()


def calculate_keyword_coverage(
    answer_text: str,
    keywords: List[str]
) -> tuple[float, List[str]]:
    """
    Calculate keyword coverage in an answer

    Args:
        answer_text: User's answer text
        keywords: List of keywords to check for

    Returns:
        Tuple of (coverage_ratio, missing_keywords)
    """
    if not keywords:
        return 1.0, []

    answer_lower = answer_text.lower()

    # Normalize keywords
    normalized_keywords = [kw.lower().strip() for kw in keywords]

    # Find present keywords
    present_keywords = set()
    missing_keywords = []

    for keyword in normalized_keywords:
        # Check for exact match or word boundary match
        if keyword in answer_lower or re.search(r'\b' + re.escape(keyword) + r'\b', answer_lower):
            present_keywords.add(keyword)
        else:
            # Check for partial matches or related terms
            words = keyword.split()
            if len(words) > 1:
                # For multi-word keywords, check if all words are present
                if all(word in answer_lower for word in words):
                    present_keywords.add(keyword)
                else:
                    missing_keywords.append(keyword)
            else:
                missing_keywords.append(keyword)

    coverage = len(present_keywords) / len(normalized_keywords)
    return coverage, missing_keywords


def extract_keywords_from_text(text: str, top_n: int = 20) -> List[str]:
    """
    Extract important keywords from text

    Args:
        text: Text to extract keywords from
        top_n: Number of top keywords to return

    Returns:
        List of keywords
    """
    # Simple keyword extraction (remove common words)
    common_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
        'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
        'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    }

    # Extract words
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())

    # Filter out common words
    keywords = [w for w in words if w not in common_words]

    # Count frequency
    word_freq = {}
    for word in keywords:
        word_freq[word] = word_freq.get(word, 0) + 1

    # Sort by frequency
    sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)

    # Return top N unique keywords
    return [kw[0] for kw in sorted_keywords[:top_n]]


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """
    Truncate text to maximum length

    Args:
        text: Text to truncate
        max_length: Maximum length
        suffix: Suffix to add if truncated

    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text

    return text[:max_length - len(suffix)] + suffix
