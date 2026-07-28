import { useState } from 'react'
import { CalendarDaysIcon } from 'lucide-react'
import { es } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type DatePickerMode = 'date' | 'month'

function dateFromValue(value: string, mode: DatePickerMode) {
  if (!value) return undefined
  const normalized = mode === 'month' ? `${value}-01` : value
  const date = new Date(`${normalized}T12:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function valueFromDate(date: Date, mode: DatePickerMode) {
  const value = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
  return mode === 'month' ? value.slice(0, 7) : value
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  disabled = false,
  mode = 'date',
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  mode?: DatePickerMode
}) {
  const [open, setOpen] = useState(false)
  const selected = dateFromValue(value, mode)

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={mode === 'month' ? 'AAAA-MM' : 'AAAA-MM-DD'}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Abrir selector de fecha"
        title={`Abrir calendario: ${label}`}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <CalendarDaysIcon aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-fit max-w-[calc(100%-2rem)] p-4"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              {mode === 'month'
                ? 'Selecciona cualquier día del mes que quieres consultar.'
                : 'Selecciona la fecha en el calendario.'}
            </DialogDescription>
          </DialogHeader>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (!date) return
              onChange(valueFromDate(date, mode))
              setOpen(false)
            }}
            defaultMonth={selected}
            captionLayout="dropdown"
            locale={es}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
