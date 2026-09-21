"use client";

import { parseDate } from "@internationalized/date";
import { Calendar, DateField, DatePicker, Label } from "@heroui/react";

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  ariaLabel?: string;
}

/** Selector de fecha HeroUI que conserva el valor ISO que consume la API. */
export function DatePickerField({
  label,
  value,
  onChange,
  isRequired = false,
  ariaLabel = label,
}: DatePickerFieldProps) {
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDate(value) : null;

  return (
    <DatePicker
      value={dateValue}
      onChange={(date) => onChange(date?.toString() ?? "")}
      isRequired={isRequired}
    >
      <Label>{label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger aria-label={`Abrir calendario: ${ariaLabel}`}>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DatePicker.Popover>
        <Calendar aria-label={ariaLabel}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
