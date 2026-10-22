"""Convenience launcher for SentinelFlow AI FastAPI backend when executed from backend/ directory."""
import sys
from pathlib import Path

# Add project root (parent directory of backend) to sys.path
project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

import uvicorn

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
