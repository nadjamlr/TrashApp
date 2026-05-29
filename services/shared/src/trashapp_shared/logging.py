import logging
import sys


def configure_logging(service_name: str, level: int = logging.INFO) -> None:
    """Set up stdout logging with a consistent format for a named service."""
    logging.basicConfig(
        level=level,
        format=f"%(asctime)s [{service_name}] %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
        force=True,
    )
