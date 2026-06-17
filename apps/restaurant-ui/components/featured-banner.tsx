"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { MenuItem } from "@/app/page"

interface FeaturedBannerProps {
  items: MenuItem[]
  onAddToCart: (item: MenuItem) => void
}

export function FeaturedBanner({ items, onAddToCart }: FeaturedBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % items.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [items.length])

  const goTo = (index: number) => {
    setCurrentIndex(index)
  }

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length)
  }

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % items.length)
  }

  if (items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <section className="mb-6" aria-label="추천 메뉴">
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl bg-card shadow-sm"
      >
        <div 
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div 
              key={item.id}
              className="w-full flex-shrink-0"
            >
              <div className="flex gap-4 p-4">
                <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    {item.badge && (
                      <span className="mb-1.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {item.badge}
                      </span>
                    )}
                    <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm font-medium text-foreground/80 mt-1">
                      {item.price.toLocaleString()}원
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAddToCart(item)}
                    className="mt-2 w-fit rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    담기
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
              aria-label="이전"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
              aria-label="다음"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Indicator dots */}
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? "w-4 bg-primary" 
                  : "w-1.5 bg-foreground/20"
              }`}
              aria-label={`슬라이드 ${index + 1}`}
            />
          ))}
        </div>

        {/* Page indicator */}
        <div className="absolute bottom-2 right-3 rounded-md bg-foreground/60 px-2 py-0.5 text-xs font-medium text-white">
          {currentIndex + 1}/{items.length}
        </div>
      </div>
    </section>
  )
}
