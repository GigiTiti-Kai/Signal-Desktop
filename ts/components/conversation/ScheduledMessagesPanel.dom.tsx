// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useCallback } from 'react';
import type { LocalizerType } from '../../types/Util.std.js';
import type { ScheduledMessageType } from '../../types/ScheduledMessages.std.js';
import { PanelSection } from './conversation-details/PanelSection.dom.js';
import { PanelRow } from './conversation-details/PanelRow.dom.js';
import { ConfirmationDialog } from '../ConfirmationDialog.dom.js';

const CSS_MODULE = 'module-scheduled-messages-panel';

export type PropsType = Readonly<{
  i18n: LocalizerType;
  conversationId: string;
  scheduledMessages: ReadonlyArray<ScheduledMessageType>;
  onEditScheduledMessage: (message: ScheduledMessageType) => void;
  onDeleteScheduledMessage: (messageId: number) => void;
}>;

function formatScheduledTime(
  timestamp: number,
  i18n: LocalizerType
): { date: string; time: string } {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return { date: dateStr, time: timeStr };
}

export function ScheduledMessagesPanel({
  i18n,
  conversationId,
  scheduledMessages,
  onEditScheduledMessage,
  onDeleteScheduledMessage,
}: PropsType): JSX.Element {
  const [messageToDelete, setMessageToDelete] = React.useState<number | null>(
    null
  );

  const handleConfirmDelete = useCallback(() => {
    if (messageToDelete != null) {
      onDeleteScheduledMessage(messageToDelete);
      setMessageToDelete(null);
    }
  }, [messageToDelete, onDeleteScheduledMessage]);

  const handleCancelDelete = useCallback(() => {
    setMessageToDelete(null);
  }, []);

  return (
    <div className={CSS_MODULE}>
      <PanelSection>
        {scheduledMessages.length === 0 ? (
          <div className={`${CSS_MODULE}__empty`}>
            {i18n('icu:ScheduledMessagesPanel__empty')}
          </div>
        ) : (
          scheduledMessages.map(message => {
            const { date, time } = formatScheduledTime(
              message.scheduledAt,
              i18n
            );
            const preview =
              message.body || `[${message.attachments.length} attachment(s)]`;

            return (
              <div key={message.id} className={`${CSS_MODULE}__item`}>
                <div className={`${CSS_MODULE}__item-content`}>
                  <div className={`${CSS_MODULE}__item-time`}>
                    {i18n('icu:ScheduledMessagesPanel__scheduled-for', {
                      date,
                      time,
                    })}
                  </div>
                  <div className={`${CSS_MODULE}__item-preview`}>{preview}</div>
                </div>
                <div className={`${CSS_MODULE}__item-actions`}>
                  <button
                    type="button"
                    className={`${CSS_MODULE}__action-button ${CSS_MODULE}__action-button--edit`}
                    onClick={() => onEditScheduledMessage(message)}
                    aria-label={i18n('icu:ScheduledMessagesPanel__edit')}
                  >
                    {i18n('icu:ScheduledMessagesPanel__edit')}
                  </button>
                  <button
                    type="button"
                    className={`${CSS_MODULE}__action-button ${CSS_MODULE}__action-button--delete`}
                    onClick={() => setMessageToDelete(message.id)}
                    aria-label={i18n('icu:ScheduledMessagesPanel__delete')}
                  >
                    {i18n('icu:ScheduledMessagesPanel__delete')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </PanelSection>

      {messageToDelete != null && (
        <ConfirmationDialog
          dialogName="ScheduledMessagesPanel.deleteConfirm"
          i18n={i18n}
          onClose={handleCancelDelete}
          actions={[
            {
              text: i18n('icu:ScheduledMessagesPanel__delete'),
              style: 'negative',
              action: handleConfirmDelete,
            },
          ]}
        >
          Are you sure you want to delete this scheduled message?
        </ConfirmationDialog>
      )}
    </div>
  );
}
