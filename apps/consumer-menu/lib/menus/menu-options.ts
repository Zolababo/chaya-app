export type MenuOptionChoice = {
  id: string;
  label: string;
  priceDelta: number;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  required: boolean;
  choices: MenuOptionChoice[];
};

export type SelectedMenuOption = {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceLabel: string;
  priceDelta: number;
};

export function parseMenuOptionGroups(raw: unknown): MenuOptionGroup[] {
  if (!Array.isArray(raw)) return [];
  const groups: MenuOptionGroup[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!id || !name) continue;
    const required = o.required === true;
    const choicesRaw = o.choices;
    if (!Array.isArray(choicesRaw) || choicesRaw.length === 0) continue;
    const choices: MenuOptionChoice[] = [];
    for (const c of choicesRaw) {
      if (!c || typeof c !== "object") continue;
      const cr = c as Record<string, unknown>;
      const cid = typeof cr.id === "string" ? cr.id.trim() : "";
      const label = typeof cr.label === "string" ? cr.label.trim() : "";
      if (!cid || !label) continue;
      const pd = typeof cr.priceDelta === "number" ? cr.priceDelta : Number(cr.priceDelta);
      const priceDelta = Number.isFinite(pd) ? Math.max(-99999, Math.min(99999, pd)) : 0;
      choices.push({ id: cid, label, priceDelta });
    }
    if (choices.length === 0) continue;
    groups.push({ id, name, required, choices });
  }
  return groups;
}

export function formatSelectedOptionsForNotes(selected: SelectedMenuOption[]): string | null {
  if (selected.length === 0) return null;
  return selected.map((s) => `${s.groupName}: ${s.choiceLabel}`).join(" · ");
}

export function selectedOptionsPriceDelta(selected: SelectedMenuOption[]): number {
  return selected.reduce((sum, s) => sum + s.priceDelta, 0);
}

export function stringifyMenuOptionGroups(groups: MenuOptionGroup[]): string {
  if (groups.length === 0) return "";
  return JSON.stringify(groups, null, 2);
}

/** 손님 UI에 옵션 선택 블록을 보여줄지 (유효한 그룹·선택지가 1개 이상). */
export function menuHasSelectableOptions(groups: MenuOptionGroup[]): boolean {
  return groups.length > 0;
}

function slugForOptionId(name: string, index: number): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w가-힣-]/g, "");
  return (cleaned || `group-${index}`).slice(0, 48);
}

/**
 * 점주 메뉴 관리 — 옵션 JSON 또는 간편 한 줄 형식.
 * 예: `맵기: 순한,보통,매운 (필수)` · `사이즈: M,L`
 */
function parseLooseOptionLines(text: string): { ok: true; value: MenuOptionGroup[] } | { ok: false; message: string } {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { ok: true, value: [] };
  }

  const groups: MenuOptionGroup[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let required = false;
    if (/\(필수\)\s*$/i.test(line)) {
      required = true;
      line = line.replace(/\(필수\)\s*$/i, "").trim();
    }

    const sep = line.includes(":") ? ":" : line.includes("|") ? "|" : null;
    if (!sep) {
      return {
        ok: false,
        message: `「${lines[i]}」 형식을 확인해 주세요. 예: 맵기: 순한,보통,매운 또는 맵기|순한,보통,매운 (필수)`,
      };
    }

    const parts = line.split(sep);
    const groupName = parts[0]?.trim() ?? "";
    const choicesRaw = parts.slice(1).join(sep).trim();
    if (!groupName || !choicesRaw) {
      return {
        ok: false,
        message: `「${lines[i]}」에 옵션 이름과 선택지를 함께 적어 주세요. 예: 맵기: 순한,보통,매운`,
      };
    }

    const labels = choicesRaw
      .split(/[,，]/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (labels.length === 0) {
      return {
        ok: false,
        message: `「${groupName}」 선택지를 쉼표로 구분해 주세요. 예: 순한,보통,매운`,
      };
    }

    const groupId = slugForOptionId(groupName, i);
    const choices: MenuOptionChoice[] = labels.map((label, ci) => ({
      id: `${groupId}-${ci}`,
      label,
      priceDelta: 0,
    }));
    groups.push({ id: groupId, name: groupName, required, choices });
  }

  return { ok: true, value: groups };
}

export type ParseMerchantOptionsResult =
  | { ok: true; value: MenuOptionGroup[] | null }
  | { ok: false; message: string };

/** FormData `options_json` 필드 — JSON 배열 또는 간편 줄 형식. */
export function parseMerchantOptionsInput(raw: string | null | undefined): ParseMerchantOptionsResult {
  const s = raw?.trim().slice(0, 12000) ?? "";
  if (!s) return { ok: true, value: null };

  if (s.startsWith("[") || s.startsWith("{")) {
    try {
      const parsed = JSON.parse(s) as unknown;
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const groups = parseMenuOptionGroups(arr);
      return { ok: true, value: groups.length > 0 ? groups : null };
    } catch {
      return {
        ok: false,
        message: "옵션 JSON 을 읽을 수 없습니다. 대괄호 [ ] 와 따옴표를 확인하거나, 아래 간편 형식을 사용해 주세요.",
      };
    }
  }

  const loose = parseLooseOptionLines(s);
  if (!loose.ok) return loose;
  return { ok: true, value: loose.value.length > 0 ? loose.value : null };
}

export const MERCHANT_OPTIONS_INPUT_PLACEHOLDER =
  "맵기: 순한,보통,매운 (필수)\n사이즈: M,L\n\n또는 JSON: [{\"id\":\"spice\",\"name\":\"맵기\",\"required\":true,\"choices\":[{\"id\":\"mild\",\"label\":\"순한\"},{\"id\":\"hot\",\"label\":\"매운\"}]}]";

export function validateSelectedOptions(
  groups: MenuOptionGroup[],
  selected: SelectedMenuOption[],
): { ok: true } | { ok: false; message: string } {
  for (const g of groups) {
    if (!g.required) continue;
    const hit = selected.find((s) => s.groupId === g.id);
    if (!hit) {
      return { ok: false, message: `「${g.name}」옵션을 선택해 주세요.` };
    }
  }
  for (const s of selected) {
    const g = groups.find((x) => x.id === s.groupId);
    if (!g) continue;
    const c = g.choices.find((x) => x.id === s.choiceId);
    if (!c) {
      return { ok: false, message: "선택한 옵션이 메뉴판과 맞지 않습니다. 다시 선택해 주세요." };
    }
  }
  return { ok: true };
}
