// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useState, useCallback, useMemo } from 'react';

import { ConfirmationDialog } from './ConfirmationDialog.dom.js';
import type { LocalizerType } from '../types/Util.std.js';

const CSS_MODULE = 'module-schedule-message-modal';

export type PropsType = Readonly<{
  i18n: LocalizerType;
  onSchedule: (scheduledAt: number) => void;
  onClose: () => void;
}>;

function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function ScheduleMessageModal(props: PropsType): JSX.Element {
  const { i18n, onSchedule, onClose } = props;

  // Default to 1 hour from now, rounded to next 5 minutes
  const defaultDate = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    const minutes = Math.ceil(date.getMinutes() / 5) * 5;
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  }, []);

  const [selectedDate, setSelectedDate] = useState(
    formatDateForInput(defaultDate)
  );
  const [selectedTime, setSelectedTime] = useState(
    formatTimeForInput(defaultDate)
  );
  const [error, setError] = useState<string | null>(null);

  const handleDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedDate(event.target.value);
      setError(null);
    },
    []
  );

  const handleTimeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedTime(event.target.value);
      setError(null);
    },
    []
  );

  const handleSchedule = useCallback(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const [hours, minutes] = selectedTime.split(':').map(Number);

    const scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const now = new Date();

    if (scheduledDate.getTime() <= now.getTime()) {
      setError(i18n('icu:ScheduleMessageModal__past-time-error'));
      return;
    }

    onSchedule(scheduledDate.getTime());
  }, [selectedDate, selectedTime, onSchedule, i18n]);

  // Get minimum date (today)
  const minDate = formatDateForInput(new Date());

  return (
    <ConfirmationDialog
      dialogName="ScheduleMessageModal"
      moduleClassName={CSS_MODULE}
      i18n={i18n}
      onClose={onClose}
      title={i18n('icu:ScheduleMessageModal__title')}
      hasXButton
      actions={[
        {
          text: i18n('icu:ScheduleMessageModal__cancel-button'),
          style: 'negative',
          action: onClose,
        },
        {
          text: i18n('icu:ScheduleMessageModal__schedule-button'),
          style: 'affirmative',
          action: handleSchedule,
        },
      ]}
    >
      <div className={`${CSS_MODULE}__content`}>
        <div className={`${CSS_MODULE}__field`}>
          <label
            className={`${CSS_MODULE}__label`}
            htmlFor="schedule-date-input"
          >
            {i18n('icu:ScheduleMessageModal__date-label')}
          </label>
          <input
            id="schedule-date-input"
            type="date"
            className={`${CSS_MODULE}__input`}
            value={selectedDate}
            min={minDate}
            onChange={handleDateChange}
          />
        </div>
        <div className={`${CSS_MODULE}__field`}>
          <label
            className={`${CSS_MODULE}__label`}
            htmlFor="schedule-time-input"
          >
            {i18n('icu:ScheduleMessageModal__time-label')}
          </label>
          <input
            id="schedule-time-input"
            type="time"
            className={`${CSS_MODULE}__input`}
            value={selectedTime}
            onChange={handleTimeChange}
          />
        </div>
        {error && <div className={`${CSS_MODULE}__error`}>{error}</div>}
      </div>
    </ConfirmationDialog>
  );
}
