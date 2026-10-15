-- Whose send an event was about.
--
-- schema.sql carries the same shape. Additive: one column and one index on a
-- table only the delivery-confirmation feature writes.
--
-- NOT idempotent (ALTER TABLE ADD COLUMN has no IF NOT EXISTS in SQLite): a
-- second run fails with "duplicate column name: origin", which means
-- "already applied", not "broken".
--
-- WHY
-- ---
-- Resend's webhook endpoint is ACCOUNT-WIDE. It is not scoped to a domain or
-- a sender, so this Worker is POSTed the delivery events of every other
-- project sending on the same Resend account. One arrived and was recorded
-- as unmatched:
--
--   id          msg_3KjgzqfgjAFuXSOt5mxe5El2Axj
--   message_id  01a14016-e620-7873-a631-78425fbc318d
--   received_at 2026-10-15 15:04:17
--   detail      smarais.za@gmail.com
--
-- It was a sign-in code from CricketIQ, a different project on the same
-- account, sending from noreply@digitaloperations.co.za. The handler did the
-- right thing with it. The problem is what it did to the SIGNAL: `unmatched`
-- is meant to mean "a Sunlogic send went unrecorded", which is a real alarm,
-- and every unrelated email on the account was inflating it. The digest
-- would have reported that number daily until it meant nothing — which is
-- the exact failure this feature exists to prevent, one level up.
--
-- So attribution is stored per event, decided from the payload's `from` and
-- `env` tag rather than from whether a row happened to exist. That
-- distinction matters: an event of OURS can legitimately arrive before its
-- row does (migration 0006), and those must still be stored and replayed. If
-- "unmatched" ever came to mean "foreign", the race fixed in 0006 would be
-- quietly reintroduced.
--
--   ours       sent by this deployment            -> counts toward unmatched
--   other_env  sent by staging, or by production  -> excluded
--   foreign    another project on this account    -> excluded
--   unknown    no usable `from` on the payload    -> excluded, but visible
--
-- NULL means an event recorded before this column existed; those predate any
-- other project appearing on the account, so they are treated as ours.

ALTER TABLE webhook_events ADD COLUMN origin TEXT;

-- The digest asks "unmatched AND ours, recently", which needs all three.
CREATE INDEX IF NOT EXISTS idx_webhook_events_origin
  ON webhook_events(origin, matched, received_at);
