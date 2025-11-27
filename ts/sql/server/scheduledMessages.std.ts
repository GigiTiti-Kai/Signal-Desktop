// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { sql } from '../util.std.js';

import type {
  ScheduledMessageType,
  ScheduledMessageDBType,
  ScheduledMessageCreateType,
  ScheduledMessageUpdateType,
  ScheduledMessageStatus,
} from '../../types/ScheduledMessages.std.js';
import type { ReadableDB, WritableDB } from '../Interface.std.js';

function dbRowToScheduledMessage(row: ScheduledMessageDBType): ScheduledMessageType {
  return {
    id: row.id,
    conversationId: row.conversationId,
    scheduledAt: row.scheduledAt,
    body: row.body ?? undefined,
    bodyRanges: row.bodyRanges ? JSON.parse(row.bodyRanges) : undefined,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    status: row.status as ScheduledMessageStatus,
    createdAt: row.createdAt,
  };
}

export function getAllScheduledMessages(
  db: ReadableDB
): Array<ScheduledMessageType> {
  const [query, params] = sql`
    SELECT * FROM scheduledMessages
    ORDER BY scheduledAt ASC
  `;
  return db
    .prepare(query)
    .all<ScheduledMessageDBType>(params)
    .map(dbRowToScheduledMessage);
}

export function getScheduledMessagesForConversation(
  db: ReadableDB,
  conversationId: string
): Array<ScheduledMessageType> {
  const [query, params] = sql`
    SELECT * FROM scheduledMessages
    WHERE conversationId = ${conversationId}
    ORDER BY scheduledAt ASC
  `;
  return db
    .prepare(query)
    .all<ScheduledMessageDBType>(params)
    .map(dbRowToScheduledMessage);
}

export function getScheduledMessageById(
  db: ReadableDB,
  id: number
): ScheduledMessageType | undefined {
  const [query, params] = sql`
    SELECT * FROM scheduledMessages
    WHERE id = ${id}
  `;
  const row = db.prepare(query).get<ScheduledMessageDBType>(params);
  if (!row) {
    return undefined;
  }
  return dbRowToScheduledMessage(row);
}

export function getPendingScheduledMessages(
  db: ReadableDB,
  beforeTimestamp?: number
): Array<ScheduledMessageType> {
  const timestamp = beforeTimestamp ?? Date.now();
  const [query, params] = sql`
    SELECT * FROM scheduledMessages
    WHERE status = 'pending'
      AND scheduledAt <= ${timestamp}
    ORDER BY scheduledAt ASC
  `;
  return db
    .prepare(query)
    .all<ScheduledMessageDBType>(params)
    .map(dbRowToScheduledMessage);
}

export function getNextScheduledMessageTime(
  db: ReadableDB
): number | undefined {
  const [query, params] = sql`
    SELECT MIN(scheduledAt) as nextTime
    FROM scheduledMessages
    WHERE status = 'pending'
  `;
  const row = db.prepare(query).get<{ nextTime: number | null }>(params);
  return row?.nextTime ?? undefined;
}

export function createScheduledMessage(
  db: WritableDB,
  message: ScheduledMessageCreateType
): ScheduledMessageType {
  const now = Date.now();
  const [query, params] = sql`
    INSERT INTO scheduledMessages (
      conversationId,
      scheduledAt,
      body,
      bodyRanges,
      attachments,
      status,
      createdAt
    ) VALUES (
      ${message.conversationId},
      ${message.scheduledAt},
      ${message.body ?? null},
      ${message.bodyRanges ? JSON.stringify(message.bodyRanges) : null},
      ${message.attachments.length > 0 ? JSON.stringify(message.attachments) : null},
      'pending',
      ${now}
    )
    RETURNING *
  `;
  const row = db.prepare(query).get<ScheduledMessageDBType>(params);
  if (!row) {
    throw new Error('Failed to create scheduled message');
  }
  return dbRowToScheduledMessage(row);
}

export function updateScheduledMessage(
  db: WritableDB,
  update: ScheduledMessageUpdateType
): ScheduledMessageType | undefined {
  const existing = getScheduledMessageById(db, update.id);
  if (!existing) {
    return undefined;
  }

  const newScheduledAt = update.scheduledAt ?? existing.scheduledAt;
  const newBody = update.body !== undefined ? update.body : existing.body;
  const newBodyRanges = update.bodyRanges !== undefined ? update.bodyRanges : existing.bodyRanges;
  const newAttachments = update.attachments !== undefined ? update.attachments : existing.attachments;

  const [query, params] = sql`
    UPDATE scheduledMessages
    SET
      scheduledAt = ${newScheduledAt},
      body = ${newBody ?? null},
      bodyRanges = ${newBodyRanges ? JSON.stringify(newBodyRanges) : null},
      attachments = ${newAttachments.length > 0 ? JSON.stringify(newAttachments) : null}
    WHERE id = ${update.id}
    RETURNING *
  `;
  const row = db.prepare(query).get<ScheduledMessageDBType>(params);
  if (!row) {
    return undefined;
  }
  return dbRowToScheduledMessage(row);
}

export function updateScheduledMessageStatus(
  db: WritableDB,
  id: number,
  status: ScheduledMessageStatus
): void {
  const [query, params] = sql`
    UPDATE scheduledMessages
    SET status = ${status}
    WHERE id = ${id}
  `;
  db.prepare(query).run(params);
}

export function deleteScheduledMessage(
  db: WritableDB,
  id: number
): void {
  const [query, params] = sql`
    DELETE FROM scheduledMessages
    WHERE id = ${id}
  `;
  db.prepare(query).run(params);
}

export function deleteScheduledMessagesForConversation(
  db: WritableDB,
  conversationId: string
): void {
  const [query, params] = sql`
    DELETE FROM scheduledMessages
    WHERE conversationId = ${conversationId}
  `;
  db.prepare(query).run(params);
}

export function _deleteAllScheduledMessages(
  db: WritableDB
): void {
  db.prepare('DELETE FROM scheduledMessages').run();
}
