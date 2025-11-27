// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { ReadonlyDeep } from 'type-fest';
import type { ThunkAction } from 'redux-thunk';
import { throttle } from 'lodash';
import type { StateType as RootStateType } from '../reducer.preload.js';
import type { BoundActionCreatorsMapObject } from '../../hooks/useBoundActions.std.js';
import { useBoundActions } from '../../hooks/useBoundActions.std.js';
import type {
  ScheduledMessageType,
  ScheduledMessageCreateType,
  ScheduledMessageUpdateType,
} from '../../types/ScheduledMessages.std.js';
import { DataReader, DataWriter } from '../../sql/Client.preload.js';
import type { ShowToastActionType } from './toast.preload.js';
import { showToast } from './toast.preload.js';
import { ToastType } from '../../types/Toast.dom.js';

// State type
export type ScheduledMessagesStateType = ReadonlyDeep<{
  // Map of conversationId -> scheduled messages for that conversation
  byConversationId: Record<string, ReadonlyArray<ScheduledMessageType>>;
  // Next scheduled time for the timer
  nextScheduledTime: number | undefined;
}>;

// Action types
const SCHEDULED_MESSAGES_LOAD = 'scheduledMessages/LOAD';
const SCHEDULED_MESSAGES_LOAD_FOR_CONVERSATION =
  'scheduledMessages/LOAD_FOR_CONVERSATION';
const SCHEDULED_MESSAGES_UPDATE_NEXT_TIME =
  'scheduledMessages/UPDATE_NEXT_TIME';

type ScheduledMessagesLoadAction = ReadonlyDeep<{
  type: typeof SCHEDULED_MESSAGES_LOAD;
  payload: {
    messages: ReadonlyArray<ScheduledMessageType>;
  };
}>;

type ScheduledMessagesLoadForConversationAction = ReadonlyDeep<{
  type: typeof SCHEDULED_MESSAGES_LOAD_FOR_CONVERSATION;
  payload: {
    conversationId: string;
    messages: ReadonlyArray<ScheduledMessageType>;
  };
}>;

type ScheduledMessagesUpdateNextTimeAction = ReadonlyDeep<{
  type: typeof SCHEDULED_MESSAGES_UPDATE_NEXT_TIME;
  payload: {
    nextScheduledTime: number | undefined;
  };
}>;

export type ScheduledMessagesActionType = ReadonlyDeep<
  | ScheduledMessagesLoadAction
  | ScheduledMessagesLoadForConversationAction
  | ScheduledMessagesUpdateNextTimeAction
>;

// Initial state
export function getEmptyState(): ScheduledMessagesStateType {
  return {
    byConversationId: {},
    nextScheduledTime: undefined,
  };
}

// Action creators
function loadAllScheduledMessages(
  messages: ReadonlyArray<ScheduledMessageType>
): ScheduledMessagesLoadAction {
  return {
    type: SCHEDULED_MESSAGES_LOAD,
    payload: { messages },
  };
}

function loadScheduledMessagesForConversation(
  conversationId: string,
  messages: ReadonlyArray<ScheduledMessageType>
): ScheduledMessagesLoadForConversationAction {
  return {
    type: SCHEDULED_MESSAGES_LOAD_FOR_CONVERSATION,
    payload: { conversationId, messages },
  };
}

function updateNextScheduledTime(
  nextScheduledTime: number | undefined
): ScheduledMessagesUpdateNextTimeAction {
  return {
    type: SCHEDULED_MESSAGES_UPDATE_NEXT_TIME,
    payload: { nextScheduledTime },
  };
}

// Thunk action creators
function _refreshScheduledMessages(): ThunkAction<
  void,
  RootStateType,
  unknown,
  ScheduledMessagesLoadAction | ScheduledMessagesUpdateNextTimeAction
> {
  return async dispatch => {
    const messages = await DataReader.getAllScheduledMessages();
    const nextTime = await DataReader.getNextScheduledMessageTime();
    dispatch(loadAllScheduledMessages(messages));
    dispatch(updateNextScheduledTime(nextTime));
  };
}

export const refreshScheduledMessages = throttle(_refreshScheduledMessages, 100);

