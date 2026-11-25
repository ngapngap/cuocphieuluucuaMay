#!/usr/bin/env python3
"""
tools/check_glb.py — Bo kiem dinh tu dong Dat / Khong Dat (QA Pass/Warn/Fail Gate)
cho cac file .glb xuat tu Blender 4.x dung trong "Cuoc Phieu Luu Cua May" (Three.js).

Khong can cai thu vien ngoai (chi dung Python 3 stdlib).
Cach dung:
  python tools/check_glb.py assets/models/may_rigged.glb
  python tools/check_glb.py assets/models/lm_lighthouse.glb --type landmark
  python tools/check_glb.py assets/models/
"""

import argparse
import glob
import json
import math
import os
import struct
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ---- Nguong dinh luong (khop bang 10.1 trong BLENDER_ASSET_SPEC.md) ----
BUDGETS = {
    "player": {
        "max_tris": 9000,
        "max_bones": 32,
        "max_mats": 4,
        "max_tex_px": 1024,
        "max_mb": 3.5,
        "require_skin": True,
        "ground_check": True,
        "height_range": (1.25, 1.65),
    },
    "npc": {
        "max_tris": 3500,
        "max_bones": 20,
        "max_mats": 2,
        "max_tex_px": 1024,
        "max_mb": 1.5,
        "require_skin": True,
        "ground_check": True,
    },
    "companion": {
        "max_tris": 3500,
        "max_bones": 20,
        "max_mats": 2,
        "max_tex_px": 1024,
        "max_mb": 1.5,
        "require_skin": True,
        "ground_check": False,
    },
    "creature": {
        "max_tris": 3500,
        "max_bones": 24,
        "max_mats": 2,
        "max_tex_px": 1024,
        "max_mb": 1.5,
        "require_skin": True,
        "ground_check": False,
    },
    "boss": {
        "max_tris": 7000,
        "max_bones": 28,
        "max_mats": 3,
        "max_tex_px": 1024,
        "max_mb": 2.5,
        "require_skin": True,
        "ground_check": False,
    },
    "landmark": {
        "max_tris": 9500,
        "max_bones": 0,
        "max_mats": 3,
        "max_tex_px": 1024,
        "max_mb": 3.0,
        "require_skin": False,
        "ground_check": True,
    },
    "env": {
        "max_tris": 1800,       # Ap dung tren moi mesh LOD0
        "max_tris_lod1": 500,   # Ap dung tren moi mesh LOD1
        "max_bones": 0,
        "max_mats": 2,
        "max_tex_px": 1024,
        "max_mb": 2.0,
        "require_skin": False,
        "ground_check": False,
    },
    "prop": {
        "max_tris": 2500,
        "max_bones": 6,
        "max_mats": 2,
        "max_tex_px": 1024,
        "max_mb": 1.0,
        "require_skin": False,
        "ground_check": False,
    },
}

PLAYER_REQUIRED_CLIPS = [
    "Idle", "Walk", "Run", "Jump_Start", "Fall_Loop", "Glide",
    "Swim_Idle", "Swim_Move", "Cast_Spell", "Interact_Pet", "Hit_Hurt", "Victory",
]

BOSS_WEAKPOINT_HINTS = {
    "kraken": "Socket_Mouth",
    "mushroom": "Layer_MudShield",
    "scorpion": "Node_TailTip",
    "golem": "Layer_DarkArmor",
    "icewolf": "Mane_Frost",
    "storm": "Layer_StormShield",
}

LANDMARK_CC0_FILES = {"cc0_cabin.glb", "cc0_windmill.glb", "cc0_shipwreck.glb"}
CREATURE_CC0_FILES = {
    "cc0_alpaca.glb", "cc0_deer.glb", "cc0_fox.glb", "cc0_reindeer.glb",
    "cc0_unicorn.glb", "cc0_crab.glb", "cc0_dolphin.glb", "cc0_whale.glb",
    "cc0_clownfish.glb",
}


