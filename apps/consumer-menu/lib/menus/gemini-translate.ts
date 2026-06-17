/**
 * 서버 전용 — Gemini AI 번역.
 * GEMINI_API_KEY / GOOGLE_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY
 * Google AI Studio 키는 AQ…·AIza… 모두 generateContent 에서 지원됩니다.
 */

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"] as const;

export type GeminiMenuTranslation = {
  en?: string;
  ja?: string;
  zhCN?: string;
  zhTW?: string;
  enDesc?: string;
  jaDesc?: string;
  zhCNDesc?: string;
  zhTWDesc?: string;
  /** 0=안 매움, 5=매우 매움 */
  spiceLevel?: number;
};

function readGeminiApiKey(silent = false): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    null;
  if (!key && !silent) {
    console.error("[gemini-translate] GEMINI_API_KEY (or GOOGLE_API_KEY) is not set");
  }
  return key;
}

function parseGeminiJson(text: string): GeminiMenuTranslation | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as GeminiMenuTranslation;
  } catch {
    return null;
  }
}

function buildPrompt(name: string, koDescription?: string | null): string {
  const koDesc = koDescription?.trim();
  const context = koDesc
    ? `음식명: ${name}\n점주가 작성한 한국어 설명(참고용, 번역하지 말 것): ${koDesc}\n\n` +
      `한국어 설명은 만들지 마세요. 영·일·중(간·번) 메뉴명과 1~2문장 설명만 작성하세요.`
    : `음식명: ${name}\n\n` +
      `한국인 손님용 한국어 설명은 만들지 마세요. 외국인 손님용으로 영·일·중(간·번) 메뉴명과 1~2문장 설명(재료·맛·특징)만 작성하세요.`;

  return (
    `당신은 한국 음식 전문 번역 AI입니다.\n${context}\n\n` +
    `추가로 맵기(0~5 정수, 0=안 매움)를 추정하세요.\n\n` +
    `JSON만 출력:\n` +
    `{"en":"English name","enDesc":"English description",` +
    `"ja":"日本語名","jaDesc":"日本語説明","zhCN":"中文简体名","zhCNDesc":"中文简体说明",` +
    `"zhTW":"中文繁體名","zhTWDesc":"中文繁體說明","spiceLevel":0}`
  );
}

async function postGemini(
  model: (typeof GEMINI_MODELS)[number],
  apiKey: string,
  prompt: string,
  useJsonMime: boolean,
  auth: "header" | "query",
): Promise<string | null> {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const url = auth === "query" ? `${base}?key=${encodeURIComponent(apiKey)}` : base;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth === "header" ? { "x-goog-api-key": apiKey } : {}),
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        ...(useJsonMime ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `[gemini-translate] ${model} HTTP ${res.status} (${auth}, json=${useJsonMime}):`,
      body.slice(0, 600),
    );
    return null;
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

async function callGeminiModel(
  model: (typeof GEMINI_MODELS)[number],
  apiKey: string,
  name: string,
  koDescription?: string | null,
): Promise<GeminiMenuTranslation | null> {
  const prompt = buildPrompt(name, koDescription);

  const attempts: Array<{ auth: "header" | "query"; useJsonMime: boolean }> = [
    { auth: "header", useJsonMime: true },
    { auth: "header", useJsonMime: false },
    { auth: "query", useJsonMime: true },
  ];

  for (const { auth, useJsonMime } of attempts) {
    const text = await postGemini(model, apiKey, prompt, useJsonMime, auth);
    if (!text) continue;
    const parsed = parseGeminiJson(text);
    if (parsed?.en || parsed?.ja || parsed?.zhCN) return parsed;
    console.error(`[gemini-translate] ${model} JSON parse failed:`, text.slice(0, 300));
  }

  return null;
}

/**
 * 한국 음식명(+선택 점주 한국어 설명 참고)을 Gemini에게 외국어 번역·맵기 생성 요청.
 */
export async function translateMenuWithGemini(
  name: string,
  koDescription?: string | null,
): Promise<GeminiMenuTranslation | null> {
  const apiKey = readGeminiApiKey();
  if (!apiKey) return null;

  for (const model of GEMINI_MODELS) {
    try {
      const parsed = await callGeminiModel(model, apiKey, name, koDescription);
      if (parsed) return parsed;
    } catch (err) {
      console.error(`[gemini-translate] ${model} exception:`, err);
    }
  }
  return null;
}

/** 점주 UI용 — API 키 미설정·호출 실패 시 짧은 안내. */
export function geminiTranslationFailureHint(hasApiKey: boolean): string {
  if (!hasApiKey) {
    return "AI 번역 키가 서버에 없습니다. Vercel Environment Variables에 GEMINI_API_KEY를 넣고 Redeploy해 주세요.";
  }
  return "AI 번역 API 호출에 실패했습니다. Google Cloud에서 Generative Language API 사용 설정·결제 연결을 확인한 뒤 재저장해 주세요.";
}

export function isGeminiConfigured(): boolean {
  return Boolean(readGeminiApiKey(true));
}
