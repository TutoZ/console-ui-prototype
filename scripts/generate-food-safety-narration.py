#!/usr/bin/env python3
"""Regenerate public/narration/*.mp3.

字幕用产品原句 text；合成用 speak（仅 SOP→S O P 等发音处理）。
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
RATE = "+15%"
PITCH = "+0Hz"

# (audioId, subtitle_text, speak_text) — 字幕保持原句
ITEMS = [
    (
        "intro_0",
        "以保险售后咨询场景为例",
        "以保险售后咨询场景为例",
    ),
    (
        "pre_act1_0",
        "数字员工自主规划、主动预测用户餐品质量问题",
        "数字员工自主规划、主动预测用户餐品质量问题",
    ),
    (
        "pre_act1_1",
        "用户反馈外卖就餐不舒服如何理赔，模型根据服务原则先安抚用户、再去找理赔规则",
        "用户反馈外卖就餐不舒服如何理赔，模型根据服务原则先安抚用户、再去找理赔规则",
    ),
    (
        "act1_0",
        "Skill中约定了要查看理赔SOP，数字员工自主思考查知识库反馈客户",
        "Skill 中约定了要查看理赔 S O P，数字员工自主思考查知识库反馈客户",
    ),
    (
        "act2_0",
        "用户申请推进流程，数字员工无侵入调用业务系统给结果",
        "用户申请推进流程，数字员工无侵入调用业务系统给结果",
    ),
    (
        "act2_1",
        "无需接口对接，登录业务系统，输入订单完成查询，给出处理结果",
        "无需接口对接，登录业务系统，输入订单完成查询，给出处理结果",
    ),
    (
        "act3_0",
        "客户道谢，数字员工礼貌安抚，保存本次服务记忆，帮助后续问题更懂用户高效解决",
        "客户道谢，数字员工礼貌安抚，保存本次服务记忆，帮助后续问题更懂用户高效解决",
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
    # 旧的 act1_1 / act1_2 已不再使用
    for stale_name in ("act1_1.mp3", "act1_2.mp3"):
        stale = os.path.join(OUT, stale_name)
        if os.path.exists(stale):
            os.remove(stale)
            print(f"removed stale {stale_name}")
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
