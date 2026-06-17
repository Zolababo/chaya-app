"use client"

import Image from "next/image"
import { Plus } from "lucide-react"
import type { MenuItem } from "@/app/page"

interface MenuListProps {
  items: MenuItem[]
  onAddToCart: (item: MenuItem) => void
}

export function MenuList({ items, onAddToCart }: MenuListProps) {
  return (
    <ul className="space-y-3" role="list" aria-label="메뉴 목록">
      {items.map((item) => (
        <li key={item.id}>
          <article className="group flex gap-4 rounded-xl bg-card p-3 shadow-sm transition hover:shadow-md">
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover transition group-hover:scale-105"
                sizes="80px"
              />
              {item.badge && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </div>
            
            <div className="flex flex-1 flex-col justify-between py-0.5">
              <div>
                <h3 className="font-medium text-foreground">{item.name}</h3>
                {item.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {item.price.toLocaleString()}원
              </p>
            </div>

            <div className="flex items-center">
              <button
                onClick={() => onAddToCart(item)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-95"
                aria-label={`${item.name} 담기`}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}
