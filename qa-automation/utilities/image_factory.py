"""Generates the invalid-input fixtures /predict needs to be tested against
(blank, corrupted, unsupported format) without checking binary fixtures into
the repo. Valid dental X-ray images are instead read from the project's own
`positive_xrays/` directory — see api-tests/conftest.py.
"""
from pathlib import Path

from PIL import Image

TESTDATA_DIR = Path(__file__).resolve().parent.parent / "testdata" / "generated"


def blank_image_path():
    TESTDATA_DIR.mkdir(parents=True, exist_ok=True)
    path = TESTDATA_DIR / "blank.png"
    # Flat gray image: app.py rejects anything with std-dev < 2.0 as blank.
    Image.new("RGB", (256, 256), color=(128, 128, 128)).save(path)
    return path


def corrupted_image_path():
    TESTDATA_DIR.mkdir(parents=True, exist_ok=True)
    path = TESTDATA_DIR / "corrupted.png"
    # Valid PNG header followed by garbage — fails Image.verify() in app.py.
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + b"not a real png payload" * 20)
    return path


def unsupported_format_path():
    TESTDATA_DIR.mkdir(parents=True, exist_ok=True)
    path = TESTDATA_DIR / "not-an-image.txt"
    path.write_text("This is a plain text file, not an image.")
    return path


def non_xray_photo_path():
    TESTDATA_DIR.mkdir(parents=True, exist_ok=True)
    path = TESTDATA_DIR / "non_xray_photo.png"
    # High-variance color image — passes the blank check but should still be
    # rejected by the xray_validator.h5 model, not the caries model.
    import random

    random.seed(42)
    img = Image.new("RGB", (256, 256))
    pixels = img.load()
    for x in range(256):
        for y in range(256):
            pixels[x, y] = (random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))
    img.save(path)
    return path
