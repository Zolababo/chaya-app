"use client";

import type { FormEvent } from "react";

type Props = {
  onSubmit?: (payload: FormData) => void;
};

/** Merchant 메뉴 CRUD 기본 폼 템플릿 */
export function MenuForm({ onSubmit }: Props) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit?.(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-chaya-border p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-tenant-slug">
          테넌트 슬러그 *
        </label>
        <input id="menu-tenant-slug" name="tenant_slug" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-name">
          메뉴명 *
        </label>
        <input id="menu-name" name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-price">
          가격(원) *
        </label>
        <input id="menu-price" name="price" inputMode="numeric" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-category">
          카테고리
        </label>
        <input id="menu-category" name="category" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-sort-order">
          표시 순서
        </label>
        <input id="menu-sort-order" name="sort_order" type="number" min={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-image-url">
          이미지 URL
        </label>
        <input id="menu-image-url" name="imageUrl" type="url" className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600" htmlFor="menu-description">
          설명
        </label>
        <textarea id="menu-description" name="description" rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="is_sold_out" value="true" />
        품절 처리
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
          메뉴 저장
        </button>
      </div>
    </form>
  );
}
