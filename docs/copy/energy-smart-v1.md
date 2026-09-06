# Smart Solutions, v1 draft

Replaces `site-energy/energy-management.html`, which currently ships one
supplier's two devices and nothing else.

**Three pillars, in the owner's order.** Hot water with Plentify, smart
switching (Sunlogic's own work at the board), VoltIQ monitoring (Sunlogic's own
platform). Plus smart home, deliberately last.

**Facts checked against source, not memory.** VoltIQ's detections are read off
`api/services/analyzer.py` and `api/services/upsell.py` in the VoltIQ repo. The
four inverter brands are the four provider clients that exist:
`deye.py`, `sunsynk.py`, `luxpower.py`, `foxess.py`.

**Deliberately absent:** cancellation terms. The page, the contract and
Plentify's published terms currently give three different answers, so this draft
says nothing rather than adding a fourth.

---

## Hero

**Eyebrow:** Smart solutions

**H1:** Your Geyser Doesn't Know You're Out. | Neither Does Your Pool Pump.

**Body:** The big loads run to a clock, and a clock knows nothing about your
house. Hot water, switching and monitoring: two of those three are our own work
rather than a box we resell, and the order you do them in decides whether any of
it pays for itself.

**Primary button:** Book Your Free Site Visit
**Secondary:** See What We Watch For

**Sticky anchor bar under the hero**, the same `dl-subnav` solar.html carries.
Four sections, which is what solar has:
`Hot water=#hot-water | Switching=#switching | Monitoring=#monitoring | Smart home=#smart-home`

It earns its place for the same reason it does on solar: a reader who already
has solar and came for monitoring should not have to scroll two pillars to reach
it, and the page's own argument is that different houses should start in
different places.

---

## Section: the thesis

**Eyebrow:** Start here

**H2:** A Lot of Smart Home Is | Convenience Dressed as a Saving

**Body:**

Voice controlled lights are pleasant. They will not change your bill.

What changes your bill is the big things. Hot water. Heating and cooling. The
pool. Control those and you move your usage onto power you made instead of power
you bought, which is the only mechanism that actually works.

So there's an order to this, and it isn't the order things usually get sold in.

**Callout, icon `check-circle`, label "The order that pays":**

Hot water first, because that's where the money is. Then switching, because
that's the second lot of money and where the nuisance tripping stops. Then
monitoring, so you can see what changed. Then the rest, if you want it.

Do it backwards and you've bought an expensive light switch.

---

## Section: pillar one, hot water

**Eyebrow:** One, hot water

**H2:** Your Geyser Doesn't | Know You're Out

**Body:**

Your geyser is the biggest single user of electricity in most homes, and it gets
there by heating water on a timer whether anyone's going to use it or not. All
year. Regardless of the weather, or whether the house is empty.

For this we work with **Plentify**, a Cape Town company that builds controllers
for geysers and solar systems. We've been a partner since 2024 and we were one
of their first solar installer partners. We fit and support the hardware;
Plentify builds it.

**Callout, icon `shield-check`, label "Checked by somebody other than the people selling it":**

**CONFIRMED by the owner and now on the page.** Independent testing by a body at the University of
Cape Town; a trial with the City of Cape Town, Hessequa Municipality and a German development agency
across 500 homes; project of the year from an international energy fund in 2024; a municipal
programme now running in Durban. Stated exactly as recorded, nothing rounded or inferred.

### Card: HotBot
`photo: images/HotBot.webp`

Learns when your household actually uses hot water and heats to suit, instead of
running to a clock. It picks up a leak early, which is the difference between a
plumber and a new ceiling, and it handles power cuts and holidays on its own.

Works with electric geysers, and with solar geysers that circulate on their own.
It doesn't work with pumped solar or gas. A home with two geysers needs one for
each.

R849 once off, then R149 a month.

### Card: SolarBot
`photo: images/SolarBot_01.webp`

For a house that already has solar and a battery. It decides when to charge and
when to draw on the battery using the weather forecast and your own habits
rather than a timer, and it can heat your water off your panels instead of
buying electricity to do it.

