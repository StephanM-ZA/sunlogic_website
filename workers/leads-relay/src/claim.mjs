/* The claim endpoint.
 *
 * GET  /claim/<token>   renders a page. Changes nothing.
 * POST /claim/<token>   accepts the offer.
 *
 * The split is the single most important thing in this file. Mail security
 * scanners, link previewers and some clients fetch every URL in an incoming
 * email before a human ever sees it. If GET accepted, whichever mailbox scans
 * hardest would silently claim every enquiry, and the audit log would record
 * a human accepting it — a failure that looks exactly like normal operation.
 *
 * The GET page auto-submits its own form, so a person still clicks once. A
 * fetcher that does not run JavaScript gets the <noscript> button and changes
 * nothing. A scanner that renders with a real headless browser would still
 * accept; that is a much smaller population, it is written down in the spec,
 * and it shows up in the log as an accept nobody remembers making.
 */

import { divisionLabel, formatSast } from './logic.mjs';

const CSS = `body{margin:0;background:#FFF7E9;color:#0D2028;
font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.c{max-width:520px;text-align:center}
h1{font-size:30px;line-height:1.15;margin:0 0 12px;font-weight:800}
p{margin:0 0 20px;color:#5A544B}
.e{font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;
text-transform:uppercase;color:#B85300;margin:0 0 16px}
button{font:600 16px/1 inherit;background:#F66F00;color:#fff;border:0;border-radius:4px;
padding:16px 28px;min-height:48px;cursor:pointer}
button:hover{background:#B85300}
.t{font:600 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#A09B93;margin-top:24px}`;

/* Counts down and then tries to close the tab.
   ------------------------------------------------------------------
   window.close() only works on a window that script opened. A tab opened
   by clicking a link in an email was opened by the browser, so most
   browsers refuse — Chrome, Firefox and Safari all block it. The attempt
   is harmless and costs nothing where it does work (some mail clients open
   these in a script-opened window, where it does).

   So the countdown never promises what it cannot deliver: it says the tab
   will close, and if the browser refuses, the same line becomes "you can
   close this tab" rather than counting to zero and sitting there looking
   broken. */
const AUTOCLOSE = `<p class="t" id="c">This tab will close in 5 seconds</p>
<script>
(function(){
  var n=5,el=document.getElementById('c');
  var t=setInterval(function(){
    n--;
    if(n>0){el.textContent='This tab will close in '+n+' second'+(n===1?'':'s');return;}
    clearInterval(t);
    el.textContent='Closing…';
    window.close();
    setTimeout(function(){ el.textContent='You can close this tab now'; },400);
  },1000);
})();
</script>`;

function page(inner) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"/>` +
    `<meta name="robots" content="noindex"/><title>Sunlogic — Enquiry</title>` +
    `<style>${CSS}</style></head><body><div class="c">${inner}</div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

/* Every non-claimable outcome says which one it is. "This did not work" with
   no reason turns a director into a support ticket. */
/* `claimed` distinguishes the two ways an offer stops being claimable, which
   look identical in the database and mean opposite things to the person
   holding the link. An offer that timed out really did move to the other
   director. An offer expired because someone accepted a sibling did not —
   telling that person "it went to the other director" is both wrong and
   confusing, since they ARE the other director. */
function outcome(state, claimedBy) {
  if (state === 'expired' && claimedBy) {
    return page(`<p class="e">Already taken</p><h1>Someone got there first</h1>
      <p>This enquiry has already been accepted. Nothing more to do.</p>` + AUTOCLOSE);
  }
  return outcomeByState(state);
}

function outcomeByState(state) {
  if (state === 'accepted') {
    return page(`<p class="e">Already taken</p><h1>Someone got there first</h1>
      <p>This enquiry has already been accepted. Nothing more to do.</p>` + AUTOCLOSE);
  }
  if (state === 'expired') {
    return page(`<p class="e">Expired</p><h1>This one has moved on</h1>
      <p>Twenty-four hours passed without it being accepted, so it went to the
      other director. You should have had an email saying so.</p>`);
  }
  if (state === 'pending_send') {
    return page(`<p class="e">Not ready</p><h1>Hold on a moment</h1>
      <p>This enquiry has not finished being sent out yet. Try the link in a
      minute.</p>`);
  }
  return page(`<p class="e">Not found</p><h1>That link is not valid</h1>
    <p>It may have been mistyped, or belong to an enquiry that no longer
    exists. Nothing has changed.</p>`);
}

async function loadOffer(env, token) {
  return env.DB.prepare(
    'SELECT o.id, o.lead_id, o.assignee, o.round, o.state, o.expires_at, ' +
    '       l.division, l.type, l.created_at, l.claimed_by ' +
    'FROM offers o JOIN leads l ON l.id = o.lead_id WHERE o.token = ?'
  ).bind(token).first();
}

/* Read-only. This function must never write. */
export async function handleClaimGet(env, token) {
  const offer = await loadOffer(env, token);
  if (!offer) return outcome(null, null);
  if (offer.state !== 'offered') return outcome(offer.state, offer.claimed_by);
  if (offer.expires_at && new Date(offer.expires_at.replace(' ', 'T') + 'Z') <= new Date()) {
    /* Past its expiry but the sweeper has not run yet — up to five minutes.
       Report it as expired rather than letting the POST fail confusingly. */
    return outcome('expired', offer.claimed_by);
  }

  const label = divisionLabel(offer.division);
  const when = formatSast(offer.created_at);
  return page(
    `<p class="e">${label} enquiry</p>` +
    `<h1>Accept this enquiry?</h1>` +
    `<p>Received ${when}. Accepting sends you the full details and assigns it to you.</p>` +
    `<form method="POST" id="f"><button type="submit">Accept this enquiry</button></form>` +
    `<script>document.getElementById('f').submit()</script>` +
    `<noscript><p>Press the button above to accept.</p></noscript>`
  );
}

/* The only thing that accepts.
 *
 * One conditional UPDATE does all the checking: unknown token, wrong state
 * and expired are the same "zero rows changed" answer, and two directors
 * clicking in the same instant produce exactly one winner. Reading first and
 * then writing would leave a gap between the two in which both could pass.
 */
export async function handleClaimPost(env, token, onAccepted) {
  const res = await env.DB.prepare(
    "UPDATE offers SET state='accepted', accepted_at=datetime('now') " +
    "WHERE token=? AND state='offered' " +
    "AND (expires_at IS NULL OR datetime('now') < expires_at)"
  ).bind(token).run();

  if (res.meta.changes !== 1) {
    const offer = await loadOffer(env, token);
    return outcome(offer ? offer.state : null, offer ? offer.claimed_by : null);
  }

  const offer = await loadOffer(env, token);
  await env.DB.prepare('UPDATE leads SET claimed_by=? WHERE id=?')
    .bind(offer.assignee, offer.lead_id).run();

  /* Any sibling offer for this lead is done with. Not deleted — the log has
     to be able to show that it existed and who it went to. */
  await env.DB.prepare(
    "UPDATE offers SET state='expired' WHERE lead_id=? AND id<>? AND state IN ('offered','pending_send')"
  ).bind(offer.lead_id, offer.id).run();

  if (onAccepted) await onAccepted(offer);

  const label = divisionLabel(offer.division);
  return page(
    `<p class="e">${label} enquiry</p><h1>Accepted</h1>
     <p>It is yours. The full details are on their way to your inbox now.</p>` + AUTOCLOSE
  );
}
