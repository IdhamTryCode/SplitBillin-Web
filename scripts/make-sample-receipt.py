"""Bikin struk sintetis (thermal-style, sedikit miring + noise) beserta jawaban benarnya."""
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parent.parent / "receipts"
OUT.mkdir(exist_ok=True)

LINES = [
    ("c", "WARUNG BU TINI"),
    ("c", "Jl. Melati No. 12, Bandung"),
    ("c", "Telp 022-555-0123"),
    ("l", "-" * 32),
    ("l", "12/09/2026 19:42   Kasir: Rina"),
    ("l", "No: 004781          Meja: 7"),
    ("l", "-" * 32),
    ("l", "NASI GORENG SPESIAL"),
    ("r", "2 x 28.000        56.000"),
    ("l", "ES TEH MANIS"),
    ("r", "2 x 8.000         16.000"),
    ("l", "AYAM BAKAR"),
    ("r", "1 x 35.000        35.000"),
    ("r", "Disc Promo        -5.000"),
    ("l", "KERUPUK"),
    ("r", "1 x 5.000          5.000"),
    ("l", "-" * 32),
    ("r", "Subtotal         107.000"),
    ("r", "Service 5%         5.350"),
    ("r", "PB1 10%           11.235"),
    ("r", "Pembulatan            15"),
    ("l", "=" * 32),
    ("r", "TOTAL            123.600"),
    ("l", "=" * 32),
    ("r", "Tunai            150.000"),
    ("r", "Kembali           26.400"),
    ("c", ""),
    ("c", "TERIMA KASIH"),
]

# Subtotal di struk sudah setelah diskon (107.000), seperti kebanyakan struk POS.
TRUTH = {
    "is_receipt": True,
    "merchant": "WARUNG BU TINI",
    "date": "2026-09-12",
    "discount": 0,
    "tax_included": False,
    "other_fees_total": 0,
    "items": [
        {"name": "NASI GORENG SPESIAL", "qty": 2, "unit_price": 28000, "line_total": 56000, "discount": 0},
        {"name": "ES TEH MANIS", "qty": 2, "unit_price": 8000, "line_total": 16000, "discount": 0},
        {"name": "AYAM BAKAR", "qty": 1, "unit_price": 35000, "line_total": 35000, "discount": 5000},
        {"name": "KERUPUK", "qty": 1, "unit_price": 5000, "line_total": 5000, "discount": 0},
    ],
    "subtotal": 107000,
    "service_charge": 5350,
    "tax": 11235,
    "rounding": 15,
    "total": 123600,
}

random.seed(7)
font = ImageFont.truetype(r"C:\Windows\Fonts\cour.ttf", 22)
W, LH, PAD = 420, 30, 24
H = PAD * 2 + LH * len(LINES)
img = Image.new("RGB", (W, H), (246, 244, 238))
d = ImageDraw.Draw(img)
y = PAD
for align, text in LINES:
    w = d.textlength(text, font=font)
    x = {"l": PAD, "c": (W - w) / 2, "r": W - PAD - w}[align]
    if align == "r" and text.strip():
        x = PAD
    d.text((x, y), text, font=font, fill=(40, 40, 40))
    y += LH

# Kondisi foto: sedikit miring, buram, noise, kontras turun
img = img.rotate(2.2, expand=True, fillcolor=(120, 105, 85), resample=Image.BICUBIC)
img = img.filter(ImageFilter.GaussianBlur(0.8))
px = img.load()
for _ in range(img.width * img.height // 25):
    i, j = random.randrange(img.width), random.randrange(img.height)
    r, g, b = px[i, j]
    n = random.randint(-18, 18)
    px[i, j] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))

img.save(OUT / "sample-warung.jpg", quality=80)
(OUT / "sample-warung.truth.json").write_text(json.dumps(TRUTH, indent=2), encoding="utf-8")
print("ok", OUT / "sample-warung.jpg", img.size)
