#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function toKebabCase(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function writeIfMissing(filePath, content) {
  try {
    await fs.access(filePath);
    console.log(`skip: ${path.relative(process.cwd(), filePath)} already exists`);
  } catch {
    await fs.writeFile(filePath, content, "utf8");
    console.log(`create: ${path.relative(process.cwd(), filePath)}`);
  }
}

function renderSchema(kebab, pascal) {
  if (kebab === "menu") {
    return `export type MenuInput = {
  id?: string;
  tenant_slug: string;
  name: string;
  price: number;
  category?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sort_order?: number | null;
  is_sold_out?: boolean;
};

export const menuDefaultInput: MenuInput = {
  tenant_slug: "",
  name: "",
  price: 0,
  category: "",
  description: "",
  imageUrl: "",
  sort_order: null,
  is_sold_out: false,
};
`;
  }

  if (kebab === "category") {
    return `export type CategoryInput = {
  id?: string;
  tenant_slug: string;
  name: string;
  sort_order?: number | null;
  is_active?: boolean;
};

export const categoryDefaultInput: CategoryInput = {
  tenant_slug: "",
  name: "",
  sort_order: null,
  is_active: true,
};
`;
  }

  return `export type ${pascal}Input = {
  id?: string;
  tenant_slug: string;
  name: string;
};
`;
}

function renderHook(kebab, pascal) {
  if (kebab === "menu") {
    return `import { useMemo } from "react";

import type { MenuInput } from "./menu-schema";

export function useMenu(items: MenuInput[]) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)),
    [items],
  );
  return sorted;
}
`;
  }

  if (kebab === "category") {
    return `import { useMemo } from "react";

import type { CategoryInput } from "./category-schema";

export function useCategory(items: CategoryInput[]) {
  return useMemo(
    () => items.filter((item) => item.is_active !== false).sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)),
    [items],
  );
}
`;
  }

  return `import { useMemo } from "react";

import type { ${pascal}Input } from "./${kebab}-schema";

export function use${pascal}(items: ${pascal}Input[]) {
  return useMemo(() => items, [items]);
}
`;
}

function renderForm(kebab, pascal) {
  if (kebab === "menu") {
    return `"use client";

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
`;
  }

  if (kebab === "category") {
    return `"use client";

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
`;
  }

  return `"use client";

type Props = {
  onSubmit?: () => void;
};

export function ${pascal}Form({ onSubmit }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="rounded-xl border border-chaya-border p-4"
    >
      <p className="mb-2 text-sm font-semibold">${pascal} Form</p>
      <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
        저장
      </button>
    </form>
  );
}
`;
}

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error("Usage: node scripts/generate-crud.mjs <resource-name>");
    process.exit(1);
  }

  const kebab = toKebabCase(raw);
  const pascal = toPascalCase(raw);
  if (!kebab) {
    console.error("Invalid resource name.");
    process.exit(1);
  }

  const baseDir = path.resolve(process.cwd(), "apps/consumer-menu/components/crud", kebab);
  await fs.mkdir(baseDir, { recursive: true });

  await writeIfMissing(
    path.join(baseDir, `${kebab}-schema.ts`),
    renderSchema(kebab, pascal),
  );

  await writeIfMissing(
    path.join(baseDir, `use-${kebab}.ts`),
    renderHook(kebab, pascal),
  );

  await writeIfMissing(
    path.join(baseDir, `${pascal}Form.tsx`),
    renderForm(kebab, pascal),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
