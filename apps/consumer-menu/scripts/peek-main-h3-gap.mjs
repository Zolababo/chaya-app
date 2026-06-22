const url = process.argv[2] || "https://chaya-app.vercel.app/t/demo";
const html = await fetch(url).then((r) => r.text());
const mainIdx = html.indexOf('id="main-content"');
const h3Idx = html.indexOf("<h3", mainIdx);
const slice = html.slice(mainIdx, h3Idx);
console.log(
  JSON.stringify(
    {
      htmlBytes: Buffer.byteLength(html, "utf8"),
      mainIdx,
      h3Idx,
      bytesBetweenMainAndH3: slice.length,
      scriptTagsInGap: (slice.match(/<script/g) || []).length,
      nextFlightInGap: (slice.match(/__next_f/g) || []).length,
      linkTagsInGap: (slice.match(/<link/g) || []).length,
      gapHead500: slice.slice(0, 500),
      gapTail400: slice.slice(-400),
    },
    null,
    2,
  ),
);
