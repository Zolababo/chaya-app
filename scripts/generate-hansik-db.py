import json
import re
import sys
from pathlib import Path

import openpyxl

path = Path(r"c:/Users/skim0/Downloads/한식진흥원_한식메뉴 외국어표기 길라잡이 800선_20230601.xlsx")
out = Path(__file__).resolve().parents[1] / "apps/consumer-menu/lib/menus/hansik-db.ts"

wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
ws = wb.active

entries: dict[str, dict[str, str]] = {}
for row in ws.iter_rows(min_row=4, values_only=True):
    if not row or not row[3]:
        continue
    ko = str(row[3]).strip()
    if not ko:
        continue
    key = re.sub(r"\s+", "", ko).lower()
    if key in entries:
        continue

    def s(v: object) -> str:
        if v is None:
            return ""
        return str(v).strip()

    entry: dict[str, str] = {
        "ko": ko,
        "roman": s(row[4]),
        "koDesc": s(row[6]),
        "en": s(row[7]),
        "enDesc": s(row[8]),
        "ja": s(row[9]),
        "jaDesc": s(row[10]),
        "zhCN": s(row[11]),
        "zhCNDesc": s(row[12]),
        "zhTW": s(row[13]),
        "zhTWDesc": s(row[14]),
    }
    for k in list(entry.keys()):
        if k.endswith("Desc") and not entry[k]:
            del entry[k]
    entries[key] = entry

wb.close()

lines = [
    "// 한식진흥원 외국어표기 길라잡이 800선 (2023.06.01)",
    "// 자동 생성 — 직접 수정 금지 (scripts/generate-hansik-db.py)",
    "",
    "export type HansikEntry = {",
    "  ko: string;",
    "  roman: string;",
    "  koDesc?: string;",
    "  en: string;",
    "  enDesc?: string;",
    "  ja: string;",
    "  jaDesc?: string;",
    "  zhCN: string;",
    "  zhCNDesc?: string;",
    "  zhTW: string;",
    "  zhTWDesc?: string;",
    "};",
    "",
    "/** 정규화 키(공백 제거 + 소문자) → 번역 항목 */",
    "export const HANSIK_DB: Record<string, HansikEntry> = {",
]

for key, e in sorted(entries.items(), key=lambda x: x[1]["ko"]):
    j = json.dumps(e, ensure_ascii=False)
    lines.append(f'  "{key}": {j},')

lines.extend(
    [
        "};",
        "",
        "/** 메뉴명에서 한식DB 항목 검색. 공백 무시 + 대소문자 무시. */",
        "export function lookupHansik(name: string): HansikEntry | null {",
        '  const key = name.replace(/\\s+/g, "").toLowerCase();',
        "  return HANSIK_DB[key] ?? null;",
        "}",
        "",
    ]
)

out.write_text("\n".join(lines), encoding="utf-8")
print(f"Generated {len(entries)} entries -> {out}")
