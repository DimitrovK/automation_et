import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FMTableProps {
  children: ReactNode
  className?: string
}

interface FMTableHeaderProps {
  children: ReactNode
  className?: string
}

interface FMTableBodyProps {
  children: ReactNode
  className?: string
}

interface FMTableRowProps {
  children: ReactNode
  isEven?: boolean
  onClick?: () => void
  className?: string
}

interface FMTableFooterProps {
  children: ReactNode
  className?: string
}

export function FMTable({ children, className }: FMTableProps) {
  return (
    <div className={cn("fm-card", className)}>
      {children}
    </div>
  )
}

export function FMTableHeader({ children, className }: FMTableHeaderProps) {
  return (
    <div className={cn("fm-table-header", className)}>
      {children}
    </div>
  )
}

export function FMTableBody({ children, className }: FMTableBodyProps) {
  return (
    <div className={cn("bg-[var(--fm-bg-secondary)]", className)}>
      {children}
    </div>
  )
}

export function FMTableRow({ children, isEven = false, onClick, className }: FMTableRowProps) {
  return (
    <div 
      className={cn(
        "fm-table-row",
        isEven ? "fm-table-row-even" : "fm-table-row-odd",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function FMTableFooter({ children, className }: FMTableFooterProps) {
  return (
    <div className={cn("fm-table-footer", className)}>
      {children}
    </div>
  )
}

// Utility component for stats
interface FMStatProps {
  label: string
  value: string | number
  color?: 'blue' | 'yellow' | 'green' | 'red' | 'purple'
  className?: string
}

export function FMStat({ label, value, color = 'blue', className }: FMStatProps) {
  return (
    <div className={cn("flex justify-between items-center py-1", className)}>
      <span className="fm-text-secondary">{label}:</span>
      <span className={cn(`fm-stat-${color}`, "font-mono font-medium")}>
        {value}
      </span>
    </div>
  )
}
