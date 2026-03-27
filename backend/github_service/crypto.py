"""
Token encryption/decryption using Fernet symmetric encryption.
GitHub access tokens are NEVER stored in plaintext.
"""
import os
import base64
from cryptography.fernet import Fernet


def _get_fernet() -> Fernet:
    key = os.getenv("GITHUB_TOKEN_ENCRYPTION_KEY")
    if not key:
        # Auto-generate and warn — in production this env var must be set
        print("⚠  GITHUB_TOKEN_ENCRYPTION_KEY not set. Generating ephemeral key (tokens won't survive restarts).")
        key = Fernet.generate_key().decode()
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_token(token: str) -> str:
    """Encrypt a GitHub access token for storage."""
    return _get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    """Decrypt a stored GitHub access token."""
    return _get_fernet().decrypt(encrypted.encode()).decode()