def detect_category(path):
    base = os.path.basename(path).lower()
    if base.startswith("may"):
        return "player"
    if base.startswith("npc_"):
        return "npc"
    if base.startswith("companion_"):
        return "companion"
    if base.startswith("boss_"):
        return "boss"
    if base.startswith(("lm_", "hero_")) or base in LANDMARK_CC0_FILES:
        return "landmark"
    if base in CREATURE_CC0_FILES or base.startswith("creature_"):
        return "creature"
    if base.startswith("env_"):
        return "env"
    return "prop"


def parse_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    if len(data) < 20 or data[:4] != b"glTF":
        raise ValueError("Khong phai file GLB hop le (sai header magic 'glTF').")
    version, total_len = struct.unpack_from("<II", data, 4)
    if version != 2:
        raise ValueError(f"Chi ho tro glTF 2.0 (phien ban file: {version}).")

    offset = 12
    gltf_json = None
    bin_chunk = b""
    while offset + 8 <= len(data):
        chunk_len, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk_data = data[offset:offset + chunk_len]
        offset += chunk_len
        if chunk_type == 0x4E4F534A:  # JSON
            gltf_json = json.loads(chunk_data.decode("utf-8"))
        elif chunk_type == 0x004E4942:  # BIN
            bin_chunk = chunk_data
    if gltf_json is None:
        raise ValueError("File GLB khong co JSON chunk.")
    return gltf_json, bin_chunk, len(data)


