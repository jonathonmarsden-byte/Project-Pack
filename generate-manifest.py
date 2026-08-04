#!/usr/bin/env python3
"""
Regenerates assets/datasheets/manifest.json from whatever PDF files
actually sit in that folder. Run this after adding/removing datasheets if
you're NOT using the GitHub Actions workflow (.github/workflows/deploy.yml)
to do it for you automatically on every push.

Usage:
    python3 generate-manifest.py
"""
import json
import os

FOLDER = os.path.join(os.path.dirname(__file__), "assets", "datasheets")


def main():
    files = sorted(f for f in os.listdir(FOLDER) if f.lower().endswith(".pdf"))
    manifest_path = os.path.join(FOLDER, "manifest.json")
    with open(manifest_path, "w") as fh:
        json.dump(files, fh, indent=2)
    print(f"Wrote {manifest_path} with {len(files)} file(s):")
    for f in files:
        print(" -", f)


if __name__ == "__main__":
    main()
