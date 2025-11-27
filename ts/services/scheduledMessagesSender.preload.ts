// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import lodash from 'lodash';

import * as Errors from '../types/errors.std.js';
import { createLogger } from '../logging/log.std.js';
import { DataReader, DataWriter } from '../sql/Client.preload.js';
import { clearTimeoutIfNecessary } from '../util/clearTimeoutIfNecessary.std.js';
import { sleep } from '../util/sleep.std.js';
import { SECOND } from '../util/durations/index.std.js';
import type { ScheduledMessageType } from '../types/ScheduledMessages.std.js';

const { debounce } = lodash;

const log = createLogger('scheduledMessagesSender');

class ScheduledMessagesSenderService {
  #timeout?: ReturnType<typeof setTimeout>;
  #debouncedCheckScheduledMessages = debounce(
    this.#checkScheduledMessages,
    1000
  );

  update() {
    drop(this.#debouncedCheckScheduledMessages());
  }

  async #sendScheduledMessages() {
    try {
      log.info('sendScheduledMessages: Loading pending messages...');
      const messages = await DataReader.getPendingScheduledMessages();
      log.info(
        `sendScheduledMessages: found ${messages.length} messages to send`
      );

      for (const scheduledMessage of messages) {
        await this.#sendSingleScheduledMessage(scheduledMessage);
      }
    } catch (error) {
      log.error(
        'sendScheduledMessages: Error sending scheduled messages',
        Errors.toLogFormat(error)
      );
      log.info('sendScheduledMessages: Waiting 30 seconds before trying again');
      await sleep(30 * SECOND);
    }

    log.info('sendScheduledMessages: done, scheduling another check');
    void this.update();
  }

  async #sendSingleScheduledMessage(scheduledMessage: ScheduledMessageType) {
    const { id, conversationId, body, bodyRanges, attachments } =
      scheduledMessage;

    log.info(`sendScheduledMessages: Sending message ${id} to ${conversationId}`);

    try {
      // Mark as sending to prevent duplicate sends
      await DataWriter.updateScheduledMessageStatus(id, 'sending');

      // Get the conversation
      const conversation = window.ConversationController.get(conversationId);
      if (!conversation) {
        log.error(
          `sendScheduledMessages: Conversation ${conversationId} not found, deleting scheduled message`
        );
        await DataWriter.deleteScheduledMessage(id);
        return;
      }

      // Enqueue the message for sending
      await conversation.enqueueMessageForSend(
        {
          body,
          attachments: attachments ? [...attachments] : [],
          bodyRanges,
          preview: [],
        },
        {
          dontClearDraft: true,
        }
      );

      log.info(`sendScheduledMessages: Successfully sent message ${id}`);

      // Delete the scheduled message after successful send
      await DataWriter.deleteScheduledMessage(id);

      // Refresh the Redux state
      if (window.reduxActions?.scheduledMessages) {
        window.reduxActions.scheduledMessages.refreshScheduledMessagesForConversation(
          conversationId
        );
      }
    } catch (error) {
      log.error(
        `sendScheduledMessages: Failed to send message ${id}`,
        Errors.toLogFormat(error)
      );

      // Reset status back to pending to retry later
      await DataWriter.updateScheduledMessageStatus(id, 'pending');
    }
  }

  async #checkScheduledMessages() {
    log.info('checkScheduledMessages: checking for scheduled messages');

    const nextScheduledTime = await DataReader.getNextScheduledMessageTime();
    if (!nextScheduledTime) {
      log.info('checkScheduledMessages: found no scheduled messages');
      return;
    }

    let wait = nextScheduledTime - Date.now();

    // In the past - send immediately
    if (wait < 0) {
      wait = 0;
    }

    // Too far in the future, since it's limited to a 32-bit value
    if (wait > 2147483647) {
      wait = 2147483647;
    }

    log.info(
      `checkScheduledMessages: next message scheduled for ${new Date(
        nextScheduledTime
      ).toISOString()}; waiting ${wait} ms before sending`
    );

    clearTimeoutIfNecessary(this.#timeout);
    this.#timeout = setTimeout(this.#sendScheduledMessages.bind(this), wait);
  }

  // Handle any messages that were scheduled in the past (e.g., app was closed)
  async sendPastScheduledMessages() {
    log.info('sendPastScheduledMessages: checking for past scheduled messages');

    try {
      const pastMessages = await DataReader.getPendingScheduledMessages();
      if (pastMessages.length === 0) {
        log.info('sendPastScheduledMessages: no past messages found');
        return;
      }

      log.info(
        `sendPastScheduledMessages: found ${pastMessages.length} past messages to send`
      );

      for (const message of pastMessages) {
        await this.#sendSingleScheduledMessage(message);
      }
    } catch (error) {
      log.error(
        'sendPastScheduledMessages: Error sending past messages',
        Errors.toLogFormat(error)
      );
    }

    // Schedule the next check
    void this.update();
  }
}

let instance: ScheduledMessagesSenderService | undefined;

export function initialize(): void {
  if (instance) {
    log.warn('Scheduled Messages Sender service is already initialized!');
    return;
  }
  instance = new ScheduledMessagesSenderService();
  log.info('Scheduled Messages Sender service initialized');
}

export function update(): void {
  if (!instance) {
    throw new Error('Scheduled Messages Sender service not yet initialized!');
  }
  instance.update();
}

export async function sendPastScheduledMessages(): Promise<void> {
  if (!instance) {
    throw new Error('Scheduled Messages Sender service not yet initialized!');
  }
  await instance.sendPastScheduledMessages();
}