def parse_image_size(blob):
    """Doc kich thuoc (width, height) cua PNG / JPEG / WebP tu byte dau tien."""
    if len(blob) < 24:
        return None
    # PNG
    if blob[:8] == b"\x89PNG\r\n\x1a\n" and blob[12:16] == b"IHDR":
        return struct.unpack_from(">II", blob, 16)
    # WebP
    if blob[:4] == b"RIFF" and blob[8:12] == b"WEBP":
        fourcc = blob[12:16]
        if fourcc == b"VP8X" and len(blob) >= 30:
            w = 1 + int.from_bytes(blob[24:27], "little")
            h = 1 + int.from_bytes(blob[27:30], "little")
            return (w, h)
        if fourcc == b"VP8 " and len(blob) >= 30:
            w = struct.unpack_from("<H", blob, 26)[0] & 0x3FFF
            h = struct.unpack_from("<H", blob, 28)[0] & 0x3FFF
            return (w, h)
        if fourcc == b"VP8L" and len(blob) >= 25:
            bits = struct.unpack_from("<I", blob, 21)[0]
            return ((bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1)
    # JPEG
    if blob[:2] == b"\xff\xd8":
        i = 2
        n = len(blob)
        while i + 9 < n:
            if blob[i] != 0xFF:
                i += 1
                continue
            while i < n and blob[i] == 0xFF:
                i += 1
            if i >= n:
                break
            marker = blob[i]
            i += 1
            if marker in (0xD8, 0xD9, 0x01) or (0xD0 <= marker <= 0xD7):
                continue
            if i + 2 > n:
                break
            seg_len = struct.unpack_from(">H", blob, i)[0]
            if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                if i + 7 <= n:
                    h, w = struct.unpack_from(">HH", blob, i + 3)
                    return (w, h)
            if seg_len < 2:
                break
            i += seg_len
    return None


def primitive_tris(prim, accessors):
    mode = prim.get("mode", 4)
    if "indices" in prim:
        count = accessors[prim["indices"]].get("count", 0)
    else:
        pos_idx = prim.get("attributes", {}).get("POSITION")
        count = accessors[pos_idx].get("count", 0) if pos_idx is not None else 0
    if mode == 4:  # TRIANGLES
        return count // 3
    if mode in (5, 6):  # TRIANGLE_STRIP / TRIANGLE_FAN
        return max(0, count - 2)
    return 0


def mat4_mul(a, b):
    out = [0.0] * 16
    for col in range(4):
        for row in range(4):
            out[col * 4 + row] = sum(a[k * 4 + row] * b[col * 4 + k] for k in range(4))
    return out


def node_local_matrix(node):
    if "matrix" in node:
        return list(node["matrix"])
    tx, ty, tz = node.get("translation", [0.0, 0.0, 0.0])
    qx, qy, qz, qw = node.get("rotation", [0.0, 0.0, 0.0, 1.0])
    sx, sy, sz = node.get("scale", [1.0, 1.0, 1.0])

    x2, y2, z2 = qx + qx, qy + qy, qz + qz
    xx, xy, xz = qx * x2, qx * y2, qx * z2
    yy, yz, zz = qy * y2, qy * z2, qz * z2
    wx, wy, wz = qw * x2, qw * y2, qw * z2

    return [
        (1.0 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0.0,
        (xy - wz) * sy, (1.0 - (xx + zz)) * sy, (yz + wx) * sy, 0.0,
        (xz + wy) * sz, (yz - wx) * sz, (1.0 - (xx + yy)) * sz, 0.0,
        tx, ty, tz, 1.0,
    ]


def transform_point(m, p):
    x, y, z = p
    return (
        m[0] * x + m[4] * y + m[8] * z + m[12],
        m[1] * x + m[5] * y + m[9] * z + m[13],
        m[2] * x + m[6] * y + m[10] * z + m[14],
    )


def compute_world_matrices(gltf):
    nodes = gltf.get("nodes", [])
    n = len(nodes)
    parents = [-1] * n
    for idx, nd in enumerate(nodes):
        for ch in nd.get("children", []):
            if 0 <= ch < n:
                parents[ch] = idx
    ident = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0]
    cache = {}

    def world(i):
        if i in cache:
            return cache[i]
        loc = node_local_matrix(nodes[i])
        p = parents[i]
        res = mat4_mul(world(p), loc) if p >= 0 else loc
        cache[i] = res
        return res

    return [world(i) for i in range(n)], set(i for i, p in enumerate(parents) if p == -1), ident


def audit_glb(path, forced_type=None, strict_uv2=False):
    cat = forced_type or detect_category(path)
    cfg = BUDGETS[cat]
    fails = []
    warns = []

    try:
        gltf, bin_chunk, byte_size = parse_glb(path)
    except Exception as ex:
        return {
            "path": path, "type": cat, "status": "FAIL",
            "fails": [f"[F00] Khong doc duoc file GLB: {ex}"], "warns": [], "stats": {},
        }

    size_mb = byte_size / (1024 * 1024)
    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])
    accessors = gltf.get("accessors", [])
    buffer_views = gltf.get("bufferViews", [])
    materials = gltf.get("materials", [])
    images = gltf.get("images", [])
    skins = gltf.get("skins", [])
    animations = gltf.get("animations", [])
    exts_used = set(gltf.get("extensionsUsed", []) + gltf.get("extensionsRequired", []))

    # Collect bone indices so bone scaling (neu co) khong bi nham la unapplied mesh scale
    joint_indices = set()
    for sk in skins:
        joint_indices.update(sk.get("joints", []))

    # F08: Draco check
    if "KHR_draco_mesh_compression" in exts_used:
        fails.append("[F08] File dang bat nen Draco (KHR_draco_mesh_compression) — tat Compression trong Blender khi xuat offline!")

    # F07 / W01: File size
    if size_mb > cfg["max_mb"]:
        fails.append(f"[F07] Dung luong {size_mb:.2f} MB vuot tran {cfg['max_mb']:.2f} MB cho nhom '{cat}'.")
    elif size_mb > cfg["max_mb"] * 0.85:
        warns.append(f"[W01] Dung luong {size_mb:.2f} MB cham >85% tran ({cfg['max_mb']:.2f} MB).")

    # F01: Unapplied scale on root / mesh nodes
    world_mats, root_nodes, _ = compute_world_matrices(gltf)
    unapplied_nodes = []
    for idx, nd in enumerate(nodes):
        if idx in joint_indices:
            continue
        if "scale" in nd and ("mesh" in nd or idx in root_nodes):
            sx, sy, sz = nd["scale"]
            if any(abs(v - 1.0) > 0.015 for v in (sx, sy, sz)):
                unapplied_nodes.append(f"{nd.get('name', f'node_{idx}')}({sx:.2f},{sy:.2f},{sz:.2f})")
    if unapplied_nodes:
        fails.append(f"[F01] Chua Apply Scale (Ctrl+A -> All Transforms): {', '.join(unapplied_nodes[:5])}")

    # Mesh inspection: tris, UV1, UV2, >4 weights, morph targets, bounding box, COL_*, LOD0/LOD1
    node_names = [nd.get("name", "") for nd in nodes]
    mesh_to_nodes = {}
    for idx, nd in enumerate(nodes):
        if "mesh" in nd:
            mesh_to_nodes.setdefault(nd["mesh"], []).append(idx)

    total_vis_tris = 0
    lod0_max_tris = 0
    lod1_max_tris = 0
    has_lod0 = False
    has_lod1 = False
    col_solid_nodes = []
    col_walk_nodes = []
    missing_uv1 = []
    has_uv2_any = False
    has_extra_weights = False
    has_skin_attrs = False
    has_morphs = False
    bb_min = [math.inf, math.inf, math.inf]
    bb_max = [-math.inf, -math.inf, -math.inf]

    for m_idx, mesh in enumerate(meshes):
        m_name = mesh.get("name", f"mesh_{m_idx}")
        owner_nodes = mesh_to_nodes.get(m_idx, [])
        owner_names = [nodes[ni].get("name", "") for ni in owner_nodes] or [m_name]
        is_col = any(nm.startswith("COL_") for nm in owner_names) or m_name.startswith("COL_")
        if is_col:
            for nm in owner_names:
                if nm.startswith("COL_Walk"):
                    col_walk_nodes.append(nm)
                elif nm.startswith("COL_"):
                    col_solid_nodes.append(nm)
            continue

        is_lod0 = any(nm.endswith("_LOD0") for nm in owner_names) or m_name.endswith("_LOD0")
        is_lod1 = any(nm.endswith("_LOD1") for nm in owner_names) or m_name.endswith("_LOD1")
        if is_lod0:
            has_lod0 = True
        if is_lod1:
            has_lod1 = True

        mesh_tris = 0
        for prim in mesh.get("primitives", []):
            mesh_tris += primitive_tris(prim, accessors)
            attrs = prim.get("attributes", {})
            if "TEXCOORD_0" not in attrs:
                missing_uv1.append(m_name)
            if "TEXCOORD_1" in attrs:
                has_uv2_any = True
            if "JOINTS_0" in attrs and "WEIGHTS_0" in attrs:
                has_skin_attrs = True
            if "JOINTS_1" in attrs or "WEIGHTS_1" in attrs:
                has_extra_weights = True
            if prim.get("targets"):
                has_morphs = True

            # Bounding box tu POSITION min/max
            pos_acc_idx = attrs.get("POSITION")
            if pos_acc_idx is not None:
                acc = accessors[pos_acc_idx]
                pmin = acc.get("min")
                pmax = acc.get("max")
                if pmin and pmax and len(pmin) == 3 and len(pmax) == 3:
                    corners = [
                        (pmin[0], pmin[1], pmin[2]), (pmax[0], pmin[1], pmin[2]),
                        (pmin[0], pmax[1], pmin[2]), (pmax[0], pmax[1], pmin[2]),
                        (pmin[0], pmin[1], pmax[2]), (pmax[0], pmin[1], pmax[2]),
                        (pmin[0], pmax[1], pmax[2]), (pmax[0], pmax[1], pmax[2]),
                    ]
                    target_mats = [world_mats[ni] for ni in owner_nodes] if owner_nodes else [
                        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
                    ]
                    for wm in target_mats:
                        for c in corners:
                            tp = transform_point(wm, c)
                            for k in range(3):
                                if tp[k] < bb_min[k]:
                                    bb_min[k] = tp[k]
                                if tp[k] > bb_max[k]:
                                    bb_max[k] = tp[k]

        if is_lod0:
            lod0_max_tris = max(lod0_max_tris, mesh_tris)
        if is_lod1:
            lod1_max_tris = max(lod1_max_tris, mesh_tris)
        if not is_lod1:
            total_vis_tris += mesh_tris

    # F04 / W01: Triangles
    if cat == "env" and (has_lod0 or has_lod1):
        if lod0_max_tris > cfg["max_tris"]:
            fails.append(f"[F04] Mesh LOD0 lon nhat co {lod0_max_tris} tris > tran {cfg['max_tris']} tris.")
        if lod1_max_tris > cfg["max_tris_lod1"]:
            fails.append(f"[F04] Mesh LOD1 lon nhat co {lod1_max_tris} tris > tran {cfg['max_tris_lod1']} tris.")
    else:
        if total_vis_tris > cfg["max_tris"]:
            fails.append(f"[F04] Tong so tam giac {total_vis_tris} vuot tran {cfg['max_tris']} cho nhom '{cat}'.")
        elif total_vis_tris > cfg["max_tris"] * 0.85:
            warns.append(f"[W01] So tam giac {total_vis_tris} cham >85% tran ({cfg['max_tris']}).")

    # F04: Materials
    if len(materials) > cfg["max_mats"]:
        fails.append(f"[F04] So Material ({len(materials)}) vuot tran {cfg['max_mats']} (nen gop Trim Sheet / Atlas).")

    # F04: > 4 bone weights per vertex
    if has_extra_weights:
        fails.append("[F04] Co dinh chiu >4 xuong (JOINTS_1/WEIGHTS_1) — trong Blender chay Weights -> Limit Total (4)!")

    # F04 / F09: Bones / Skins
    max_bones_found = max((len(sk.get("joints", [])) for sk in skins), default=0)
    if cfg["require_skin"]:
        if not skins or not has_skin_attrs:
            fails.append(f"[F09] Nhom '{cat}' bat buoc co bo xuong (SkinnedMesh), hien co 0 skin.")
        elif max_bones_found > cfg["max_bones"]:
            fails.append(f"[F04] So xuong ({max_bones_found}) vuot tran {cfg['max_bones']} cho nhom '{cat}'.")
    else:
        if max_bones_found > cfg["max_bones"]:
            fails.append(f"[F04] Nhom tinh '{cat}' co {max_bones_found} xuong > tran {cfg['max_bones']}.")

    # F02: Origin & Height checks
    height = (bb_max[1] - bb_min[1]) if bb_min[1] < math.inf else None
    min_y = bb_min[1] if bb_min[1] < math.inf else None
    if cfg.get("ground_check") and min_y is not None:
        tol = 0.08 if cat == "player" else 0.15
        if abs(min_y) > tol:
            fails.append(f"[F02] Goc toa do (Origin) lech day chan: minY = {min_y:.3f} m (cho phep trong +-{tol:.2f} m).")
    if "height_range" in cfg and height is not None:
        lo, hi = cfg["height_range"]
        if not (lo <= height <= hi):
            fails.append(f"[F02] Chieu cao {height:.2f} m nam ngoai khoang chuan {lo:.2f}-{hi:.2f} m.")

    # F06 / W03: UV1 & UV2
    if missing_uv1:
        uniq = list(dict.fromkeys(missing_uv1))[:5]
        fails.append(f"[F06] Mesh hien thi thieu UV1 (TEXCOORD_0): {', '.join(uniq)}")
    if cat == "landmark" and not has_uv2_any:
        msg = "[W03] Cong trinh Landmark chua co kenh UV2 (TEXCOORD_1) de nuong Lightmap/AO."
        if strict_uv2:
            fails.append(msg.replace("[W03]", "[F06]"))
        else:
            warns.append(msg)

    # F06: Material texCoord sanity check (catches Blender exporter texCoord=-1 bug!)
    bad_texcoords = []
    for mi, mat in enumerate(materials):
        pbr = mat.get("pbrMetallicRoughness", {})
        for slot_name, slot in (
            ("baseColorTexture", pbr.get("baseColorTexture")),
            ("metallicRoughnessTexture", pbr.get("metallicRoughnessTexture")),
            ("normalTexture", mat.get("normalTexture")),
            ("emissiveTexture", mat.get("emissiveTexture")),
            ("occlusionTexture", mat.get("occlusionTexture")),
        ):
            if isinstance(slot, dict) and slot.get("texCoord", 0) < 0:
                bad_texcoords.append(f"{mat.get('name', f'mat_{mi}')}.{slot_name}={slot.get('texCoord')}")
    if bad_texcoords:
        fails.append(f"[F06] Material co texCoord khong hop le (<0): {', '.join(bad_texcoords[:4])}")

    # F06 / F07 / W02: Images & Textures
    max_tex_dim = 0
    for img_idx, img in enumerate(images):
        if "uri" in img and not str(img["uri"]).startswith("data:"):
            fails.append(f"[F06] Anh '{img['uri']}' de ngoai file (chua nhung vao .glb)!")
            continue
        bv_idx = img.get("bufferView")
        if bv_idx is not None and bv_idx < len(buffer_views):
            bv = buffer_views[bv_idx]
            off = bv.get("byteOffset", 0)
            blen = bv.get("byteLength", 0)
            blob = bin_chunk[off:off + blen]
            dims = parse_image_size(blob)
            mime = img.get("mimeType", "")
            if dims:
                w, h = dims
                max_tex_dim = max(max_tex_dim, w, h)
                if max(w, h) > cfg["max_tex_px"]:
                    fails.append(f"[F07] Texture #{img_idx} ({w}x{h}px) vuot tran {cfg['max_tex_px']}px.")
            if mime == "image/png" and blen > 300 * 1024:
                warns.append(f"[W02] Texture #{img_idx} dang la PNG nang ({blen // 1024} KB) — nen doi sang WebP/JPEG 85%.")

    # F09 / F11 / W06: Category-specific Animations, Sockets, COL_*, LOD, Weakpoints
    anim_names = [a.get("name", "") for a in animations]
    anim_lower = [a.lower() for a in anim_names]
    all_names_set = set(node_names)

    if cat == "player":
        for req_sock in ("Socket_Staff", "Socket_Back"):
            if req_sock not in all_names_set:
                fails.append(f"[F09] Thieu xuong neo bat buoc '{req_sock}' trong may_rigged.glb.")
        if not any(n.startswith("Outfit_") for n in node_names):
            fails.append("[F09] Thieu cac node trang phuc 'Outfit_*' (vi du Outfit_VayHong).")
        if "Gear_GayPhep" not in all_names_set:
            warns.append("[W06] Chua thay node 'Gear_GayPhep' trong may_rigged.glb.")
        missing_clips = [c for c in PLAYER_REQUIRED_CLIPS if c.lower() not in anim_lower]
        if missing_clips:
            fails.append(f"[F09] Thieu {len(missing_clips)} clip animation cua May: {', '.join(missing_clips)}")
        if not has_morphs:
            warns.append("[W06] Chua co Shape Keys bieu cam mat (Blink, Smile, Surprised, Talk_Open).")

    elif cat == "npc":
        if not any("idle" in a for a in anim_lower):
            fails.append("[F09] NPC thieu clip animation 'Idle'.")
        if not any("talk" in a for a in anim_lower):
            fails.append("[F09] NPC thieu clip animation 'Talk'.")

    elif cat == "companion":
        if len(anim_names) < 2:
            fails.append(f"[F09] Ban dong hanh can >=2 clip animation (hien co {len(anim_names)}).")

    elif cat == "creature":
        if len(anim_names) < 1:
            fails.append(f"[F09] Sinh vat co xuong can >=1 clip animation (hien co {len(anim_names)}).")

    elif cat == "boss":
        if len(anim_names) < 5:
            fails.append(f"[F09] Boss can toi thieu 5 clip animation chuan (Intro/Idle/Attack/Stun/Defeat), hien co {len(anim_names)}.")
        b_base = os.path.basename(path).lower()
        expected_wp = None
        for key, node_hint in BOSS_WEAKPOINT_HINTS.items():
            if key in b_base:
                expected_wp = node_hint
                break
        if expected_wp:
            if expected_wp not in all_names_set:
                fails.append(f"[F11] Boss thieu node diem yeu '{expected_wp}' theo co che game.")
        elif not any(n.startswith(("Layer_", "Socket_", "Node_", "Core_", "Mane_")) for n in node_names):
            fails.append("[F11] Boss thieu node co che diem yeu (Layer_* / Socket_* / Core_*).")

    elif cat == "landmark":
        if not col_solid_nodes and not col_walk_nodes:
            fails.append("[F11] Landmark thieu mesh va cham proxy 'COL_Solid_*' hoac 'COL_Walk_*'.")

    elif cat == "env":
        if not (has_lod0 and has_lod1):
            fails.append("[F11] Tai san moi truong 'env_*' thieu cap hau to '_LOD0' va '_LOD1'.")

    elif cat == "prop" and "cracked_wall" in os.path.basename(path).lower():
        shards = [n for n in node_names if n.startswith("Shard_")]
        if len(shards) < 8:
            fails.append(f"[F11] prop_cracked_wall can >=8 manh vo 'Shard_*' (Cell Fracture), hien co {len(shards)}.")

    status = "FAIL" if fails else ("WARN" if warns else "PASS")
    return {
        "path": path,
        "type": cat,
        "status": status,
        "fails": fails,
        "warns": warns,
        "stats": {
            "mb": round(size_mb, 2),
            "tris": total_vis_tris,
            "mats": len(materials),
            "bones": max_bones_found,
            "anims": len(anim_names),
            "images": len(images),
            "max_tex_px": max_tex_dim,
            "uv2": has_uv2_any,
            "cols": len(col_solid_nodes) + len(col_walk_nodes),
            "height_m": round(height, 2) if height is not None else None,
            "min_y": round(min_y, 3) if min_y is not None else None,
        },
    }


