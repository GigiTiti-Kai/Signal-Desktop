// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { createSelector } from 'reselect';

import type { StateType } from '../reducer.preload.js';
import type { ScheduledMessagesStateType } from '../ducks/scheduledMessages.preload.js';
import type { ScheduledMessageType } from '../../types/ScheduledMessages.std.js';

export const getScheduledMessagesState = (
  state: StateType
): ScheduledMessagesStateType => state.scheduledMessages;

export const getScheduledMessagesForConversation = createSelector(
  [
    getScheduledMessagesState,
    (_state: StateType, conversationId: string) => conversationId,
  ],
  (
    scheduledMessages: ScheduledMessagesStateType,
    conversationId: string
  ): ReadonlyArray<ScheduledMessageType> => {
    return scheduledMessages.byConversationId[conversationId] ?? [];
  }
);

export const getScheduledMessagesForConversationSelector = createSelector(
  [getScheduledMessagesState],
  (scheduledMessages: ScheduledMessagesStateType) => {
    return (conversationId: string): ReadonlyArray<ScheduledMessageType> => {
      return scheduledMessages.byConversationId[conversationId] ?? [];
    };
  }
);

export const getNextScheduledMessageTime = createSelector(
  [getScheduledMessagesState],
  (scheduledMessages: ScheduledMessagesStateType): number | undefined => {
    return scheduledMessages.nextScheduledTime;
  }
);

export const hasScheduledMessagesForConversation = createSelector(
  [getScheduledMessagesForConversation],
  (messages: ReadonlyArray<ScheduledMessageType>): boolean => {
    return messages.length > 0;
  }
);

export const getScheduledMessagesCountForConversation = createSelector(
  [getScheduledMessagesForConversation],
  (messages: ReadonlyArray<ScheduledMessageType>): number => {
    return messages.length;
  }
);
