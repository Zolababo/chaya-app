/** 언어 전환 시 메뉴명 번역 노출 확인 (배포 후) */
const base = "https://chaya-app.vercel.app/t/demo";

async function fetchH3Names(url, cookie) {
  const res = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "follow",
  });
  const html = await res.text();
  const names = [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g)].map((m) => m[1].trim());
  return { status: res.status, names: names.slice(0, 5) };
}

const ko = await fetchH3Names(base);
const en = await fetchH3Names(`${base}?lang=en`);
console.log("ko (default)", ko.names);
console.log("en (?lang=en)", en.names);
console.log(
  "names differ",
  ko.names.length > 0 && en.names.length > 0 && ko.names[0] !== en.names[0],
);
