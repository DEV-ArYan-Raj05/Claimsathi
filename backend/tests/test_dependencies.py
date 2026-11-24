"""Vercel may install from pyproject.toml or requirements.txt: both must pin the same packages."""

import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_pyproject_and_requirements_pin_the_same_runtime_dependencies() -> None:
    reqs = [
        line.split("#")[0].strip()
        for line in (ROOT / "requirements.txt").read_text(encoding="utf-8").splitlines()
        if line.split("#")[0].strip()
    ]
    pyproject = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    assert pyproject["project"]["dependencies"] == reqs
    assert all("==" in r for r in reqs), "pin every runtime dependency (rules.md §5)"
