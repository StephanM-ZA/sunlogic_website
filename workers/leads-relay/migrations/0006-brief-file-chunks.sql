-- Files larger than D1's 2 MB value cap, stored in pieces.
--
-- WHY
-- ------------------------------------------------------------------
-- 0005 put brief photos in D1 and that works, because the page downscales an
-- image to about 300 KB before it is sent. Documents cannot be downscaled. A
-- scanned Certificate of Compliance is routinely 1 to 5 MB and a Word
-- document with photographs in it is larger still, so the moment PDFs and
-- office documents were allowed, D1's 2,000,000-byte limit on a single value
-- stopped being a theoretical ceiling and became the common case.
--
-- Object storage remains the right shape and remains unavailable: R2 needs a
-- card at checkout, which the owner declined. So the file is split instead.
--
-- THE SHAPE, AND WHY IT IS NOT SYMMETRICAL
-- ------------------------------------------------------------------
-- Chunk 0 stays in brief_photos.bytes, exactly where 0005 put it. Chunks 1..n
-- live here. That looks untidy next to a table that holds every chunk, and it
-- is deliberate:
--
--   * Every row already in brief_photos keeps working untouched. No backfill,
--     no rewrite of live data.
--   * A photo — still the overwhelmingly common case — is one chunk, so it is
--     served by the single indexed primary-key lookup it was before. The cost
--     of supporting big files is paid only by big files.
--
-- Additive only: nothing existing is read, rewritten or dropped. Safe to
-- apply while the database is serving.

CREATE TABLE IF NOT EXISTS brief_file_chunks (
  -- Matches brief_photos.id. Not declared as a foreign key: D1 does not
  -- enforce them by default, and a dangling chunk is harmless (the reader
  -- starts from brief_photos and asks for exactly the chunks it needs).
  file_id TEXT    NOT NULL,
  -- 1-based. Chunk 0 is brief_photos.bytes, never duplicated here.
  chunk   INTEGER NOT NULL,
  bytes   BLOB    NOT NULL,
  PRIMARY KEY (file_id, chunk)
);

-- The read is always "every chunk for this file, in order", which the primary
-- key already serves. This index exists for the retention sweep in the other
-- direction: delete a file's chunks when its brief_photos row goes.
CREATE INDEX IF NOT EXISTS idx_brief_file_chunks_file ON brief_file_chunks(file_id);
