"use client";

import type { FormEvent } from "react";

type Props = {
  onSubmit?: (payload: FormData) => void;
};

/** Merchant 카테고리 CRUD 기본 폼 템플릿 */
export function CategoryForm({ onSubmit }: Props) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onSubmit?.(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-chaya-border p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600" htmlFor="category-tenant-slug">
          테넌트 슬러그 *
        </label>
        <input id="category-tenant-slug" name="tenant_slug" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-zinc-600" htmlFor="category-name">
          카테고리명 *
        </label>
        <input id="category-name" name="name" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <div>
        <label className="text-xs font-medium text-zinc-600" htmlFor="category-sort-order">
          표시 순서
        </label>
        <input id="category-sort-order" name="sort_order" type="number" min={0} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </div>
      <label className="inline-flex items-center gap-2 pt-6 text-sm text-zinc-700">
        <input type="checkbox" name="is_active" value="true" defaultChecked />
        활성화
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
          카테고리 저장
        </button>
      </div>
    </form>
  );
}