Works with Sunsynk, Deye and Sungrow inverters on a standard household supply.

R849 once off, then R149 a month. Extra units are R99 a month.

> **[ OPEN: cancellation terms ]** Not stated on this page until the marketing
> copy, the legal page and Plentify's published terms agree. Right now a customer
> who reads all three gets three answers.

---

## Section: pillar two, smart switching

**Eyebrow:** Two, switching

**H2:** This Part Isn't a Product. | It's Wiring.

**Body:**

Switching is our own electrical work at your distribution board. There's nothing
to subscribe to and no app to open once it's set up.

### Card: Letting the sun decide

Instead of asking what time it is, the system asks whether there's spare power
right now, and starts the geyser, the pool pump or the car charger when there is.

Nothing gets sold back cheaply that could have been used at full value. It's the
single most effective thing you can do with a solar system after installing it,
and the one most people never get round to.

### Card: Standing things down

When the power fails and the house switches to battery, the last thing you want
is the geyser deciding to heat.

This drops the big loads automatically on the changeover and brings them back
afterwards, staggered so everything doesn't restart at once. Most inverters sold
in the last few years have a connection for exactly this, and it's usually left
unused because nobody wired anything to it. One of the cheapest improvements
available on a system you already own.

### Card: Giving the big things an order

Geyser, pool pump, oven, air conditioning and a car charger will cheerfully all
switch on at once and trip your main between them.

Sequencing them fixes it. The geyser waits for the oven. The pool runs while the
sun's up. The car charges overnight rather than into the evening. Real money, a
real drop in nuisance tripping, and you don't touch an app once it's done.

---

## Section: pillar three, VoltIQ

**Eyebrow:** Three, monitoring

**H2:** Solar Fails Quietly. | VoltIQ Doesn't.

**Body:**

VoltIQ is ours. We built it, we run it, and every system we monitor is on it.

It reads your inverter manufacturer's own cloud data every day and tells us what
changed. Every system, every morning, whether anyone thought to look or not.

**Then, if it found something on yours, you get a WhatsApp from us. And
depending on your subscription, a report every month.**

Not another app to check. Not a dashboard we hope you'll open, and not an alert
firehose that you'll mute inside a week. A message from the people who installed
it, when there is something worth telling you, and silence when there isn't.
Then, once a month, the fuller picture of what your system actually did.

> **[ OPEN: the subscription tiers ]** The draft says "depending on your
> subscription" because that is what is true and it is all I have been told.
> Vague is honest here, but it is not persuasive: a reader deciding between
> tiers cannot decide from this. What is needed is the tier names, what each one
> includes, and what each one costs. Until then this sentence is doing the least
> work of anything on the page, and it is sitting on the pillar that is entirely
> yours.

That matters because the failures that cost you money are the quiet ones. The
lights stay on. The inverter hums. The app still shows power coming in. You find
out on the bill, six weeks later.

> **Note on how this is written.** VoltIQ's morning report is built for the
> installer: that is what the code does and what the workflows deliver. The
> customer-facing half is Sunlogic messaging you off the back of it. Written as
> "you get a WhatsApp from us" rather than implying an automated alert, because
> a person having looked first is the honest version and also the better one.
> If it becomes automatic later, this line changes.

**Statement panel:**
Nobody rings to say their solar is producing eleven per cent less than last
month. | That's exactly why we watch it.

### What it looks for

**Card: The system stopped talking**
An inverter that goes offline for two hours. Or the harder one: a plant that
still reports itself online while its readings have quietly gone stale for four
hours. That second failure looks like health from the outside, which is why it
runs for weeks.

**Card: Something started drawing at night**
Your always-on overnight load, measured against your own last twenty eight
nights rather than any fixed number. It needs both a doubling and a rise of at
least 400 watts before it says anything, because a floor that's normal in one
house is alarming in another. It's how you find a pump, a heater or a failing
appliance that nobody noticed.

**Card: The battery ran flat, again**
Not once. Repeatedly, and cycling deeper each time. One flat battery is a bad
day. A pattern is a system that's undersized for how you actually live, and it
shortens the life of the battery you already paid for.

