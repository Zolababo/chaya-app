/**
 * 손님 `/t/*` 첫 paint — MenuBoardServerList h3·셸만 커버 (외부 CSS 대기 전).
 * App Router + Turbopack에서는 experimental.optimizeCss(Critters)가 streaming과 맞지 않음.
 */
export const CONSUMER_MENU_CRITICAL_CSS = `
html[data-chaya-consumer]{color-scheme:only light!important;background:#fafaf9!important;touch-action:manipulation}
html[data-chaya-consumer] body{background:#fafaf9!important;color:#1c1917!important;margin:0;touch-action:manipulation;-webkit-font-smoothing:antialiased}
.chaya-app-shell{box-sizing:border-box;width:100%;max-width:32rem;margin-inline:auto;padding-inline:max(1rem,env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))}
#main-content [data-menu-ssr-fallback] h3{font-size:.875rem;font-weight:500;line-height:1.375;color:#18181b;margin:0}
#main-content [data-menu-ssr-fallback] li p{font-size:.875rem;font-weight:600;color:#18181b;margin:.125rem 0 0;font-variant-numeric:tabular-nums}
#main-content [data-menu-ssr-fallback]{list-style:none;margin:0;padding:0}
#main-content [data-menu-ssr-fallback] li+li{margin-top:.5rem}
#main-content [data-menu-ssr-fallback] .flex{display:flex;align-items:center;gap:.5rem}
#main-content [data-menu-ssr-fallback] img{width:4rem;height:4rem;border-radius:.75rem;object-fit:cover;flex-shrink:0}
#main-content [data-menu-ssr-fallback] .min-w-0{min-width:0;flex:1}
#main-content [data-menu-ssr-fallback] .rounded-xl.border{border:1px solid rgba(228,228,231,.6);background:#fff;border-radius:.75rem;padding:.5rem}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
`.replace(/\n/g, "");
