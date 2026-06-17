"use client"

import { Globe, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MenuHeaderProps {
  restaurantName: string
  subtitle?: string
}

export function MenuHeader({ restaurantName, subtitle }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
            {restaurantName.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{restaurantName}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="언어 변경"
          >
            <Globe className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="설정"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
