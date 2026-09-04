-- Claim and rotation.
--
-- Applied to the live sunlogic-leads database; schema.sql carries the same
-- shape so a database built from scratch matches a migrated one. Additive
-- only: no existing row is read, rewritten or deleted.
--
-- Verified against a copy of production before going near production: the
-- live database was exported, restored into a scratch sqlite file, and this
-- was applied to it. 11 leads before, 11 after, all statuses unchanged, all
-- payload_json still valid JSON, both new columns present. The four
-- constraints below were each confirmed to reject a bad row.
--
-- NOT idempotent, deliberately. The CREATE TABLE statements are guarded by
-- IF NOT EXISTS, but ALTER TABLE ADD COLUMN has no such guard in SQLite, so
-- a second run fails with:
--
--     duplicate column name: division
--
-- That error means "already applied", not "broken". It is left to fail
-- loudly rather than being made silently repeatable — a migration that
-- shrugs when re-run is a migration nobody can tell the state of.

ALTER TABLE leads ADD COLUMN division   TEXT;
ALTER TABLE leads ADD COLUMN claimed_by TEXT;

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
