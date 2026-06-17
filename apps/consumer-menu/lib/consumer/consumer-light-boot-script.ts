/** Root `beforeInteractive` — QR·삼성 인터넷 첫 페인트 전 손님 라이트 고정. */
export const consumerLightBootScript = `(function(){var p=location.pathname;if(p.indexOf("/t/")!==0&&p!=="/t")return;var d=document.documentElement;d.setAttribute("data-chaya-consumer","");d.style.colorScheme="only light";d.classList.remove("dark");})();`;
