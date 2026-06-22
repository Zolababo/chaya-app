/**
 * Production HTML RSC flight에서 items/translations 페이로드 추정 + before/after 비교
 */
const base = process.argv[2] || "https://chaya-app.vercel.app/t/demo";

async function analyze(url) {
  const html = await fetch(url).then((r) => r.text());
  const pushes = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];

  let flightTotal = 0;
  let translationsBlocks = 0;
  let menuDeferredBlock = 0;

  for (const m of pushes) {
    const raw = m[1];
    flightTotal += raw.length;
    if (raw.includes('"translations"') || raw.includes("translations")) {
      translationsBlocks += raw.length;
    }
    if (raw.includes("tenant") && (raw.includes("imageUrl") || raw.includes("sortOrder"))) {
      menuDeferredBlock += raw.length;
    }
  }

  // 키워드별 locale 등장 (전체 HTML)
  const localeKeys = ["en", "ja", "zh-Hans", "zh-Hant"];
  const localeHits = Object.fromEntries(
    localeKeys.map((loc) => [loc, (html.match(new RegExp(`"${loc}"`, "g")) ?? []).length]),
  );

  return {
    url,
    htmlUtf8Bytes: Buffer.byteLength(html, "utf8"),
    documentWireBytesNote: "gzip ~15KB (see consumer-payload-report)",
    inlineFlight: {
      pushCount: pushes.length,
      totalEscapedChars: flightTotal,
      menuClientPropsBlockChars: menuDeferredBlock,
      translationsRelatedChars: translationsBlocks,
    },
    localeKeyOccurrencesInHtml: localeHits,
    estimatedBeforeFixFlightChars: flightTotal - translationsBlocks,
    estimatedDeltaFromTranslationsPct:
      translationsBlocks > 0
        ? Math.round((translationsBlocks / (flightTotal - translationsBlocks)) * 100)
        : 0,
  };
}

const ko = await analyze(base.split("?")[0]);
const en = await analyze(`${base.split("?")[0]}?lang=en`);

console.log(
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      ko,
      en,
      interpretation: {
        allLocalesInFlight:
          "translations_json 파싱 결과가 RSC flight에 serialize되면 en/ja/zh 키가 HTML에 포함됨",
        serverResolvedProposal:
          "locale별 resolve 후 translations 필드 제거 시 translationsRelatedChars(~9KB+) 절감 가능",
      },
    },
    null,
    2,
  ),
);
