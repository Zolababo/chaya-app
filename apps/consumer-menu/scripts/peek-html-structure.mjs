const url = process.argv[2] || "https://chaya-app.vercel.app/t/demo";
const html = await fetch(url).then((r) => r.text());
const scriptSrcs = [...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]);
const linkHrefs = [...html.matchAll(/<link[^>]*href="([^"]+)"/g)].map((m) => m[1]);
const h3Idx = html.indexOf("<h3");
const mainIdx = html.indexOf('id="main-content"');
const firstScriptIdx = html.indexOf("<script");
const firstLinkIdx = html.indexOf("<link");
const h3InMain = html.includes('id="main-content"') && html.slice(mainIdx, mainIdx + 80000).includes("<h3");

console.log(
  JSON.stringify(
    {
      url,
      htmlUtf8Bytes: Buffer.byteLength(html, "utf8"),
      gzipEstimateNote: "~10KB wire per payload report",
      scriptSrcCount: scriptSrcs.length,
      linkCount: linkHrefs.length,
      fontLinks: linkHrefs.filter((h) => h.includes("woff") || h.includes("font")),
      cssLinks: linkHrefs.filter((h) => h.endsWith(".css")),
      h3Offset: h3Idx,
      mainContentOffset: mainIdx,
      firstScriptOffset: firstScriptIdx,
      firstLinkOffset: firstLinkIdx,
      h3BeforeFirstScript: h3Idx > 0 && firstScriptIdx > 0 && h3Idx < firstScriptIdx,
      h3InMainRegion: h3InMain,
      scriptPlacements: scriptSrcs.slice(0, 5),
    },
    null,
    2,
  ),
);
