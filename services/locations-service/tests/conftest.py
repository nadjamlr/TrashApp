import sys
from pathlib import Path


services_dir = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(services_dir / "locations-service" / "src"))
sys.path.insert(0, str(services_dir / "shared" / "src"))
