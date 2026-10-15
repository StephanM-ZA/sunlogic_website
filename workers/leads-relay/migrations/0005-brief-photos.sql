-- Brief photos, stored as bytes in D1.
--
-- WHY HERE AND NOT IN OBJECT STORAGE
-- ------------------------------------------------------------------
-- R2 is the right shape for this and was built first. It cannot be used:
-- enabling R2 on the account requires a card at checkout, which the owner
-- declined, and `wrangler r2 bucket create` fails with code 10042 until then.
-- Google Drive via a service account was built next and reverted, because it
-- needed a new Google Cloud project created from scratch.
--
-- D1 is already enabled, already bound, already deployed and already serving
-- this Worker's leads. It holds bytes perfectly well at this size. Using the
-- storage that is actually available beats a better-shaped store that is not.
--
-- THE LIMITS THIS LIVES INSIDE
-- ------------------------------------------------------------------
-- D1 caps a single BLOB at 2,000,000 bytes and the whole database at 500 MB
-- on the free plan. A raw 48MP phone photo is 8-12 MB and would be refused,
-- so the page downscales before uploading: a distribution board at 1600px is
-- around 300 KB, which is more than enough to read a breaker label off.
--
-- At ~300 KB a photo that is roughly 1,500 photos before the free plan's
-- database limit is in sight, and the leads tables are kilobytes by
-- comparison. If it ever does get close, the fix is a retention sweep of
-- photos older than a year, which is a cron this Worker already runs on a
-- schedule for other things.
--
-- Additive only: no existing table is read, rewritten or dropped. Safe to
-- apply to the live database while it is serving.

CREATE TABLE IF NOT EXISTS brief_photos (
  -- 32 hex characters from crypto.getRandomValues. Unguessable, and that is
  -- the access control: these are served without auth because Trello fetches
  -- them and a director opens them from an email, neither of which is a
  -- browser on our own origin. The same assumption /claim/<token> makes.
  id           TEXT PRIMARY KEY,
  -- The image itself.
  bytes        BLOB    NOT NULL,
  -- Served back verbatim in Content-Type. Validated against an allow-list on
  -- the way in, so this is never attacker-chosen text: see src/uploads.mjs,
  -- and note image/svg+xml is deliberately refused.
  content_type TEXT    NOT NULL,
  -- What the browser called it, kept for the record. Never used to build a
  -- path or a URL.
  file_name    TEXT,
  -- The brief's quote/invoice number when the page sends one. Not a foreign
  -- key: the photo is uploaded BEFORE the brief row exists, which is the
  -- whole reason uploads are a separate request. It is here so a photo can be
  -- traced back to its job, and so a retention sweep can be selective.
  reference    TEXT,
  size_bytes   INTEGER NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- For the retention sweep described above, and for answering "what did we
-- upload for job Q-1042" without a table scan.
CREATE INDEX IF NOT EXISTS idx_brief_photos_created   ON brief_photos(created_at);
CREATE INDEX IF NOT EXISTS idx_brief_photos_reference ON brief_photos(reference);
