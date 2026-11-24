"""Fail if any source file exceeds 400 lines; warn above 300 (rules.md §4)."""

import sys
from pathlib import Path

EXT = {".ts", ".tsx", ".py", ".css", ".yaml", ".yml", ".sql", ".j2", ".html"}
SKIP = {"node_modules", ".venv", "dist", "build", "alembic", "ui", "docs", "__pycache__", "internal"}
SKIP_FILES = {"schema.d.ts"}
WARN, MAX = 300, 400


def main() -> int:
    """Walk the repo and report oversized source files."""
    failed = False
    for path in Path(".").rglob("*"):
        if path.suffix not in EXT or path.name in SKIP_FILES:
            continue
        if any(part in SKIP for part in path.parts):
            continue
        lines = sum(1 for _ in path.open(encoding="utf-8", errors="ignore"))
        if lines > MAX:
            print(f"ERROR {lines:>4} lines {path}")
            failed = True
        elif lines > WARN:
            print(f"WARN  {lines:>4} lines {path}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
