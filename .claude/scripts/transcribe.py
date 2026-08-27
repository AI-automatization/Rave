#!/usr/bin/env python3
"""
transcribe.py — транскрибировать аудио/голосовое сообщение через Whisper
Usage: python3 transcribe.py <audio_file>
Output: plain text to stdout
"""
import sys
import os
import whisper

def transcribe(audio_path: str) -> str:
    if not os.path.exists(audio_path):
        print(f"ERROR: file not found: {audio_path}", file=sys.stderr)
        sys.exit(1)

    model = whisper.load_model("base")
    result = model.transcribe(audio_path, language=None)
    return result["text"].strip()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 transcribe.py <audio_file>", file=sys.stderr)
        sys.exit(1)

    text = transcribe(sys.argv[1])
    print(text)
