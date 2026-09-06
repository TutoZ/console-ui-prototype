#!/usr/bin/env python3
"""Regenerate public/narration/*.mp3.

字幕用 text；合成用 speak（调取→吊取；SOP→S O P）。
"""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import sys

try:
    import edge_tts
except ImportError:
    print("pip install edge-tts", file=sys.stderr)
    raise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "public", "narration")
TMP = "/tmp/food-safety-narration"

VOICE = "zh-CN-YunxiNeural"
RATE = "+0%"
PITCH = "+0Hz"

# (audioId, subtitle_text, speak_text)
ITEMS = [
    (
        "intro_0",
        "用一条食安险咨询，看数字员工怎么把事办对",
        "用一条食安险咨询，看数字员工怎么把事办对",
    ),
    (
        "pre_act1_0",
        "客户吃完外卖不舒服还吐了，想理赔",
        "客户吃完外卖不舒服还吐了，想理赔",
    ),
    (
        "act1_0",
        "触发理赔SOP技能，先调知识库核对规则告诉客户",
        "触发理赔 S O P 技能，先吊知识库核对规则告诉客户",
    ),
    (
        "act1_1",
        "再调食源性疾病理赔SOP推进流程，请客户选订单",
        "再吊取食源性疾病理赔 S O P 推进流程，请客户选订单",
    ),
    (
        "act2_0",
        "不必人工查询、不必改接口，用 Browser Use 核对实付",
        "不必人工查询、不必改接口，用 Browser Use 核对实付",
    ),
    (
        "act2_1",
        "打开订单页查询，读出餐品、状态和金额",
        "打开订单页查询，读出餐品、状态和金额",
    ),
    (
        "act3_0",
        "客户道谢，礼貌收尾并保留记忆，有问题随时再找它",
        "客户道谢，礼貌收尾并保留记忆，有问题随时再找它",
    ),
]


def duration_ms(path: str) -> int:
    p = subprocess.run(["afinfo", path], capture_output=True, text=True, check=False)
    for line in p.stdout.splitlines():
        if "estimated duration" in line:
            return int(round(float(line.split()[2]) * 1000))
    return 0


async def synth_one(aid: str, speak: str) -> str:
    os.makedirs(TMP, exist_ok=True)
    raw = os.path.join(TMP, f"{aid}.mp3")
    last_err: Exception | None = None
    for attempt in range(1, 12):
        try:
            if os.path.exists(raw):
                os.remove(raw)
            await edge_tts.Communicate(speak, VOICE, rate=RATE, pitch=PITCH).save(raw)
            if not os.path.exists(raw) or os.path.getsize(raw) < 2000:
                raise RuntimeError("audio too small")
            return raw
        except Exception as e:  # noqa: BLE001
            last_err = e
            wait = min(20.0, 2.5 * attempt)
            print(f"  retry {aid} #{attempt}: {e}; sleep {wait:.1f}s", flush=True)
            await asyncio.sleep(wait)
    raise RuntimeError(f"{aid} failed: {last_err}")


async def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    print(f"voice={VOICE} rate={RATE} pitch={PITCH}")
    for aid, _subtitle, speak in ITEMS:
        print(f"gen {aid}…", flush=True)
        path = await synth_one(aid, speak)
        dest = os.path.join(OUT, f"{aid}.mp3")
        shutil.copyfile(path, dest)
        print(f"  ok {aid} {duration_ms(dest)}ms", flush=True)
        await asyncio.sleep(1.5)
    print("done — sync durationMs in lib/foodSafetyNarrationScript.ts")


if __name__ == "__main__":
    asyncio.run(main())
