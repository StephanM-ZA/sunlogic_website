-- Let an event that arrived too early be replayed.
--
-- schema.sql carries the same shape. Additive: one column and one index on a
-- table only the delivery-confirmation feature writes.
--
-- NOT idempotent (ALTER TABLE ADD COLUMN has no IF NOT EXISTS in SQLite): a
-- second run fails with "duplicate column name: detail", which means
-- "already applied", not "broken".
--
-- WHY
-- ---
-- Resend's webhook can arrive BEFORE the Worker has finished recording the
-- send it is about. Measured in production, not theorised:
--
--   lead 32, visitor_report
--     message row written   2026-10-15 13:49:22
--     email.bounced arrived 2026-10-15 13:49:20   <- two seconds EARLIER
--
-- The event verified correctly and then matched nothing, because the row it
-- needed did not exist yet. It was filed as unmatched and escalated to
-- nobody. On a DIRECTOR notification that is lead 28's failure all over
-- again: a bounced offer, a director who was never told, and a 24-hour clock
-- running on silence.
--
-- Every unit test had seeded the message row first, so all of them agreed
-- with an ordering that reality does not guarantee. The send happens on
-- Cloudflare and the bounce comes back through Resend; nothing sequences
-- them.
--
-- The fix is to replay: when a send is recorded, any unmatched event already
-- waiting for that id is applied. Replaying needs Resend's own words about
-- the failure, and those were being thrown away with the event — hence this
-- column. "bounced" is a status; "550 mailbox unavailable" is a diagnosis.
--
-- Deliberately NOT solved by returning a non-2xx so Resend retries. That
-- would make correctness depend on an external retry schedule, and on this
-- path a lost bounce is a lost lead.

ALTER TABLE webhook_events ADD COLUMN detail TEXT;

-- Replay looks events up by the message they are about, which nothing
-- indexed before: idx_webhook_events_unmatched leads with `matched`.
CREATE INDEX IF NOT EXISTS idx_webhook_events_message
  ON webhook_events(message_id, matched);
