# Runbook: Moving DNS to Cloudflare

**For:** sunlogic.co.za
**Written:** 3 September 2026

---

## Read this first

**What we are doing:** copying your DNS ("the phone book" that tells the internet where your website and email live) from Xneelo to Cloudflare.

**What we are NOT doing:**
- Not moving your email. Your mail server stays at Xneelo, untouched, in every step.
- Not deleting anything at Xneelo. Their copy stays exactly as it is, as your safety net.
- Not changing your website in Stage A. It stays on GitHub Pages.

**Why:** Cloudflare Pages has no fixed address that Xneelo's phone book can point at. So the phone book has to move to Cloudflare for the main site to live there.

**The single most important rule:** do not change your nameservers until Stage A step 6 says the check passed. Everything before that is reversible by doing nothing at all.

---

## Before you start: write these down

**Your current nameservers.** This is your undo button. If anything goes wrong, you put these four back:

```
ns1.host-h.net
ns2.host-h.net
ns1.dns-h.com
ns2.dns-h.com
```

**Your baseline check.** Do these two things now, so you know what "working" looks like:

1. Open https://sunlogic.co.za and confirm it loads
2. Send an email to sales@sunlogic.co.za from an outside address (Gmail, your phone) and confirm it arrives

If either of these is broken *before* you start, stop and fix that first.

---

# STAGE A: move the phone book, change nothing else

At the end of this stage your website and email work exactly as they do today. The only difference is which company answers DNS questions.

## Step 1 — Add the domain to Cloudflare

1. Log in at https://dash.cloudflare.com
2. Click **Add a domain**
3. Type `sunlogic.co.za`
4. Choose the **Free** plan
5. Cloudflare will scan your existing records and show you a list

**Then stop.** Do not click "Continue" past the nameserver instructions yet.

## Step 2 — Set EVERY record to "DNS only"

This is the step that protects your email.

In the record list you will see a cloud icon next to some records. Orange means Cloudflare intercepts the traffic. Grey means Cloudflare only answers the question and stays out of the way.

**Set every single record to grey (DNS only) for now.** Click any orange cloud to turn it grey.

> **Why this matters:** if the `mail` record is left orange, Cloudflare tries to proxy your mail server and **email will break.** Grey everywhere means Cloudflare behaves purely as a phone book, which is exactly what we want in this stage. We turn proxying on later, deliberately, and only for website records.

## Step 3 — Tell me it is ready

Message me that the zone is added. I will read every record back through Cloudflare's API and compare it against your Xneelo zone file, one record at a time.

I am checking for all 22 records, and especially:

- `MX` → mail.sunlogic.co.za
- `mail` → 41.203.16.80
- `smtp`, `relay`, `imap`, `pop` → mail
- `autoconfig` → mailconfig.konsoleh.co.za
- `_autodiscover._tcp` SRV record
- SPF, DMARC, and the `xneelo._domainkey` DKIM key
- `k2._domainkey` and `k3._domainkey` → Mailchimp

I will tell you **PASS** or **exactly which records are missing.**

## Step 4 — Add anything missing

If I report gaps, add those records by hand in Cloudflare. The exact values are in `docs/dns/sunlogic.co.za-zone-export.txt`. Remember to keep them grey.

## Step 5 — Lower the TTLs (recommended)

For each mail-related record, set **TTL to 5 minutes** (or "Auto" if 5 minutes is not offered).

TTL is how long the world remembers an answer. Two hours is the current setting, so a mistake would take two hours to undo. Five minutes makes any rollback almost immediate. You can put these back to normal a week later.

## Step 6 — I confirm PASS

Do not continue until I have confirmed the records match. **This is the gate.**

## Step 7 — Switch the nameservers

Cloudflare will have shown you two nameservers that look something like `xxx.ns.cloudflare.com`.

1. Log in to Xneelo (konsoleh)
2. Find the nameserver settings for `sunlogic.co.za`
3. Replace the four Xneelo nameservers with the two from Cloudflare
4. Save

**This is the moment the switch happens.** It usually takes effect within an hour, sometimes up to a day.

## Step 8 — Verify

Wait about 15 minutes, then:

1. Open https://sunlogic.co.za — it should load exactly as before
2. **Send a test email to sales@sunlogic.co.za from an outside address**
3. **Send an email FROM sales@sunlogic.co.za to an outside address**
4. Check your mail client still connects normally

Tell me when done and I will run a full technical verification of all 22 records against the live DNS.

---

# ROLLBACK: if anything goes wrong

**You can undo this at any point.** Xneelo's phone book is untouched and still complete.

## If you have not yet done Step 7

Nothing has changed. Cloudflare is holding a copy that nobody is using. Either leave it, or delete the domain from Cloudflare. Your site and email are unaffected because the world is still asking Xneelo.

## If you have done Step 7 and something is broken

1. Log in to Xneelo (konsoleh)
2. Go to the nameserver settings for `sunlogic.co.za`
3. Put these four back:
   ```
   ns1.host-h.net
   ns2.host-h.net
   ns1.dns-h.com
   ns2.dns-h.com
   ```
4. Save

That is the whole rollback. Xneelo's records were never deleted, so the moment the world starts asking Xneelo again, everything works as it did before.

**How long:** usually under an hour. If you lowered the TTLs in Step 5, faster.

**While you wait:** email is not lost. Sending servers retry for several days when they cannot deliver. A short outage means delayed mail, not missing mail.

## If only the website is broken but email is fine

Do not roll back the nameservers. That is a website record problem, which is smaller. Tell me and I will identify which record is wrong.

---

# STAGE B: point the website at Cloudflare

**Do not start this until Stage A has been working for at least a day.**

This stage changes two website records. **Mail records are not touched at all**, so even if the website breaks, email keeps working.

1. In Cloudflare DNS, delete the four `A` records on the bare domain pointing at `185.199.x.x` (GitHub)
2. Add `CNAME` on the bare domain → `sunlogic-main.pages.dev`
3. Change the `www` CNAME from `stephanm-za.github.io` → `sunlogic-main.pages.dev`
4. Add `CNAME` `energy` → `sunlogic-energy.pages.dev`
5. Add `CNAME` `electrical` → `sunlogic-electrical.pages.dev`

**Rollback for Stage B:** put the four GitHub A records back and point `www` at `stephanm-za.github.io`. Email is never involved.

---

## Quick reference

| | |
|---|---|
| Undo nameservers | `ns1.host-h.net` `ns2.host-h.net` `ns1.dns-h.com` `ns2.dns-h.com` |
| Zone file | `docs/dns/sunlogic.co.za-zone-export.txt` |
| Pre-move snapshot | `docs/dns/sunlogic.co.za-before-cloudflare.txt` |
| Mail server (never changes) | `mail.sunlogic.co.za` → `41.203.16.80` |
| Records to verify | 22 |
| The gate | Do not switch nameservers before Stage A step 6 passes |
