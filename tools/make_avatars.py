"""Draw the mathematician avatars as flat SVG portraits.

Run from the repo root:  python tools/make_avatars.py
Writes assets/avatars/<id>.svg. These are illustrated characters inspired by
each mathematician's era and look, not likenesses. Edit the CAST table to tune
hair, beards, clothing and colours, then re-run.
"""
from pathlib import Path

OUT = Path("assets/avatars")

SKIN = {"light": ("#F3D6BD", "#DDB295"), "warm": ("#EBC3A0", "#D2A07C"), "olive": ("#D8AC84", "#BB8B63")}
HAIR = {"black": "#2B221D", "brown": "#4A3324", "auburn": "#6E4127", "chestnut": "#5A3A24",
        "grey": "#A9A49C", "white": "#E9E5DD", "dark": "#33281F"}

CAST = {
    # id: background, skin, hair style, hair colour, facial hair, glasses, clothing, collar
    "noether":      dict(bg="#F6EBDD", skin="light", hair="pulled", hc="chestnut", face_hair=None, glasses=True,  coat="#4F5D6B", collar="blouse"),
    "gauss":        dict(bg="#E5EFF4", skin="light", hair="cap",    hc="white",    face_hair=None, glasses=False, coat="#2F3A46", collar="cravat"),
    "germain":      dict(bg="#F6E6EC", skin="light", hair="updo",   hc="auburn",   face_hair=None, glasses=False, coat="#8C5A6E", collar="dress"),
    "cauchy":       dict(bg="#E3F0EE", skin="light", hair="side",   hc="dark",     face_hair="sideburns", glasses=False, coat="#29353A", collar="cravat"),
    "kovalevskaya": dict(bg="#ECEAF6", skin="light", hair="fringe", hc="brown",    face_hair=None, glasses=False, coat="#3E3B63", collar="lace"),
    "riemann":      dict(bg="#EFE9F6", skin="light", hair="side",   hc="black",    face_hair="beard", glasses=True,  coat="#2E2B38", collar="high"),
    "hypatia":      dict(bg="#F5EEE3", skin="olive", hair="long",   hc="black",    face_hair=None, glasses=False, coat="#E8DCC4", collar="toga"),
    "euler":        dict(bg="#E6EEF6", skin="warm",  hair="wrap",   hc="brown",    face_hair=None, glasses=False, coat="#5B4A3C", collar="robe"),
    "cantor":       dict(bg="#F5EEE0", skin="light", hair="side",   hc="black",    face_hair="beard", glasses=False, coat="#2B2D33", collar="cravat"),
    "archimedes":   dict(bg="#F4EEE1", skin="olive", hair="curly",  hc="grey",     face_hair="curly", glasses=False, coat="#E4D5B8", collar="toga"),
    "weierstrass":  dict(bg="#E6F2EA", skin="warm",  hair="bald",   hc="white",    face_hair="beard", glasses=False, coat="#2D3530", collar="high"),
    "dedekind":     dict(bg="#E3F0EC", skin="light", hair="bald",   hc="grey",     face_hair="beard", glasses=False, coat="#33403D", collar="high"),
}


def hair_back(style, c):
    if style == "pulled":
        return f'<circle cx="60" cy="27" r="10" fill="{c}"/><ellipse cx="60" cy="50" rx="23" ry="25" fill="{c}"/>'
    if style == "updo":
        curls = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r in
                        [(44, 33, 9), (52, 25, 10), (63, 22, 11), (74, 27, 10), (80, 37, 8), (40, 43, 8), (82, 47, 7)])
        return curls + f'<ellipse cx="60" cy="50" rx="22" ry="24" fill="{c}"/>'
    if style == "fringe":
        return f'<circle cx="60" cy="25" r="11" fill="{c}"/><ellipse cx="60" cy="51" rx="23" ry="25" fill="{c}"/>'
    if style == "long":
        return f'<path d="M37 50 Q36 25 60 25 Q84 25 83 50 L86 92 Q74 98 70 86 L50 86 Q46 98 34 92 Z" fill="{c}"/>'
    if style == "curly":
        return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r in
                       [(42, 40, 8), (47, 31, 8), (56, 26, 8), (66, 26, 8), (75, 31, 8), (79, 41, 8), (39, 51, 7), (81, 52, 7)])
    return ""


