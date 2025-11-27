// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { WritableDB } from '../Interface.std.js';
import { sql } from '../util.std.js';

export default function updateToSchemaVersion1570(db: WritableDB): void {
  const [query] = sql`
    CREATE TABLE scheduledMessages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      scheduledAt     INTEGER NOT NULL,
      body            TEXT,
      bodyRanges      TEXT,
      attachments     TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      createdAt       INTEGER NOT NULL
    ) STRICT;

    CREATE INDEX scheduledMessages_byConversation
      ON scheduledMessages(
        conversationId,
        scheduledAt ASC
      );

    CREATE INDEX scheduledMessages_pending
      ON scheduledMessages(
        status,
        scheduledAt ASC
      )
      WHERE status = 'pending';
  `;
  db.exec(query);
}
