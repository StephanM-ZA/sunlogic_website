-- Which webhook events matched a message we sent.
--
-- schema.sql carries the same shape. Additive: two columns on a table that
-- only this feature writes.
--
-- NOT idempotent, like 0002 and unlike 0003: ALTER TABLE ADD COLUMN has no
-- IF NOT EXISTS in SQLite, so a second run fails with
--
--     duplicate column name: message_id
--
-- which means "already applied", not "broken". Left to fail loudly rather
-- than made silently repeatable.
--
-- Why: an event whose email_id matched no `messages` row used to be accepted
-- and dropped on the floor. That was defensible while most sends went
-- unrecorded, and it stopped being defensible the moment they were all
-- recorded — a real email.delivered arrived on 2026-10-15 13:13:27 for a
-- send that kept no id, and the only trace was an orphan row here.
--
-- With every send recorded, an unmatched event now means something is
-- sending mail outside the paths this Worker knows about, or that a message
-- id was dropped on the way out. Both are worth knowing, and neither is
-- visible if the event is discarded. So the fact is stored and the digest
-- reports it.

ALTER TABLE webhook_events ADD COLUMN message_id TEXT;

-- 0 = the event named a message we have no record of. Deliberately not a
-- nullable flag: every row is one or the other, and "unknown" would just be
-- a third state nobody could act on.
ALTER TABLE webhook_events ADD COLUMN matched INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_webhook_events_unmatched
  ON webhook_events(matched, received_at);
