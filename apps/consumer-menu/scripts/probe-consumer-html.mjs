#!/usr/bin/env node
const base = (process.argv[2] || "https://chaya-app.vercel.app").replace(/\/$/, "");
const tenant = process.argv[3] || "demo";
const paths = [`/t/${tenant}`, `/t/${tenant}/barrier-free`, `/t/${tenant}/cart`, `/t/${tenant}/orders`];

for (const p of paths) {
  const res = await fetch(base + p, { headers: { "user-agent": "chaya-probe/1" }, cache: "no-store" });
  const b = await res.text();
  const vp = b.match(/name="viewport"[^>]*content="([^"]+)"/i)?.[1] ?? "none";
  console.log("---", p, res.status);
  console.log("viewport:", vp);
  console.log("sr-attr-ssr:", /data-consumer-screen-reader-mode/.test(b));
  console.log("pinch-attr-ssr:", /data-consumer-pinch-zoom="allowed"/.test(b));
  console.log("목록형/베리어프리:", b.includes("목록형") || b.includes("베리어프리"));
  console.log("장바구니:", b.includes("장바구니"));
  console.log("주문 확인:", b.includes("주문 확인"));
  console.log("주문내역:", b.includes("주문내역"));
  console.log("주문 현황:", b.includes("주문 현황"));
  console.log("menu-board-ssr:", b.includes("menu-board-ssr") || b.includes('id="menu-board-ssr"'));
}
