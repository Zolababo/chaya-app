"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function MerchantMoreHubLogout() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="px-0 pt-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[rgba(220,38,38,0.18)] bg-[#FEF2F2] text-[15px] font-extrabold text-[#DC2626] transition active:opacity-75 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          로그아웃
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-logout-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm animate-[pop-in_0.2s_ease] rounded-[18px] bg-white p-6 text-center dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 text-4xl" aria-hidden>
              🚪
            </div>
            <h2 id="merchant-logout-title" className="text-[17px] font-black text-[#111827] dark:text-zinc-50">
              로그아웃 할까요?
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#9CA3AF]">
              로그아웃하면 다시 로그인해야 해요.
              <br />
              다른 기기의 로그인 상태는 유지돼요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-[48px] flex-1 rounded-[10px] bg-[#F2F3F5] text-[15px] font-extrabold text-[#4B5563] dark:bg-zinc-900 dark:text-zinc-300"
              >
                취소
              </button>
              <form action="/m/logout" method="post" className="flex-1">
                <button
                  type="submit"
                  className="min-h-[48px] w-full rounded-[10px] bg-[#DC2626] text-[15px] font-extrabold text-white"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
