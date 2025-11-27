// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ScheduledMessagesPanel } from '../../components/conversation/ScheduledMessagesPanel.dom.js';
import type { ScheduledMessageType } from '../../types/ScheduledMessages.std.js';
import { getIntl } from '../selectors/user.std.js';

export type SmartScheduledMessagesPanelProps = {
  conversationId: string;
};

export const SmartScheduledMessagesPanel = memo(
  function SmartScheduledMessagesPanel({
    conversationId,
  }: SmartScheduledMessagesPanelProps) {
    const i18n = useSelector(getIntl);

    // TODO: Get scheduled messages from Redux store
    // For now, return empty array
    const scheduledMessages: ReadonlyArray<ScheduledMessageType> = [];

    const handleEditScheduledMessage = useCallback(
      (message: ScheduledMessageType) => {
        // TODO: Implement edit functionality
        console.log('Edit scheduled message:', message);
      },
      []
    );

    const handleDeleteScheduledMessage = useCallback(
      (messageId: number) => {
        // TODO: Implement delete functionality
        console.log('Delete scheduled message:', messageId);
      },
      []
    );

    return (
      <ScheduledMessagesPanel
        i18n={i18n}
        conversationId={conversationId}
        scheduledMessages={scheduledMessages}
        onEditScheduledMessage={handleEditScheduledMessage}
        onDeleteScheduledMessage={handleDeleteScheduledMessage}
      />
    );
  }
);
