# SentinelFlow AI Backend Package
import sys
from pathlib import Path

# Ensure project root is in sys.path so "backend.app..." imports resolve regardless of cwd
_backend_dir = Path(__file__).resolve().parent.parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

__version__ = "1.0.0"