def hair_front(style, c):
    if style == "pulled":
        return f'<path d="M39 52 Q40 30 60 30 Q80 30 81 52 Q75 38 61 37 Q47 38 39 52 Z" fill="{c}"/>' \
               f'<path d="M60 31 Q58 34 59 38" stroke="#00000022" stroke-width="1" fill="none"/>'
    if style == "cap":
        return (f'<ellipse cx="41.5" cy="50" rx="4.5" ry="9" fill="{c}"/><ellipse cx="78.5" cy="50" rx="4.5" ry="9" fill="{c}"/>'
                '<path d="M39 45 Q40 26 60 26 Q80 26 81 45 Q60 38 39 45 Z" fill="#1F1D1C"/>'
                '<path d="M45 32 Q60 27 75 32" stroke="#ffffff22" stroke-width="1.4" fill="none"/>')
    if style == "updo":
        return f'<path d="M40 51 Q42 32 60 32 Q78 32 80 51 Q74 40 66 41 Q60 36 54 41 Q46 40 40 51 Z" fill="{c}"/>'
    if style == "side":
        return (f'<path d="M39 52 Q38 30 60 29 Q82 30 81 52 Q79 41 70 38 Q58 36 47 41 Q42 45 39 52 Z" fill="{c}"/>'
                f'<path d="M47 41 Q56 33 70 38" stroke="#ffffff18" stroke-width="1.2" fill="none"/>')
    if style == "fringe":
        bumps = "".join(f'<circle cx="{x}" cy="{y}" r="5" fill="{c}"/>' for x, y in [(45, 40), (52, 36), (60, 35), (68, 36), (75, 40)])
        return f'<path d="M39 52 Q39 31 60 31 Q81 31 81 52 Q77 43 60 41 Q43 43 39 52 Z" fill="{c}"/>' + bumps
    if style == "long":
        return (f'<path d="M39 54 Q38 30 60 30 Q82 30 81 54 Q76 40 60 39 Q44 40 39 54 Z" fill="{c}"/>'
                '<path d="M41 42 Q60 34 79 42" stroke="#C9A24B" stroke-width="2.4" fill="none"/>')
    if style == "wrap":
        return ('<path d="M36 48 Q34 18 60 17 Q86 18 84 48 Q72 40 60 40 Q48 40 36 48 Z" fill="#EFE7D8"/>'
                '<path d="M38 40 Q60 26 82 40" stroke="#D6CAB3" stroke-width="2" fill="none"/>'
                '<path d="M40 32 Q60 20 80 32" stroke="#D6CAB3" stroke-width="2" fill="none"/>'
                '<path d="M46 24 Q62 15 76 26" stroke="#D6CAB3" stroke-width="1.6" fill="none"/>'
                f'<ellipse cx="41" cy="54" rx="3.5" ry="6" fill="{c}"/><ellipse cx="79" cy="54" rx="3.5" ry="6" fill="{c}"/>')
    if style == "curly":
        return "".join(f'<circle cx="{x}" cy="{y}" r="5.2" fill="{c}"/>' for x, y in [(46, 38), (53, 34), (60, 33), (67, 34), (74, 38)])
    if style == "bald":
        return (f'<path d="M38 60 Q37 46 42 40 Q44 50 43 60 Z" fill="{c}"/><path d="M82 60 Q83 46 78 40 Q76 50 77 60 Z" fill="{c}"/>'
                f'<path d="M47 33 Q60 29 73 33" stroke="{c}" stroke-width="2" fill="none" opacity=".7"/>')
    return ""


def facial_hair(kind, c):
    if kind == "beard":
        return (f'<path d="M40 58 Q41 86 60 90 Q79 86 80 58 Q78 70 70 71 Q60 74 50 71 Q42 70 40 58 Z" fill="{c}"/>'
                f'<path d="M51 66.5 Q60 62.5 69 66.5 Q64 69 60 68 Q56 69 51 66.5 Z" fill="{c}"/>')
    if kind == "curly":
        base = f'<path d="M41 60 Q43 84 60 88 Q77 84 79 60 Q76 70 68 71 Q60 74 52 71 Q44 70 41 60 Z" fill="{c}"/>'
        curls = "".join(f'<circle cx="{x}" cy="{y}" r="4.2" fill="{c}"/>' for x, y in [(46, 80), (53, 85), (60, 87), (67, 85), (74, 80)])
        return base + curls + f'<path d="M51 66.5 Q60 62.5 69 66.5 Q64 69 60 68 Q56 69 51 66.5 Z" fill="{c}"/>'
    if kind == "sideburns":
        return f'<path d="M40 50 L44 50 Q44 62 46 68 Q41 66 40 58 Z" fill="{c}"/><path d="M80 50 L76 50 Q76 62 74 68 Q79 66 80 58 Z" fill="{c}"/>'
    return ""


