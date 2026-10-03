"use client"

import * as React from "react"
import { addMonths, format, parseISO, startOfMonth } from "date-fns"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// Sizes set inline (not only as utility classes) so the layout holds even when a
// browser still has an older cached stylesheet.
const CARD_WIDTH = "20rem"
const BODY_HEIGHT = "18rem"

function parseDay(value?: string): Date | undefined {
  if (!value) return undefined
  const date = parseISO(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export interface DatePickerProps {
  /** Selected date as "yyyy-MM-dd" ("" when empty). */
  value: string
  onChange: (value: string) => void
  /** Earliest / latest selectable dates as "yyyy-MM-dd". */
  min?: string
  max?: string
  id?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

type View = "days" | "months" | "years"

/**
 * Date field that opens the shadcn Calendar with week numbers. Clicking the
 * month or year in the header fills the calendar box with a month or year grid.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  placeholder = "Select a date",
  className,
  disabled,
}: DatePickerProps) {
  const selected = parseDay(value)
  const minDate = parseDay(min)
  const maxDate = parseDay(max)
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<View>("days")
  const [month, setMonth] = React.useState<Date>(startOfMonth(selected ?? maxDate ?? new Date()))
  const yearListRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    setView("days")
    setMonth(startOfMonth(selected ?? maxDate ?? new Date()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Centre the current year when the year grid opens.
  React.useEffect(() => {
    if (view !== "years") return
    const list = yearListRef.current
    const item = list?.querySelector<HTMLElement>("[data-current='true']")
    if (list && item) list.scrollTop = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2
  }, [view])

  const minMonth = minDate ? startOfMonth(minDate) : undefined
  const maxMonth = maxDate ? startOfMonth(maxDate) : undefined
  const clamp = (date: Date) => {
    const m = startOfMonth(date)
    if (minMonth && m < minMonth) return minMonth
    if (maxMonth && m > maxMonth) return maxMonth
    return m
  }
  const monthAllowed = (year: number, index: number) => {
    const m = new Date(year, index, 1)
    return !((minMonth && m < minMonth) || (maxMonth && m > maxMonth))
  }

  const firstYear = (minDate ?? new Date(1926, 0, 1)).getFullYear()
  const lastYear = (maxDate ?? new Date()).getFullYear()
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => lastYear - i)

  const canPrev = !minMonth || month > minMonth
  const canNext = !maxMonth || month < maxMonth

  const headerButton =
    "inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40"
  const arrowButton =
    "flex h-7 w-7 items-center justify-center rounded-md border border-input text-on-surface-variant opacity-70 transition hover:opacity-100 disabled:pointer-events-none disabled:opacity-25"
  const gridItem =
    "rounded-lg text-sm font-semibold text-on-surface transition-colors hover:bg-primary/15 disabled:pointer-events-none disabled:opacity-25"
  const activeItem = "gradient-brand text-white hover:bg-transparent"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-outline-variant/30 bg-secondary/50 px-4 text-left text-sm outline-none transition-colors focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span className={selected ? "text-on-surface" : "text-on-surface-variant"}>
            {selected ? format(selected, "d MMMM yyyy") : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-on-surface-variant" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
        style={{
          width: CARD_WIDTH,
          backgroundColor: "var(--color-popover)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous month"
            className={arrowButton}
            disabled={view !== "days" || !canPrev}
            onClick={() => setMonth(clamp(addMonths(month, -1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Choose month"
              aria-expanded={view === "months"}
              className={cn(headerButton, view === "months" && "border-primary text-primary")}
              onClick={() => setView(view === "months" ? "days" : "months")}
            >
              {format(month, "MMMM")}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", view === "months" && "rotate-180")} />
            </button>
            <button
              type="button"
              aria-label="Choose year"
              aria-expanded={view === "years"}
              className={cn(headerButton, view === "years" && "border-primary text-primary")}
              onClick={() => setView(view === "years" ? "days" : "years")}
            >
              {month.getFullYear()}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", view === "years" && "rotate-180")} />
            </button>
          </div>
          <button
            type="button"
            aria-label="Next month"
            className={arrowButton}
            disabled={view !== "days" || !canNext}
            onClick={() => setMonth(clamp(addMonths(month, 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Body: same size in every view, so the month / year grids fill the whole calendar area */}
        <div className="mt-2" style={{ height: BODY_HEIGHT }}>
          {view === "days" ? (
            <Calendar
              mode="single"
              showWeekNumber
              hideNavigation
              month={month}
              onMonthChange={(m) => setMonth(clamp(m))}
              selected={selected}
              startMonth={minMonth}
              endMonth={maxMonth}
              disabled={[
                ...(minDate ? [{ before: minDate }] : []),
                ...(maxDate ? [{ after: maxDate }] : []),
              ]}
              onSelect={(day) => {
                if (!day) return
                onChange(format(day, "yyyy-MM-dd"))
                setOpen(false)
              }}
              className="p-0"
              classNames={{ month_caption: "hidden", months: "flex flex-col", month: "space-y-0" }}
            />
          ) : view === "months" ? (
            <div
              role="listbox"
              aria-label="Months"
              style={{
                display: "grid",
                height: "100%",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gridTemplateRows: "repeat(4, minmax(0, 1fr))",
                gap: "0.5rem",
              }}
            >
              {MONTHS.map((name, index) => {
                const current = index === month.getMonth()
                return (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={current}
                    disabled={!monthAllowed(month.getFullYear(), index)}
                    onClick={() => {
                      setMonth(clamp(new Date(month.getFullYear(), index, 1)))
                      setView("days")
                    }}
                    className={cn(gridItem, current && activeItem)}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          ) : (
            <div
              ref={yearListRef}
              role="listbox"
              aria-label="Years"
              data-lenis-prevent
              style={{
                display: "grid",
                height: "100%",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gridAutoRows: "2.75rem",
                gap: "0.5rem",
                overflowY: "auto",
                overscrollBehavior: "contain",
                scrollbarWidth: "thin",
                scrollbarColor: "var(--color-primary) transparent",
                paddingRight: "0.25rem",
              }}
            >
              {years.map((year) => {
                const current = year === month.getFullYear()
                return (
                  <button
                    key={year}
                    type="button"
                    role="option"
                    aria-selected={current}
                    data-current={current}
                    onClick={() => {
                      setMonth(clamp(new Date(year, month.getMonth(), 1)))
                      setView("months")
                    }}
                    className={cn(gridItem, current && activeItem)}
                  >
                    {year}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
