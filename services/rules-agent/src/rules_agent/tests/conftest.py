import os
from pathlib import Path

# RULES_PATH in .env is relative (e.g. "../data/munich_rules.yaml"), meant to be
# resolved against the container's /app working directory. Pin it to an absolute
# path here so tests pass regardless of the directory pytest is invoked from.
_REPO_ROOT = Path(__file__).resolve().parents[5]
os.environ["RULES_PATH"] = str(_REPO_ROOT / "data" / "munich_rules.yaml")