from functools import lru_cache
from pathlib import Path

import yaml

from trashapp_shared.settings import settings


@lru_cache(maxsize=1)
def load_rules() -> dict:
    """Load munich_rules.yaml and cache the result for the lifetime of the process."""
    rules_path = Path(settings.rules_path)
    with open(rules_path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_rules_text() -> str:
    """Return the full rules content as a YAML string for use in agent prompts."""
    return yaml.dump(load_rules(), allow_unicode=True, default_flow_style=False)
