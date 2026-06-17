"use client"

import { Menu, ShoppingCart, ClipboardList } from "lucide-react"

interface BottomNavProps {
  cartCount: number
  onCartClick: () => void
}

export function BottomNav({ cartCount, onCartClick }: BottomNavProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border"
      aria-label="하단 네비게이션"
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around py-2">
          <NavItem 
            icon={<Menu className="h-5 w-5" />} 
            label="메뉴" 
            isActive 
          />
          <NavItem 
            icon={
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
            } 
            label="장바구니"
            onClick={onCartClick}
          />
          <NavItem 
            icon={<ClipboardList className="h-5 w-5" />} 
            label="주문" 
          />
        </div>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={`transition ${isActive ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span className="text-xs font-medium">{label}</span>
      {isActive && (
        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
      )}
    </button>
  )
}
