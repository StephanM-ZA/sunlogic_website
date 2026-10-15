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
  claimed_by      TEXT
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
  matched     INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_unmatched
  ON webhook_events(matched, received_at);
