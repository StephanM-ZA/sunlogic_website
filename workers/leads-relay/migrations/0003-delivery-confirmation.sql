-- Delivery confirmation.
--
-- schema.sql carries the same shape, so a database built from scratch matches
-- a migrated one. Additive only: two new tables, no existing row read,
-- rewritten or deleted.
--
-- Idempotent, unlike 0002 — this migration is only CREATE TABLE/INDEX
-- IF NOT EXISTS, so re-running it is a no-op rather than a loud failure.
-- There is no ALTER TABLE here to make it otherwise.
--
-- Why these tables exist: send() treated Resend's 2xx as delivery, and lead
-- 28 proved what that costs — accepted 2026-10-15 08:01:21 UTC, email handed
-- over, Resend said yes, nobody received it, and leads.last_error was NULL
-- because by our own test nothing had gone wrong. See src/webhook.mjs.

-- One row per message Resend accepted, keyed by RESEND's own id.
--
-- Keyed on the provider's id and not an autoincrement, because the webhook
-- arrives carrying that id and nothing else we chose. A surrogate key would
-- need an index on the provider id anyway, and then two ways to identify the
-- same message.
--
-- A lead with no row here was carried by the n8n fallback: there is no Resend
-- message, so no webhook will ever arrive for it. That absence is meaningful
-- when reading this table, not a gap.
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,           -- Resend's message id
  lead_id     INTEGER REFERENCES leads(id),
  offer_id    INTEGER REFERENCES offers(id),
  event       TEXT    NOT NULL,           -- offer | accepted | expired | unclaimed | digest | ...
  assignee    TEXT,                       -- NULL for anything not addressed to a director
  recipient   TEXT,

  -- 'sent' is what we know at send time and nothing more. Everything past it
  -- comes from Resend telling us, and only ever moves forward: a delivered
  -- arriving after a bounce must not erase the bounce. See nextStatus().
  status      TEXT    NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent','delivered','bounced','complained')),
  status_at   TEXT,
  detail      TEXT,                       -- Resend's own words about a failure

  -- Set by the one caller that wins the claim, so a bounce escalates exactly
  -- once even if the first attempt died between the status write and the
  -- email. Separate from the webhook_events guard, which only stops retries
  -- of requests that finished.
  alerted_at  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- The lookup is "what happened to this lead's mail", for the digest and for
-- a human answering the lead-28 question from the data.
CREATE INDEX IF NOT EXISTS idx_messages_lead   ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Svix message ids we have already processed. Resend retries, so the handler
-- has to be able to recognise a request it has finished.
--
-- Deliberately NOT the only idempotency guard. This one stops a replay of a
-- completed request; messages.alerted_at stops a second alert when the first
-- attempt failed halfway. Neither covers the other.
CREATE TABLE IF NOT EXISTS webhook_events (
  id          TEXT PRIMARY KEY,           -- svix-id
  type        TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
