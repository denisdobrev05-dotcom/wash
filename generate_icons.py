"""Генерира иконите за PWA програмно (SVG-подобен flat дизайн → PNG).
Дизайн: цветен заоблен фон + бяла водна капка + семпъл силует на кола.
Рисува се при 4x резолюция и се смалява (анти-алиасинг)."""
from PIL import Image, ImageDraw

BG_TOP = (37, 99, 235)      # #2563eb blue-600 (theme_color)
BG_BOTTOM = (29, 78, 216)   # #1d4ed8 blue-700
WHITE = (255, 255, 255)
CAR = (37, 99, 235)         # колата = цвят на фона (изрязана в капката)

def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m

def gradient(size):
    base = Image.new("RGB", (size, size), BG_TOP)
    top = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / (size - 1)
        top.putpixel((0, y), tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)))
    return top.resize((size, size))

def droplet_points(cx, cy, w, h):
    """Точки за капка: заострен връх горе, кръгло дъно."""
    pts = []
    import math
    # долна дъга (кръг)
    r = w / 2
    bottom_cy = cy + h / 2 - r
    for a in range(-30, 211):
        rad = math.radians(a)
        pts.append((cx + r * math.cos(rad), bottom_cy + r * math.sin(rad)))
    # връх
    pts.append((cx, cy - h / 2))
    return pts

def draw_icon(px, radius_frac=0.22):
    S = px * 4
    img = gradient(S)
    d = ImageDraw.Draw(img)
    # водна капка
    cx, cy = S / 2, S * 0.50
    dw, dh = S * 0.52, S * 0.66
    d.polygon(droplet_points(cx, cy, dw, dh), fill=WHITE)
    # блик в капката
    d.ellipse([cx - dw*0.22, cy + dh*0.02, cx - dw*0.02, cy + dh*0.26], fill=(225, 235, 255))
    # семпъл силует на кола, изрязан в капката (цвят на фона)
    car_w = dw * 0.72
    car_h = car_w * 0.34
    bx, by = cx - car_w/2, cy + dh*0.08
    # тяло
    d.rounded_rectangle([bx, by, bx + car_w, by + car_h], radius=car_h*0.35, fill=CAR)
    # покрив (трапец)
    roof_w = car_w * 0.52
    d.polygon([
        (bx + car_w*0.24, by),
        (bx + car_w*0.38, by - car_h*0.55),
        (bx + car_w*0.38 + roof_w*0.55, by - car_h*0.55),
        (bx + car_w*0.76, by),
    ], fill=CAR)
    # колела (бели дупки)
    wr = car_h * 0.30
    wy = by + car_h - wr*0.4
    d.ellipse([bx + car_w*0.20 - wr, wy - wr, bx + car_w*0.20 + wr, wy + wr], fill=WHITE)
    d.ellipse([bx + car_w*0.80 - wr, wy - wr, bx + car_w*0.80 + wr, wy + wr], fill=WHITE)

    img = img.convert("RGB")
    mask = rounded_mask(S, int(S * radius_frac))
    out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out.resize((px, px), Image.LANCZOS)

for size in (192, 512):
    draw_icon(size).save(f"/home/user/wash/icons/icon-{size}.png")
# apple-touch-icon: без прозрачност, по-малко заобляне (iOS сам маскира)
apple = draw_icon(180, radius_frac=0.0)
bg = Image.new("RGBA", (180, 180), BG_TOP + (255,))
bg.alpha_composite(apple)
bg.convert("RGB").save("/home/user/wash/icons/apple-touch-icon.png")
# maskable safe: същата 512 върши работа
print("Иконите са генерирани.")