def clothing(coat, collar, skin_shade, skin):
    body = f'<path d="M8 124 C12 98 36 87 60 87 C84 87 108 98 112 124 Z" fill="{coat}"/>'
    if collar == "cravat":
        return body + ('<path d="M49 87 L60 104 L71 87 Z" fill="#F5F1E8"/>'
                       '<path d="M54 92 Q60 97 66 92 L63 100 L60 97 L57 100 Z" fill="#EDE7DA"/>')
    if collar == "high":
        return body + '<path d="M49 86 L60 98 L71 86 L69 93 L60 102 L51 93 Z" fill="#F2EEE6"/>'
    if collar == "blouse":
        return body + ('<path d="M50 87 L60 97 L70 87 Z" fill="' + skin + '"/>'
                       '<path d="M49 86 L56 99 L60 95 Z" fill="#F4F1EA"/><path d="M71 86 L64 99 L60 95 Z" fill="#F4F1EA"/>')
    if collar == "dress":
        return body + f'<path d="M42 89 Q60 106 78 89 Q70 88 60 88 Q50 88 42 89 Z" fill="{skin}"/>' \
                      '<path d="M42 89 Q60 106 78 89" stroke="#F3E3EA" stroke-width="2.4" fill="none"/>'
    if collar == "lace":
        scallops = "".join(f'<circle cx="{x}" cy="{y}" r="3.4" fill="#F4F1EA"/>' for x, y in [(49, 91), (54, 94), (60, 95), (66, 94), (71, 91)])
        return body + '<path d="M48 87 Q60 93 72 87 L72 90 Q60 97 48 90 Z" fill="#F4F1EA"/>' + scallops
    if collar == "toga":
        return (f'<path d="M8 124 C12 98 36 87 60 87 C84 87 108 98 112 124 Z" fill="{coat}"/>'
                f'<path d="M40 92 Q30 98 26 124 L40 124 Q42 104 52 94 Z" fill="{skin}"/>'
                '<path d="M52 89 Q74 98 86 124" stroke="#00000018" stroke-width="2.4" fill="none"/>'
                '<path d="M60 88 Q78 96 94 120" stroke="#00000012" stroke-width="2" fill="none"/>')
    if collar == "robe":
        return body + '<path d="M50 87 L60 100 L70 87 Z" fill="#E9DFCC"/><path d="M60 100 L60 124" stroke="#00000022" stroke-width="1.6"/>'
    return body


def face(skin_shade, glasses, has_beard):
    eyes = ('<ellipse cx="53" cy="56" rx="1.8" ry="2.1" fill="#2A2420"/><ellipse cx="67" cy="56" rx="1.8" ry="2.1" fill="#2A2420"/>')
    brows = ('<path d="M49 50.6 Q53 48.6 56.6 50.2" stroke="#3A2E26" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
             '<path d="M63.4 50.2 Q67 48.6 71 50.6" stroke="#3A2E26" stroke-width="1.5" stroke-linecap="round" fill="none"/>')
    nose = f'<path d="M60 57.5 Q58.2 62.6 60.6 63.6" stroke="{skin_shade}" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
    mouth = '<path d="M55.8 67.6 Q60 70.2 64.2 67.6" stroke="#9C5B4C" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
    cheeks = '<circle cx="49" cy="63" r="3.2" fill="#E59A8A" opacity=".18"/><circle cx="71" cy="63" r="3.2" fill="#E59A8A" opacity=".18"/>'
    out = eyes + brows + nose + ("" if has_beard else cheeks)
    if glasses:
        out += ('<circle cx="53" cy="56" r="5.2" stroke="#2E2A28" stroke-width="1.3" fill="#ffffff22"/>'
                '<circle cx="67" cy="56" r="5.2" stroke="#2E2A28" stroke-width="1.3" fill="#ffffff22"/>'
                '<path d="M58.2 56 Q60 54.8 61.8 56" stroke="#2E2A28" stroke-width="1.3" fill="none"/>')
    return out, mouth


def portrait(cfg):
    skin, shade = SKIN[cfg["skin"]]
    hc = HAIR[cfg["hc"]]
    beard = cfg["face_hair"] in ("beard", "curly")
    feats, mouth = face(shade, cfg["glasses"], beard)
    parts = [
        f'<circle cx="60" cy="60" r="60" fill="{cfg["bg"]}"/>',
        hair_back(cfg["hair"], hc),
        f'<path d="M52 70 L52 86 Q60 92 68 86 L68 70 Z" fill="{shade}"/>',
        clothing(cfg["coat"], cfg["collar"], shade, skin),
        f'<ellipse cx="40.5" cy="56" rx="3.6" ry="5.2" fill="{shade}"/><ellipse cx="79.5" cy="56" rx="3.6" ry="5.2" fill="{shade}"/>',
        f'<ellipse cx="60" cy="54" rx="19.5" ry="23" fill="{skin}"/>',
        feats,
        facial_hair(cfg["face_hair"], hc),
        mouth if not beard else '<path d="M56.5 70.2 Q60 72.2 63.5 70.2" stroke="#00000040" stroke-width="1.4" stroke-linecap="round" fill="none"/>',
        hair_front(cfg["hair"], hc),
    ]
    body = "".join(parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">'
            f'<defs><clipPath id="c"><circle cx="60" cy="60" r="60"/></clipPath></defs>'
            f'<g clip-path="url(#c)"><circle cx="60" cy="60" r="60" fill="{cfg["bg"]}"/>'
            f'<g transform="translate(60 64) scale(1.42) translate(-60 -60)">{body}</g></g></svg>\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for avatar_id, cfg in CAST.items():
        (OUT / f"{avatar_id}.svg").write_text(portrait(cfg), encoding="utf-8")
    print(f"Wrote {len(CAST)} avatars to {OUT}/")


if __name__ == "__main__":
    main()
