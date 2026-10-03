"use client"

import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DropdownProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** Month / year dropdown using the app's themed Radix Select instead of a native <select>. */
function CalendarDropdown({ options, value, onChange, disabled, "aria-label": ariaLabel }: DropdownProps) {
  const current = options?.find((option) => option.value === value)
  return (
    <Select
      value={value === undefined ? undefined : String(value)}
      disabled={disabled}
      onValueChange={(next) =>
        onChange?.({ target: { value: next } } as unknown as React.ChangeEvent<HTMLSelectElement>)
      }
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className="h-8 w-auto gap-1 rounded-md border-input bg-background px-2 text-sm font-medium text-on-surface focus:ring-primary/40 focus:ring-offset-0"
      >
        <SelectValue>{current?.label}</SelectValue>
      </SelectTrigger>
      {/* Inline styles so the menu stays solid and bounded even if a stale
          cached stylesheet lacks the newer utility classes. */}
      <SelectContent
        className="max-h-72 border-border bg-popover text-popover-foreground"
        style={{
          backgroundColor: "var(--color-popover)",
          color: "var(--color-popover-foreground)",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          maxHeight: "18rem",
          overflowY: "auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        {options?.map((option) => (
          <SelectItem key={option.value} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/**
 * shadcn Calendar. The original snippet targets react-day-picker v8; this app
 * uses v9 (the only version compatible with React 19 + date-fns 4), so the
 * same styles are mapped onto v9's class keys.
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        // Side padding keeps the month/year dropdowns clear of the arrow buttons.
        month_caption: "flex justify-center relative items-center h-8 px-8",
        caption_label: "text-sm font-medium inline-flex items-center gap-1",
        dropdowns: "flex items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root: "relative inline-flex items-center",
        // The nav bar spans the header; let clicks through to the dropdowns under it.
        nav: "pointer-events-none absolute inset-x-0 top-3 flex h-8 items-center justify-between px-3 z-10 [&>button]:pointer-events-auto",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week_number_header: "text-muted-foreground w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        week_number: "h-9 w-9 flex items-center justify-center text-[0.8rem] text-muted-foreground",
        day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal hover:bg-primary/15 hover:text-on-surface"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground rounded-md",
        today: "[&>button]:bg-primary/15 [&>button]:text-on-surface rounded-md",
        outside: "text-muted-foreground opacity-60",
        disabled: "text-muted-foreground opacity-40",
        range_middle: "aria-selected:bg-primary/15",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Dropdown: CalendarDropdown,
        Chevron: ({ className, orientation, ...rest }) => {
          const Icon =
            orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown
          return <Icon className={cn("h-4 w-4", className)} {...rest} />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
