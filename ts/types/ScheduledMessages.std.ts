// Copyright 2025 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { AttachmentDraftType } from './Attachment.std.js';
import type { DraftBodyRanges } from './BodyRange.std.js';

export type ScheduledMessageStatus = 'pending' | 'sending' | 'cancelled';

export type ScheduledMessageType = {
  id: number;
  conversationId: string;
  scheduledAt: number;
  body: string | undefined;
  bodyRanges: DraftBodyRanges | undefined;
  attachments: ReadonlyArray<AttachmentDraftType>;
  status: ScheduledMessageStatus;
  createdAt: number;
};

// For DB storage (JSON serialized fields)
export type ScheduledMessageDBType = {
  id: number;
  conversationId: string;
  scheduledAt: number;
  body: string | null;
  bodyRanges: string | null; // JSON string
  attachments: string | null; // JSON string
  status: string;
  createdAt: number;
};

// For creating a new scheduled message
export type ScheduledMessageCreateType = {
  conversationId: string;
  scheduledAt: number;
  body: string | undefined;
  bodyRanges: DraftBodyRanges | undefined;
  attachments: ReadonlyArray<AttachmentDraftType>;
};

// For updating an existing scheduled message
export type ScheduledMessageUpdateType = {
  id: number;
  scheduledAt?: number;
  body?: string | undefined;
  bodyRanges?: DraftBodyRanges | undefined;
  attachments?: ReadonlyArray<AttachmentDraftType>;
};
