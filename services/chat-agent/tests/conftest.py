import sys
from pathlib import Path


# Needed for local workspace test runs: uv selects the package environment, but
# pytest still imports tests from the source tree rather than an installed wheel.
services_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(services_dir / "chat-agent" / "src"))
sys.path.insert(0, str(services_dir / "shared" / "src"))
