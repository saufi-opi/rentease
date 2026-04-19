import * as React from "react"
import { format, isAfter } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange, Modifiers } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
  from: Date | undefined
  to: Date | undefined
  onSelect: (range: { from: Date | undefined; to: Date | undefined }) => void
  placeholder?: string
  className?: string
  /** Number of months to show side-by-side. Default 2 for wide, 1 for compact. */
  numberOfMonths?: 1 | 2
  align?: "start" | "center" | "end"
  modifiers?: Partial<Modifiers>
  modifiersClassNames?: Record<string, string>
}

export function DateRangePicker({
  from,
  to,
  onSelect,
  placeholder = "Pick dates",
  className,
  numberOfMonths = 2,
  align = "start",
  modifiers,
  modifiersClassNames,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const handleSelect = (range: DateRange | undefined) => {
    onSelect({ from: range?.from, to: range?.to })
    // Auto-close once a full range is selected
    if (range?.from && range?.to) {
      setTimeout(() => setOpen(false), 120)
    }
  }

  const isDisabled = (date: Date) => isAfter(today, date)

  const label =
    from && to
      ? `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`
      : from
        ? format(from, "MMM d, yyyy")
        : null

  return (
    <Popover open={open} onOpenChange={(val) => { if (val) setOpen(true) }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-full",
            !label && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{label ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={align}
        onPointerDownOutside={() => setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={handleSelect}
          disabled={isDisabled}
          numberOfMonths={numberOfMonths}
          defaultMonth={from ?? today}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
        />
      </PopoverContent>
    </Popover>
  )
}
