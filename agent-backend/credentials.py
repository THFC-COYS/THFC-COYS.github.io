"""
Credential manager for job platform logins.

Credentials are stored in a local encrypted file (credentials.enc) using
Fernet symmetric encryption. The encryption key is derived from a master
password set in the environment (CAREER_ENGINE_KEY).

NEVER commit credentials.enc or .env to git.
"""
import base64
import json
import os
from pathlib import Path

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

CREDS_PATH = Path(__file__).parent / "credentials.enc"
SALT = b"career_engine_salt_v1"  # Static salt is fine for local personal use


def _get_fernet() -> "Fernet":
    if not CRYPTO_AVAILABLE:
        raise RuntimeError(
            "cryptography package not installed. Run: pip install cryptography"
        )
    master_key = os.getenv("CAREER_ENGINE_KEY", "")
    if not master_key:
        raise RuntimeError(
            "Set CAREER_ENGINE_KEY in your .env file to encrypt credentials"
        )
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=480000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(master_key.encode()))
    return Fernet(key)


def save_credentials(platform: str, username: str, password: str):
    """
    Store credentials for a job platform.
    Platforms: 'linkedin', 'indeed', 'greenhouse', 'workday_<company>'
    """
    # Load existing
    creds = load_all_credentials()
    creds[platform] = {"username": username, "password": password}

    f = _get_fernet()
    encrypted = f.encrypt(json.dumps(creds).encode())
    CREDS_PATH.write_bytes(encrypted)
    print(f"Credentials saved for: {platform}")


def get_credentials(platform: str) -> dict:
    """
    Retrieve credentials for a platform.
    Returns {'username': ..., 'password': ...} or empty dict if not found.
    """
    creds = load_all_credentials()
    return creds.get(platform, {})


def load_all_credentials() -> dict:
    """Load all stored credentials (decrypted)."""
    if not CREDS_PATH.exists():
        return {}
    try:
        f = _get_fernet()
        decrypted = f.decrypt(CREDS_PATH.read_bytes())
        return json.loads(decrypted)
    except Exception:
        return {}


def list_platforms() -> list[str]:
    """List all platforms that have stored credentials."""
    return list(load_all_credentials().keys())


def delete_credentials(platform: str):
    """Remove credentials for a platform."""
    creds = load_all_credentials()
    if platform in creds:
        del creds[platform]
        f = _get_fernet()
        encrypted = f.encrypt(json.dumps(creds).encode())
        CREDS_PATH.write_bytes(encrypted)


# CLI usage: python credentials.py save linkedin user@email.com mypassword
if __name__ == "__main__":
    import sys
    if len(sys.argv) == 5 and sys.argv[1] == "save":
        _, _, platform, username, password = sys.argv
        save_credentials(platform, username, password)
    elif len(sys.argv) == 3 and sys.argv[1] == "list":
        print("Stored platforms:", list_platforms())
    elif len(sys.argv) == 3 and sys.argv[1] == "delete":
        delete_credentials(sys.argv[2])
        print(f"Deleted credentials for: {sys.argv[2]}")
    else:
        print("Usage:")
        print("  python credentials.py save <platform> <username> <password>")
        print("  python credentials.py list")
        print("  python credentials.py delete <platform>")
        print("\nPlatforms: linkedin, indeed, greenhouse, workday_<company>")