function refreshScheduledMessagesForConversation(
  conversationId: string
): ThunkAction<
  void,
  RootStateType,
  unknown,
  ScheduledMessagesLoadForConversationAction | ScheduledMessagesUpdateNextTimeAction
> {
  return async dispatch => {
    const messages =
      await DataReader.getScheduledMessagesForConversation(conversationId);
    const nextTime = await DataReader.getNextScheduledMessageTime();
    dispatch(loadScheduledMessagesForConversation(conversationId, messages));
    dispatch(updateNextScheduledTime(nextTime));
  };
}

function createScheduledMessage(
  message: ScheduledMessageCreateType
): ThunkAction<
  Promise<ScheduledMessageType>,
  RootStateType,
  unknown,
  | ScheduledMessagesLoadForConversationAction
  | ScheduledMessagesUpdateNextTimeAction
  | ShowToastActionType
> {
  return async dispatch => {
    const created = await DataWriter.createScheduledMessage(message);
    dispatch(refreshScheduledMessagesForConversation(message.conversationId));
    dispatch(
      showToast({
        toastType: ToastType.MessageScheduled,
      })
    );
    return created;
  };
}

function updateScheduledMessage(
  update: ScheduledMessageUpdateType,
  conversationId: string
): ThunkAction<
  Promise<ScheduledMessageType | undefined>,
  RootStateType,
  unknown,
  ScheduledMessagesLoadForConversationAction | ScheduledMessagesUpdateNextTimeAction
> {
  return async dispatch => {
    const updated = await DataWriter.updateScheduledMessage(update);
    dispatch(refreshScheduledMessagesForConversation(conversationId));
    return updated;
  };
}

function deleteScheduledMessage(
  id: number,
  conversationId: string
): ThunkAction<
  void,
  RootStateType,
  unknown,
  | ScheduledMessagesLoadForConversationAction
  | ScheduledMessagesUpdateNextTimeAction
  | ShowToastActionType
> {
  return async dispatch => {
    await DataWriter.deleteScheduledMessage(id);
    dispatch(refreshScheduledMessagesForConversation(conversationId));
    dispatch(
      showToast({
        toastType: ToastType.ScheduledMessageDeleted,
      })
    );
  };
}

function deleteScheduledMessagesForConversation(
  conversationId: string
): ThunkAction<
  void,
  RootStateType,
  unknown,
  ScheduledMessagesLoadForConversationAction | ScheduledMessagesUpdateNextTimeAction
> {
  return async dispatch => {
    await DataWriter.deleteScheduledMessagesForConversation(conversationId);
    dispatch(refreshScheduledMessagesForConversation(conversationId));
  };
}

// Actions export
export const actions = {
  refreshScheduledMessages,
  refreshScheduledMessagesForConversation,
  createScheduledMessage,
  updateScheduledMessage,
  deleteScheduledMessage,
  deleteScheduledMessagesForConversation,
};

export const useScheduledMessagesActions = (): BoundActionCreatorsMapObject<
  typeof actions
> => useBoundActions(actions);

// Reducer
export function reducer(
  state: ScheduledMessagesStateType = getEmptyState(),
  action: ScheduledMessagesActionType
): ScheduledMessagesStateType {
  switch (action.type) {
    case SCHEDULED_MESSAGES_LOAD: {
      const { messages } = action.payload;
      // Group messages by conversationId
      const byConversationId: Record<string, Array<ScheduledMessageType>> = {};
      for (const message of messages) {
        if (!byConversationId[message.conversationId]) {
          byConversationId[message.conversationId] = [];
        }
        byConversationId[message.conversationId].push(message);
      }
      return {
        ...state,
        byConversationId,
      };
    }

    case SCHEDULED_MESSAGES_LOAD_FOR_CONVERSATION: {
      const { conversationId, messages } = action.payload;
      return {
        ...state,
        byConversationId: {
          ...state.byConversationId,
          [conversationId]: messages,
        },
      };
    }

    case SCHEDULED_MESSAGES_UPDATE_NEXT_TIME: {
      const { nextScheduledTime } = action.payload;
      return {
        ...state,
        nextScheduledTime,
      };
    }

    default:
      return state;
  }
}
