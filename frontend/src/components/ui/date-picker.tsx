import * as React from "react"
import { format, isAfter } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  /** Disable specific dates. Receives a date and returns true to disable it. */
  disabled?: (date: Date) => boolean
  className?: string
  align?: "start" | "center" | "end"
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  align = "start",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isDateDisabled = (date: Date) => {
    if (isAfter(today, date)) return true
    return disabled?.(date) ?? false
  }

  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-full",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">
            {value ? format(value, "MMM d, yyyy") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          defaultMonth={value ?? today}
        />
      </PopoverContent>
    </Popover>
  )
}
