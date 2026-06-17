"use client"

import { useState } from "react"
import { MenuHeader } from "@/components/menu-header"
import { FeaturedBanner } from "@/components/featured-banner"
import { CategoryTabs } from "@/components/category-tabs"
import { MenuList } from "@/components/menu-list"
import { BottomNav } from "@/components/bottom-nav"
import { CartSheet } from "@/components/cart-sheet"

export type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  image: string
  category: string
  badge?: string
}

export type CartItem = MenuItem & { quantity: number }

const MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "갈비탕",
    description: "진한 소갈비 육수의 깊은 맛",
    price: 14000,
    image: "https://images.unsplash.com/photo-1583224994076-e5f43ad7f688?w=400&h=400&fit=crop",
    category: "음식",
    badge: "인기"
  },
  {
    id: "2",
    name: "된장찌개",
    description: "부모님의 손맛!",
    price: 10000,
    image: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=400&fit=crop",
    category: "음식"
  },
  {
    id: "3",
    name: "떡볶이",
    description: "매콤달콤 추억의 맛",
    price: 10000,
    image: "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400&h=400&fit=crop",
    category: "음식"
  },
  {
    id: "4",
    name: "참치찌개",
    description: "얼큰하고 칼칼한 참치찌개",
    price: 10000,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop",
    category: "음식"
  },
  {
    id: "5",
    name: "훠궈",
    description: "신선한 재료와 특제 육수",
    price: 15900,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop",
    category: "음식",
    badge: "NEW"
  },
  {
    id: "6",
    name: "아메리카노",
    description: "깊고 진한 에스프레소",
    price: 4500,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop",
    category: "음료"
  },
  {
    id: "7",
    name: "카페라떼",
    description: "부드러운 우유와 에스프레소의 조화",
    price: 5000,
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=400&fit=crop",
    category: "음료"
  },
  {
    id: "8",
    name: "콜라",
    price: 2000,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop",
    category: "음료"
  }
]

const FEATURED_ITEMS = MENU_ITEMS.filter(item => item.badge)

const CATEGORIES = ["전체", "음식", "음료"]

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("전체")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  const filteredItems = activeCategory === "전체" 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === activeCategory)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => 
          item.id === id 
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    })
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-background pb-24">
      <MenuHeader restaurantName="Demo" subtitle="주문 메뉴" />
      
      <main className="px-4">
        <FeaturedBanner items={FEATURED_ITEMS} onAddToCart={addToCart} />
        
        <CategoryTabs 
          categories={CATEGORIES} 
          active={activeCategory} 
          onChange={setActiveCategory} 
        />
        
        <MenuList items={filteredItems} onAddToCart={addToCart} />
      </main>

      <BottomNav 
        cartCount={cartCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />

      <CartSheet 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        total={cartTotal}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  )
}
