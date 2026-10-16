-- Record whether a submission came from us.
--
-- schema.sql carries the same shape. Additive, and the backfill only sets a
-- new column on rows that already exist.
--
-- NOT idempotent (ALTER TABLE ADD COLUMN has no IF NOT EXISTS in SQLite): a
-- second run fails with "duplicate column name: internal", which means
-- "already applied". The UPDATE below is safely repeatable on its own.
--
-- WHY
-- ---
-- The digest's first ever appearance read:
--
--     4 arrived · 1 accepted
--
-- Both numbers were right and the sentence was misleading. All four arrivals
-- were internal test submissions, which are deliberately never offered to a
-- director and so can never be accepted; the one acceptance was lead 28,
-- which arrived two days earlier and was not among them. Side by side the
-- two read as a funnel — four came in, one was taken, three are hanging —
-- and the owner read them exactly that way, which is the only test of
-- phrasing that counts.
--
-- Nothing was outstanding. So `arrived_24h` now counts real enquiries only.
--
-- Stored as a COLUMN rather than filtered with a LIKE in the digest's query,
-- because the rule for "internal" lives in logic.mjs's isInternalSubmission
-- and a second copy of a domain pattern in SQL is precisely the thing that
-- drifts. handleLeadRoute already decides this once, at submission, in the
-- branch that suppresses the director mail; it now records what it decided.
-- The only place the pattern is repeated is the one-off backfill below.
--
-- The two patterns mirror the regex /@(?:[a-z0-9-]+\.)*sunlogic\.co\.za$/:
-- '%@sunlogic.co.za' catches the bare domain, '%.sunlogic.co.za' catches any
-- subdomain, and neither matches a lookalike like @evilsunlogic.co.za.

ALTER TABLE leads ADD COLUMN internal INTEGER NOT NULL DEFAULT 0;

UPDATE leads SET internal = 1
 WHERE lower(json_extract(payload_json, '$.email')) LIKE '%@sunlogic.co.za'
    OR lower(json_extract(payload_json, '$.email')) LIKE '%.sunlogic.co.za';
