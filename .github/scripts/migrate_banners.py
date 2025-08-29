#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from collections import OrderedDict


ROOT = Path("./")


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def dump_json(path: Path, data):
    # Use 4 spaces indentation and avoid trailing spaces at line ends
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4, separators=(",", ": "))


def build_image_object(item: dict) -> dict | None:
    # Start with any existing structured image data
    image_obj = {}
    if isinstance(item.get("image"), dict):
        for key in ("desktop", "tablet", "mobile"):
            value = item["image"].get(key)
            if isinstance(value, str) and value != "":
                image_obj[key] = value

    # Merge legacy keys
    desktop = item.get("imageUrl")
    mobile = item.get("mobileImageUrl")
    tablet = item.get("tabletImageUrl") or item.get("tabletImageUr")

    if isinstance(desktop, str) and desktop != "":
        image_obj["desktop"] = desktop
    if isinstance(tablet, str) and tablet != "":
        image_obj["tablet"] = tablet
    if isinstance(mobile, str) and mobile != "":
        image_obj["mobile"] = mobile

    return image_obj if image_obj else None


def build_position_object(item: dict) -> dict | None:
    # If already structured, preserve as-is
    if isinstance(item.get("position"), dict):
        # Normalize to only keep non-empty strings
        pos = {}
        for key in ("desktop", "tablet", "mobile"):
            value = item["position"].get(key)
            if isinstance(value, str) and value != "":
                pos[key] = value
        return pos if pos else None

    legacy = item.get("imagePosition")
    if isinstance(legacy, str) and legacy != "":
        # Apply legacy value to both desktop and mobile for consistency
        return {"desktop": legacy, "mobile": legacy}

    return None


def build_video_object(item: dict) -> dict | None:
    # Start with any existing structured video data
    video_obj = {}
    if isinstance(item.get("video"), dict):
        for key in ("desktop", "mobile"):
            value = item["video"].get(key)
            if isinstance(value, str) and value != "":
                video_obj[key] = value

    desktop = item.get("videoUrl")
    mobile = item.get("mobileVideoUrl")

    if isinstance(desktop, str) and desktop != "":
        video_obj["desktop"] = desktop
    if isinstance(mobile, str) and mobile != "":
        video_obj["mobile"] = mobile

    return video_obj if video_obj else None


PREFIX_KEYS = ["id", "show", "type", "view"]
LEGACY_IMAGE_KEYS = {"imageUrl", "mobileImageUrl", "tabletImageUrl", "tabletImageUr"}
LEGACY_POSITION_KEYS = {"imagePosition"}
LEGACY_VIDEO_KEYS = {"videoUrl", "mobileVideoUrl"}
STRUCT_KEYS = {"image", "position", "video"}


def transform_item(item: dict) -> OrderedDict:
    image_obj = build_image_object(item)
    position_obj = build_position_object(item)
    video_obj = build_video_object(item)

    new_item = OrderedDict()

    # 1) Keep common prefix keys first if present
    for key in PREFIX_KEYS:
        if key in item:
            new_item[key] = item[key]

    # 2) Insert structured media keys next
    if video_obj is not None:
        new_item["video"] = video_obj
    if image_obj is not None:
        new_item["image"] = image_obj
    if position_obj is not None:
        new_item["position"] = position_obj

    # 3) Add remaining keys in original order, skipping legacy and duplicates
    skip_keys = set(PREFIX_KEYS) | LEGACY_IMAGE_KEYS | LEGACY_POSITION_KEYS | LEGACY_VIDEO_KEYS | STRUCT_KEYS
    for key, value in item.items():
        if key in skip_keys:
            continue
        if key not in new_item:
            new_item[key] = value

    return new_item


def transform_data(data):
    if isinstance(data, list):
        return [transform_item(item) if isinstance(item, dict) else item for item in data]
    if isinstance(data, dict):
        return transform_item(data)
    return data


def main():
    base = ROOT / "src"
    files = sorted(base.glob("**/banners.json"))

    changed = []
    for path in files:
        try:
            data = load_json(path)
        except Exception as e:
            print(f"[WARN] Skip {path}: cannot parse JSON ({e})")
            continue

        new_data = transform_data(data)

        # Compute new formatted text without trailing spaces and compare to current file content
        try:
            current_text = path.read_text(encoding="utf-8")
        except Exception:
            current_text = ""

        new_text = json.dumps(new_data, ensure_ascii=False, indent=4, separators=(",", ": "))
        if current_text != new_text + ("\n" if not current_text.endswith("\n") else ""):
            # Write back normalized content
            # Ensure file ends with a single trailing newline if original had it
            path.write_text(new_text, encoding="utf-8")
            changed.append(str(path))

    print(f"Migrated {len(changed)} file(s)")
    for p in changed:
        print(p)


if __name__ == "__main__":
    sys.exit(main())

