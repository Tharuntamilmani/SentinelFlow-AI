import sys
from pathlib import Path

# Add project root to sys.path so "backend.app" imports always resolve
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
