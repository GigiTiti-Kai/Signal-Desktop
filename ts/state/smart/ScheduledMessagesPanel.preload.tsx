// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { memo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ScheduledMessagesPanel } from '../../components/conversation/ScheduledMessagesPanel.dom.js';
import type { ScheduledMessageType } from '../../types/ScheduledMessages.std.js';
import { getIntl } from '../selectors/user.std.js';
import { getScheduledMessagesForConversationSelector } from '../selectors/scheduledMessages.std.js';
import { useScheduledMessagesActions } from '../ducks/scheduledMessages.preload.js';

export type SmartScheduledMessagesPanelProps = {
  conversationId: string;
};

export const SmartScheduledMessagesPanel = memo(
  function SmartScheduledMessagesPanel({
    conversationId,
  }: SmartScheduledMessagesPanelProps) {
    const i18n = useSelector(getIntl);
    const getScheduledMessages = useSelector(
      getScheduledMessagesForConversationSelector
    );
    const scheduledMessages = getScheduledMessages(conversationId);

    const {
      refreshScheduledMessagesForConversation,
      deleteScheduledMessage,
    } = useScheduledMessagesActions();

    // Refresh scheduled messages when component mounts
    useEffect(() => {
      refreshScheduledMessagesForConversation(conversationId);
    }, [conversationId, refreshScheduledMessagesForConversation]);

    const handleEditScheduledMessage = useCallback(
      (message: ScheduledMessageType) => {
        // TODO: Implement edit functionality - open modal with message data
        console.log('Edit scheduled message:', message);
      },
      []
    );

    const handleDeleteScheduledMessage = useCallback(
      (messageId: number) => {
        deleteScheduledMessage(messageId, conversationId);
      },
      [deleteScheduledMessage, conversationId]
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
