/** `/ops/*` 첫 페인트 전 — html[data-ops-view] (PC vs 터치) */
export const opsViewBootScript = `(function(){var p=location.pathname;if(p.indexOf("/ops")!==0)return;var d=document.documentElement;var desktop=window.matchMedia("(hover: hover) and (pointer: fine)").matches;d.setAttribute("data-ops-view",desktop?"desktop":"compact");})();`;
