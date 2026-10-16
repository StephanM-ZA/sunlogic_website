-- The sunlogic-leads database, from scratch.
--
-- This file and migrations/ must agree: a database built from this must be
-- indistinguishable from one built from the first schema and then migrated.
-- When you add a migration, mirror it here in the same commit.

CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT NOT NULL CHECK (type IN ('contact', 'calculator')),
  payload_json    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_attempt_at TEXT,
  -- 0002: normalised division (energy | electrical | smart | unsure) and the
  -- assignee who accepted. Stored normalised so a future rename is this
  -- column, not four HTML files.
  division        TEXT,
  claimed_by      TEXT,
  -- 0008: a submission from a sunlogic.co.za address. Deliberately never
  -- offered to a director, so it can never be accepted — and therefore must
  -- not be counted among the leads that "arrived", or the digest reads as a
  -- funnel with leads hanging in it. Decided once at submission by
  -- isInternalSubmission, not re-derived in SQL. See migration 0008.
  internal        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 0002 --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS offers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER NOT NULL REFERENCES leads(id),
  assignee    TEXT    NOT NULL CHECK (assignee IN ('stephan','craig')),
  round       INTEGER NOT NULL,
  token       TEXT    NOT NULL UNIQUE,

  -- 'pending_send' is the state that makes R1 work. The row is created when
  -- the offer is decided, but the 24-hour clock must not start until the
  -- email is actually in someone's inbox: the Worker retries a down n8n for
  -- roughly 100 minutes, and a clock started at INSERT would spend that on a
  -- director who has not been told anything yet. The sweeper only ever looks
  -- at 'offered', so a lead waiting on a broken relay simply waits.
  state       TEXT    NOT NULL DEFAULT 'pending_send'
                      CHECK (state IN ('pending_send','offered','accepted','expired')),

  offered_at  TEXT,   -- set when n8n confirms the send
  expires_at  TEXT,   -- offered_at + OFFER_TTL_MINUTES; NULL once revived
  accepted_at TEXT,
  alerted_at  TEXT,   -- last unclaimed alert, so R2 can repeat once a day
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- The sweeper's only query is (state, expires_at). state leads because it is
-- the selective column: almost every row settles into accepted or expired.
CREATE INDEX IF NOT EXISTS idx_offers_sweep ON offers(state, expires_at);
CREATE INDEX IF NOT EXISTS idx_offers_lead  ON offers(lead_id);

CREATE TABLE IF NOT EXISTS rotation (
  -- One row, enforced by the CHECK. Two rotation rows would mean two
  -- alternations running against each other and neither being fair.
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  last_offered_to TEXT
);
INSERT OR IGNORE INTO rotation (id, last_offered_to) VALUES (1, NULL);

-- 0003 --------------------------------------------------------------------
-- Delivery confirmation. Mirrors migrations/0003-delivery-confirmation.sql;
-- the reasoning for each column lives there. In short: Resend's 2xx meant
-- "accepted", we read it as "delivered", and lead 28 was lost in the gap.

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,           -- Resend's message id
  lead_id     INTEGER REFERENCES leads(id),
  offer_id    INTEGER REFERENCES offers(id),
  event       TEXT    NOT NULL,
  assignee    TEXT,
  recipient   TEXT,
  status      TEXT    NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent','delivered','bounced','complained')),
  status_at   TEXT,
  detail      TEXT,
  alerted_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_lead   ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

CREATE TABLE IF NOT EXISTS webhook_events (
  id          TEXT PRIMARY KEY,           -- svix-id
  type        TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- 0004: whether the event named a message we have a record of. An
  -- unmatched event means mail is going out by a path this Worker does not
  -- record, or an id was dropped on the way out. See migration 0004.
  message_id  TEXT,
  matched     INTEGER NOT NULL DEFAULT 0,
  -- 0006: Resend's own words about a failure, kept so an event that arrives
  -- BEFORE the send is recorded can be replayed with its diagnosis intact.
  -- Measured in production: a bounce landed two seconds before the message
  -- row existed. See migration 0006.
  detail      TEXT,
  -- 0007: whose send this event was about — ours | other_env | foreign |
  -- unknown, decided from the payload's `from` and `env` tag. Resend's
  -- endpoint is account-wide, so other projects' events arrive here too and
  -- were inflating the unmatched alarm. NULL predates the column. Decided
  -- from the sender and NEVER from whether a row exists: an event of ours
  -- can arrive before its row (see 0006). See migration 0007.
  origin      TEXT
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_origin
  ON webhook_events(origin, matched, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unmatched
  ON webhook_events(matched, received_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_message
  ON webhook_events(message_id, matched);

-- 0005: brief photos, stored as bytes because R2 could not be enabled without
-- a card and Drive needed a service account. D1 caps a BLOB at 2 MB, so the
-- page downscales before uploading. See migrations/0005-brief-photos.sql.
CREATE TABLE IF NOT EXISTS brief_photos (
  id           TEXT PRIMARY KEY,
  bytes        BLOB    NOT NULL,
  content_type TEXT    NOT NULL,
  file_name    TEXT,
  reference    TEXT,
  size_bytes   INTEGER NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_brief_photos_created   ON brief_photos(created_at);
CREATE INDEX IF NOT EXISTS idx_brief_photos_reference ON brief_photos(reference);

-- 0006: chunks 1..n of a file too large for a single D1 value (the cap is
-- 2,000,000 bytes). Chunk 0 stays in brief_photos.bytes, so a photo is still
-- one primary-key lookup and only large documents pay for the split. See
-- migrations/0006-brief-file-chunks.sql.
CREATE TABLE IF NOT EXISTS brief_file_chunks (
  file_id TEXT    NOT NULL,
  chunk   INTEGER NOT NULL,
  bytes   BLOB    NOT NULL,
  PRIMARY KEY (file_id, chunk)
);
CREATE INDEX IF NOT EXISTS idx_brief_file_chunks_file ON brief_file_chunks(file_id);