**Card: You're buying more than you were**
Grid import climbing above your own average, or creeping into the evenings.
Either way the system has stopped covering what it used to, and something
changed to make that happen.

**Card: A fault that keeps coming back**
Active fault codes, and the repeats. A fault that clears itself three times is
telling you something a fault that clears itself once is not.

**Body under the cards:**

VoltIQ reads Deye, Sunsynk, Luxpower and FoxESS.

If you're on one of those, we can watch your system whether we installed it or
not.

---

## Section: smart home

**Eyebrow:** And then the rest

**H2:** Worth Doing. Not | Where the Saving Is.

**Body:**

Once the big things are handled, the rest is worth doing for how it makes the
house work rather than for what it takes off the bill. We'd rather say that than
let you find out.

- Lighting and scenes, including outside lighting that follows the sun rather
  than a clock
- Plugs and appliances that can be switched or scheduled, and that tell you what
  they're drawing
- Gate, garage and access, so you're not hunting for a remote
- Sensors for leaks, doors, movement and temperature, mostly useful for what they
  tell you early
- Cameras and intercom, in one app rather than three

> **[ OPEN: what we work with ]** The brand and system list goes here. The copy
> doc leaves it open and it's the detail that decides who somebody phones.

---

## Section: AI

**Eyebrow:** Straight answer

**H2:** Some of What Gets Called AI | Is a Timer With Better Marketing

**Body:**

The word is on every solar website in the country and almost none of them say
what they mean by it. Here's where we'd draw the line.

**The real version is timing.** A system that knows tomorrow's forecast, what
your household normally does and what electricity costs at different times can
decide when to charge, when to heat water and when to run the pool, and it will
do it better than a clock. That's running in South African homes now.

**Working around cheaper and dearer hours is arithmetic.** It works and it's
worth having. It isn't learning anything.

**Fault alerts are a warning when a number leaves a range.** Also worth having.
Also not AI.

**Software that tells you a part is about to fail before it does** is genuinely
promising, and we haven't seen it proven on home solar here. We'd rather say so
than sell it to you.

Our position is simple: buy equipment that can be controlled and can be watched,
and let the software earn its keep on top of that.

---

## Grid services: a callout, not a section

Demoted from a full section deliberately. It explains something the reader
cannot buy, on a page already carrying three pillars, smart home and the AI
position. The honesty is worth keeping; a whole band of the page is not.

**Callout inside the AI section, icon `scale`, label "And the one you'll be sold next":**

You'll start hearing that your battery can earn money by helping the national
grid. That's genuinely being built. It also has no formal place in South African
electricity rules yet, and the regulator has said it isn't drafting any. So we
won't promise you an income from a battery, and be wary of anyone who does. What
we will say: buy equipment that can join in later rather than equipment that
can't. That choice is cheap now and expensive to undo.

---

## Close

**Eyebrow:** Where to start

**H2 (CTA):** We'll Tell You Which One | Is Worth Doing First

**Body:** For most houses it's hot water. For a house that already has solar and
keeps tripping its main, it isn't. An hour at your property settles which, and
whether any of it is worth doing on yours yet.

**Second ask, at the foot of the monitoring section.** A system already running
Deye, Sunsynk, Luxpower or FoxESS can go onto VoltIQ whether we installed it or
not. That is a smaller conversation than a site visit and deserves its own
button rather than being folded into the page's one close.

Suggested: **Put My System on VoltIQ** — and it should say plainly that we will
tell you what we find on somebody else's installation, which is the reason a
person with an orphaned system would press it.

**Button:** Book Your Free Site Visit

---

## Images

| Slot | Status |
|---|---|
| HotBot product | `site-energy/images/HotBot.webp` — have it, already on the page |
| SolarBot product | `site-energy/images/SolarBot_01.webp` — have it, already on the page |
| Plentify brand mark | **none on disk.** Needed for the partnership section |
| VoltIQ | **nothing exists anywhere.** The strongest single asset would be a screenshot of an actual morning report, which is a real artefact rather than a mockup |

Per the house rule, any slot without a real asset ships as a labelled empty
state, never stock photography.
