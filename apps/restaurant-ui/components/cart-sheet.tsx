"use client"

import Image from "next/image"
import { X, Plus, Minus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CartItem } from "@/app/page"

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  onUpdateQuantity: (id: string, delta: number) => void
}

export function CartSheet({ isOpen, onClose, items, total, onUpdateQuantity }: CartSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-background shadow-xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "80vh" }}
        role="dialog"
        aria-label="장바구니"
        aria-modal="true"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-lg font-semibold text-foreground">장바구니</h2>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Trash2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">장바구니가 비어있습니다</p>
            </div>
          ) : (
            <ul className="space-y-3 pb-4">
              {items.map((item) => (
                <li 
                  key={item.id}
                  className="flex gap-3 rounded-xl bg-card p-3"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{item.name}</h3>
                      <p className="text-sm font-semibold text-foreground">
                        {(item.price * item.quantity).toLocaleString()}원
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-muted/80"
                        aria-label="수량 감소"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90"
                        aria-label="수량 증가"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-muted-foreground">총 금액</span>
              <span className="text-xl font-bold text-foreground">
                {total.toLocaleString()}원
              </span>
            </div>
            <Button 
              className="w-full rounded-xl bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              주문하기
            </Button>
          </div>
        )}

        {/* Safe area */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  )
}
