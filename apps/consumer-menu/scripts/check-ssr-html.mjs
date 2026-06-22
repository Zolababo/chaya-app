const res = await fetch("https://chaya-app.vercel.app/t/demo");
const html = await res.text();
console.log("status", res.status);
console.log("menu-board-ssr", html.includes("menu-board-ssr"));
console.log("render/image", html.includes("render/image"));
console.log("menu-thumb", html.includes("/menu-thumb"));
console.log("h3 count", (html.match(/<h3/g) ?? []).length);
console.log("preload image", /rel="preload"[^>]*as="image"/.test(html));

const imgMatch = html.match(/\/menu-thumb\?u=[^"']+/);
if (imgMatch) {
  const url = "https://chaya-app.vercel.app" + imgMatch[0].replace(/&amp;/g, "&");
  console.log("thumb url", url.slice(0, 100) + "...");
  const imgRes = await fetch(url);
  const buf = await imgRes.arrayBuffer();
  console.log("proxy status", imgRes.status, "bytes", buf.byteLength, "type", imgRes.headers.get("content-type"));
} else {
  console.log("no /menu-thumb url in html");
}
