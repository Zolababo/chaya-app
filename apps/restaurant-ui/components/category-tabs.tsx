"use client"

interface CategoryTabsProps {
  categories: string[]
  active: string
  onChange: (category: string) => void
}

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <nav className="mb-4" aria-label="메뉴 카테고리">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              active === category
                ? "bg-foreground text-background shadow-sm"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
            }`}
            aria-current={active === category ? "page" : undefined}
          >
            {category}
          </button>
        ))}
      </div>
    </nav>
  )
}
