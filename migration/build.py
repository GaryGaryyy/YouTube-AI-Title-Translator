"""Create the old listing's migration update without changing the official build."""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / "YouTube_AI_Title_Translator_v8.0.3.zip"
OUTPUT = ROOT / "YouTube_AI_Title_Translator_v8.0.4_OLD_ID_MIGRATION.zip"
VERSION = "8.0.4"


def build():
    with zipfile.ZipFile(BASE) as archive:
        if archive.testzip() is not None:
            raise ValueError("The original 8.0.3 package is damaged")
        files = {}
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            path = Path(entry.filename)
            if path.is_absolute() or ".." in path.parts:
                raise ValueError("Unsafe source path")
            files[entry.filename] = archive.read(entry)
    original = json.loads(files["manifest.json"])
    if original["version"] != "8.0.3":
        raise ValueError("Expected the original 8.0.3 package")
    manifest = json.loads(files["manifest.json"])
    manifest["version"] = VERSION
    manifest["content_scripts"].append({
        "matches": ["https://*.youtube.com/*"],
        "js": ["migration-notice.js"],
        "run_at": "document_idle",
    })
    for field in ("permissions", "host_permissions", "optional_host_permissions"):
        if manifest.get(field) != original.get(field):
            raise ValueError("The migration must not request additional permissions")
    files["manifest.json"] = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode()
    html = files["popup.html"].decode()
    if html.count("</body>") != 1:
        raise ValueError("Unexpected popup document")
    html = html.replace('"softwareVersion": "8.0.3"', '"softwareVersion": "' + VERSION + '"')
    files["popup.html"] = html.replace("</body>", '  <script src="migration-notice.js"></script>\n</body>').encode()
    files["migration-notice.js"] = (ROOT / "migration" / "notice.js").read_bytes()
    # Keep the old translation logic and existing settings untouched.
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026, 10, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, data)
    with zipfile.ZipFile(OUTPUT) as archive:
        if archive.testzip() is not None:
            raise ValueError("The migration package failed integrity validation")
        if any(archive.read(name) != data for name, data in files.items()):
            raise ValueError("The migration package differs from its sources")
    print(json.dumps({"package": str(OUTPUT), "version": VERSION, "files": len(files),
                      "bytes": OUTPUT.stat().st_size,
                      "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest()}, ensure_ascii=False))


if __name__ == "__main__":
    build()
