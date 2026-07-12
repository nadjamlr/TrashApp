from functools import lru_cache
from pathlib import Path

import yaml

from trashapp_shared.settings import settings


@lru_cache(maxsize=1)
def load_rules() -> dict:
    rules_path = Path(settings.rules_path)
    with open(rules_path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_rules_text() -> str:
    return yaml.dump(load_rules(), allow_unicode=True, default_flow_style=False)
