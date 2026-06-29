/**
 * 메뉴 설명에서 조리법·섭취 팁 등 손님에게 불필요한 문장을 제거합니다.
 * AI 번역이 "기름을 제거하고 드세요" 같은 레시피/팁을 넣는 경우를 막습니다.
 */

const INSTRUCTION_PATTERNS: RegExp[] = [
  // English — eating / cooking tips
  /\b(before|when|prior to)\s+(you\s+)?(eat|eating|consume|consuming|serve|serving)\b/i,
  /\bdrain(ing)?\b.*\b(oil|fat|grease|excess)\b/i,
  /\b(remove|skim|pour off|blot)\b.*\b(oil|fat|grease)\b/i,
  /\bfor\s+(a\s+)?(better|best|more)\s+(taste|flavor|flavour|experience|result)\b/i,
  /\b(you\s+)?(can|should|may|might|try to|need to)\s+(drain|remove|add|heat|reheat|cook|simmer|boil|fry|grill|bake|stir|mix|serve)\b/i,
  /\b(to\s+)?enjoy\s+(it\s+)?(more|best|fully)\b/i,
  /\bbest\s+(served|enjoyed)\b/i,
  /\b(reheat|heat up|warm up)\b/i,
  /\b(how to|steps to)\s+(cook|make|prepare)\b/i,
  /\b(recipe|cooking instructions?|preparation steps?)\b/i,
  /\b(ingredients? list|mix together|marinate for)\b/i,
  /^\s*(drain|remove|add|heat|reheat|serve|try|enjoy|mix|stir|simmer|boil|fry|grill|bake)\b/i,
  // Japanese
  /レシピ|作り方|調理(方法|手順)|下ごしらえ/,
  /食べる前|召し上がる前|いただく前/,
  /油を(切|取|除|抜|こし|落と)/,
  /(温め|加熱|茹で|炒め|煮込|蒸し)(て|ると).*(ください|おすすめ|より)/,
  /より(美味|おい)しく(食べ|召し上が)/,
  // Chinese (简/繁)
  /食用前|进食前|吃之前|享用前/,
  /去油|沥油|沥干|撇去.{0,6}油/,
  /(煮|炒|蒸|炸|烤|下锅|烹饪|加热|微波).{0,12}(更|后|再).{0,6}(好吃|美味|香)/,
  /吃起来更/,
  /食谱|做法|烹调方法|烹饪步骤|制作方法/,
  // Korean (번역 누수·점주 입력은 별도 — 외국어 필드용)
  /먹기\s*전/,
  /기름을?\s*(빼|제거|걷|닦)/,
  /더\s*맛있게\s*먹/,
  /드시기\s*전/,
];

function splitDescriptionSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。！？])\s*/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 조리·섭취 지시/팁 문장인지 판별 */
export function isDinerInstructionSentence(sentence: string): boolean {
  const s = sentence.trim();
  if (!s) return false;
  return INSTRUCTION_PATTERNS.some((re) => re.test(s));
}

/** 식당 손님용 설명만 남깁니다. 전부 제거되면 null. */
export function sanitizeMenuDescriptionForDiner(
  text: string | null | undefined,
): string | null {
  const raw = text?.trim();
  if (!raw) return null;

  const kept = splitDescriptionSentences(raw).filter((s) => !isDinerInstructionSentence(s));
  if (kept.length === 0) return null;

  return kept.join(" ").trim() || null;
}