def expand_inputs(targets):
    out = []
    for t in targets:
        if os.path.isdir(t):
            out.extend(sorted(glob.glob(os.path.join(t, "**", "*.glb"), recursive=True)))
        elif any(ch in t for ch in "*?[]"):
            out.extend(sorted(glob.glob(t, recursive=True)))
        elif os.path.isfile(t):
            out.append(t)
        else:
            print(f"[ERROR] Khong tim thay duong dan: {t}", file=sys.stderr)
    return out


def main():
    parser = argparse.ArgumentParser(
        description="Kiem dinh tu dong Dat / Khong Dat (PASS/WARN/FAIL) cho file .glb tu Blender."
    )
    parser.add_argument("targets", nargs="+", help="File .glb hoac thu muc chua .glb")
    parser.add_argument("--type", choices=sorted(BUDGETS.keys()), help="Ep nhom kiem dinh thu cong")
    parser.add_argument("--strict-uv2", action="store_true", help="Bat buoc Landmark co UV2 (coi thieu UV2 la FAIL)")
    parser.add_argument("--json", action="store_true", help="Xuat ket qua dang JSON")
    args = parser.parse_args()

    files = expand_inputs(args.targets)
    if not files:
        print("Khong tim thay file .glb nao de kiem tra.")
        return 2

    results = [audit_glb(f, forced_type=args.type, strict_uv2=args.strict_uv2) for f in files]

    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
    else:
        counts = {"PASS": 0, "WARN": 0, "FAIL": 0}
        print("=" * 86)
        print("KIEM DINH MODEL BLENDER (.GLB) — CUOC PHIEU LUU CUA MAY")
        print("=" * 86)
        for r in results:
            counts[r["status"]] += 1
            st = r["stats"]
            rel = os.path.relpath(r["path"])
            badge = {"PASS": "[PASS]", "WARN": "[WARN]", "FAIL": "[FAIL]"}[r["status"]]
            summary = (
                f"{st.get('tris', '?')} tris | {st.get('mb', '?')} MB | "
                f"{st.get('mats', '?')} mat | {st.get('bones', 0)} bones | "
                f"{st.get('anims', 0)} clips | tex<={st.get('max_tex_px', 0)}px | "
                f"UV2={'Y' if st.get('uv2') else 'N'} | COL={st.get('cols', 0)}"
            )
            print(f"\n{badge} {rel}  (type={r['type']})")
            print(f"       {summary}")
            for msg in r["fails"]:
                print(f"       FAIL: {msg}")
            for msg in r["warns"]:
                print(f"       WARN: {msg}")
        print("\n" + "-" * 86)
        print(f"TONG KET: {len(results)} file | PASS: {counts['PASS']} | WARN: {counts['WARN']} | FAIL: {counts['FAIL']}")
        print("-" * 86)

    return 1 if any(r["status"] == "FAIL" for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
