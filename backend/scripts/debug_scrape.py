"""
Debug script: runs scrape_tool and saves the result to logs/scrape_debug.json.

Usage (from backend/):
    python debug_scrape.py [URL]

Defaults to the cultura.ugto.mx agenda if no URL is provided.
"""

import json
import sys
from pathlib import Path

# Ensure the backend package root is on the path
sys.path.insert(0, str(Path(__file__).parent))

from agents.tools import scrape_tool

result = scrape_tool.run(
    url='https://www.cultura.ugto.mx/eventos-agendacultural',
    source_type='website'
)

print(f"Truncated: {result['truncated']}")
print(f"Content length: {len(result['content'])} chars")
print(f"\n--- Last 500 chars (to see where it cuts off) ---")
print(result['content'][-500:])


out_path = Path(__file__).parent / 'logs' / 'scrape_debug.json'
out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')

print(f'Status : {result["status_code"]}')
print(f'Length : {len(result.get("content", ""))} chars')
print(f'Truncated: {result.get("truncated")}')
print(f'Image  : {result.get("image_url")}')
print(f'Links  : {result.get("event_links")}')
print(f'Saved  : {out_path}')
