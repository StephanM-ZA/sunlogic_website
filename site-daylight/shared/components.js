/* ============================================================
   SUNLOGIC COMPONENT LIBRARY  v1.0
   Every visual decision in this site is a component. If you are
   writing a colour, a font-size, a radius or a duration into a
   page, you are doing it wrong — find the component, or ask.

   Requires sunlogic.css and icons.js.
   Full API: SYSTEM.md
   ============================================================ */

const SL_ICON = (name, size) => {
  const svg = (window.dlIcons && window.dlIcons[name]) || '';
  return size ? svg.replace('<svg', '<svg width="' + size + '" height="' + size + '"') : svg;
};
const SL_ATTR = (el, name, fallback) => el.getAttribute(name) || fallback || '';

/* Headings mark their accent phrase with a pipe:
     heading="Solar and electrical from |one team"
   Everything after the pipe renders in orange. One per heading,
   always the last phrase. Literal <em> also works. */
const SL_ACCENT = (text) => {
  const i = text.indexOf('|');
  return i < 0 ? text : text.slice(0, i) + '<em>' + text.slice(i + 1) + '</em>';
};

/* Base class: renders once, never on re-parent. */
class SLElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.slReady) return;
    this.dataset.slReady = '1';
    this.render();
  }
  render() {}
}

/* --- Wordmark ------------------------------------------------
   No logo mark exists. This sets the name in display type and is
   the ONLY correct lockup until the client supplies artwork.
   Do not draw, trace or generate a mark. */
class DlWordmark extends SLElement {
  render() {
    const size = SL_ATTR(this, 'size', '20');
    const href = this.getAttribute('href');
    const inner = '<span class="sl-wordmark" style="font-size:' + size + 'px">Sunlogic</span>';
    this.innerHTML = href ? '<a href="' + href + '" style="color:inherit">' + inner + '</a>' : inner;
  }
}
customElements.define('dl-wordmark', DlWordmark);

/* --- Icon ---------------------------------------------------- */
class DlIcon extends SLElement {
  render() {
    const name = SL_ATTR(this, 'name');
    const size = SL_ATTR(this, 'size', '24');
    this.setAttribute('aria-hidden', 'true');
    this.style.display = 'inline-flex';
    if (this.hasAttribute('accent')) this.style.color = 'var(--color-orange)';
    this.innerHTML = SL_ICON(name, size);
  }
}
customElements.define('dl-icon', DlIcon);

/* --- Section -------------------------------------------------
   bg: page (beige) | alt (beige-1) | inverse (navy)
   Never place two sections of the same bg next to each other.
   Legacy "background"/"surface" are mapped, not honoured. */
class DlSection extends SLElement {
  render() {
    const map = { background: 'page', surface: 'alt', page: 'page', alt: 'alt', inverse: 'inverse' };
    const bg = map[SL_ATTR(this, 'bg', 'page')] || 'page';
    const mod = bg === 'page' ? '' : ' sl-section--' + bg;
    this.innerHTML = '<section class="sl-section' + mod + '"><div class="sl-container">' + this.innerHTML + '</div></section>';
  }
}
customElements.define('dl-section', DlSection);

/* --- Stack ---------------------------------------------------
   The canonical section opener: eyebrow → heading → body → slot.
   Children become the slot (buttons, links).
     <dl-stack eyebrow="Compliance"
               heading="Paperwork is part of |the job"
               body="…"> <dl-button …> </dl-stack>
   level="hero" for the display size. */
class DlStack extends SLElement {
  render() {
    const eyebrow = this.getAttribute('eyebrow');
    const heading = this.getAttribute('heading');
    const body = this.getAttribute('body');
    const level = SL_ATTR(this, 'level', 'section');
    const tag = level === 'hero' ? 'h1' : SL_ATTR(this, 'as', 'h2');
    const cls = level === 'hero' ? 'sl-hero-heading' : 'sl-section-heading';
    const slot = this.innerHTML.trim();
    this.innerHTML =
      '<div class="sl-stack">' +
      (eyebrow ? '<p class="sl-eyebrow">' + eyebrow + '</p>' : '') +
      (heading ? '<' + tag + ' class="' + cls + '">' + SL_ACCENT(heading) + '</' + tag + '>' : '') +
      (body ? '<p class="sl-body sl-body--lg sl-body--tight">' + body + '</p>' : '') +
      (slot ? '<div class="sl-stack__slot">' + slot + '</div>' : '') +
      '</div>';
  }
}
customElements.define('dl-stack', DlStack);

/* --- Eyebrow (standalone) ------------------------------------ */
class DlEyebrow extends SLElement {
  render() { this.innerHTML = '<p class="sl-eyebrow">' + this.innerHTML + '</p>'; }
}
customElements.define('dl-eyebrow', DlEyebrow);

/* --- Heading (standalone) ------------------------------------ */
class DlHeading extends SLElement {
  render() {
    const level = SL_ATTR(this, 'level', 'section');
    const map = { hero: ['h1', 'sl-hero-heading'], section: ['h2', 'sl-section-heading'], title: ['h3', 'sl-title'] };
    const [tag, cls] = map[level] || map.section;
    this.innerHTML = '<' + tag + ' class="' + cls + '">' + SL_ACCENT(this.innerHTML) + '</' + tag + '>';
  }
}
customElements.define('dl-heading', DlHeading);

/* --- Text ---------------------------------------------------- */
class DlText extends SLElement {
  render() {
    const lg = this.hasAttribute('lg') ? ' sl-body--lg' : '';
    const tight = this.hasAttribute('wide') ? '' : ' sl-body--tight';
    this.innerHTML = '<p class="sl-body' + lg + tight + '">' + this.innerHTML + '</p>';
  }
}
customElements.define('dl-text', DlText);

/* --- Grid ----------------------------------------------------
   cols="3" → 3 / 2 / 1 across the three breakpoints
   cols="2" → 2 / 2 / 1
   cols="split" → text beside media, 56px apart */
class DlGrid extends SLElement {
  render() {
    const cols = SL_ATTR(this, 'cols', '3');
    const cls = { '3': 'sl-grid-3', '2': 'sl-grid-2', 'split': 'sl-cols' }[cols] || 'sl-grid-3';
    this.innerHTML = '<div class="' + cls + '">' + this.innerHTML + '</div>';
  }
}
customElements.define('dl-grid', DlGrid);

/* --- Button --------------------------------------------------
   50px (sm: 38px) · 4px radius · Hanken 700/14 · press translateY(1px)
   variant: primary (navy) | emphasis (orange) | secondary | outline | ghost
   MAX ONE emphasis button in view. */
class DlButton extends SLElement {
  render() {
    const href = this.getAttribute('href');
    const icon = this.getAttribute('icon');
    const size = this.getAttribute('size') === 'sm' ? ' sl-btn--sm' : '';
    const full = this.hasAttribute('full') ? ' sl-btn--full' : '';
    const dark = this.hasAttribute('on-dark') ? ' sl-on-dark' : '';
    const known = ['primary', 'secondary', 'emphasis', 'outline', 'ghost'];
    let v = SL_ATTR(this, 'variant', 'primary');
    if (!known.includes(v)) v = 'primary';
    /* Legacy "ghost" on light meant "secondary next to a primary" and carried
       a border. The system's ghost is borderless and only legible over
       photography or navy, so map it to outline unless on-dark. */
    if (v === 'ghost' && !this.hasAttribute('on-dark')) v = 'outline';
    /* Optional wipe colour, for paired buttons that should each read as
       their own thing. Anything else is ignored. */
    const wipeAttr = this.getAttribute('wipe');
    const wipe = ['orange', 'navy'].includes(wipeAttr) ? ' sl-btn--wipe-' + wipeAttr : '';
    const tag = href ? 'a' : 'button';
    const attrs = href ? ' href="' + href + '"' : ' type="' + SL_ATTR(this, 'type', 'button') + '"';
    this.innerHTML =
      '<' + tag + attrs + ' class="sl-btn sl-btn--' + v + size + full + dark + wipe + '">' +
      '<span>' + this.innerHTML + '</span>' + (icon ? SL_ICON(icon, 18) : '') + '</' + tag + '>';
  }
}
customElements.define('dl-button', DlButton);

/* --- Button row ---------------------------------------------- */
class DlActions extends SLElement {
  render() { this.innerHTML = '<div class="sl-actions">' + this.innerHTML + '</div>'; }
}
customElements.define('dl-actions', DlActions);

/* --- Card — flat. No shadow, ever. ---------------------------
   tone: white | warm | sunk | inverse | glass
   Optional icon / heading / body attributes render the standard
   service-card composition; children render below. */
class DlCard extends SLElement {
  render() {
    const tone = SL_ATTR(this, 'tone', 'white');
    const mod = { white: '', warm: ' sl-card--warm', sunk: ' sl-card--sunk', inverse: ' sl-card--inverse', glass: ' sl-card--glass' }[tone] || '';
    const icon = this.getAttribute('icon');
    const heading = this.getAttribute('heading');
    const body = this.getAttribute('body');
    const head =
      (icon ? '<span class="sl-card__icon">' + SL_ICON(icon, 28) + '</span>' : '') +
      (heading ? '<h3 class="sl-title">' + heading + '</h3>' : '') +
      (body ? '<p class="sl-body">' + body + '</p>' : '');
    const inner = head ? '<div class="sl-card__stack">' + head + '</div>' + this.innerHTML : this.innerHTML;
    this.innerHTML = '<div class="sl-card' + mod + '">' + inner + '</div>';
  }
}
customElements.define('dl-card', DlCard);

/* --- StepCard ------------------------------------------------
   Numbered process step. The FINAL step in the sequence takes
   tone="inverse" — navy, one per sequence, so the process ends on a
   full stop instead of trailing off. Never an interior step, and
   never more than one, or it stops meaning "this is the end". */
class DlStep extends SLElement {
  render() {
    const tone = this.getAttribute('tone') === 'inverse' ? ' sl-card--inverse' : '';
    this.innerHTML =
      '<div class="sl-card sl-step' + tone + '">' +
      '<span class="sl-step__num">' + SL_ATTR(this, 'step') + '</span>' +
      '<h3 class="sl-title">' + SL_ATTR(this, 'heading') + '</h3>' +
      '<p class="sl-body">' + SL_ATTR(this, 'body') + '</p>' +
      '</div>';
  }
}
customElements.define('dl-step', DlStep);

/* --- Checklist ----------------------------------------------
   <dl-checklist items="One|Two|Three"></dl-checklist> */
class DlChecklist extends SLElement {
  render() {
    const items = SL_ATTR(this, 'items').split('|').filter(Boolean);
    this.innerHTML = '<ul class="sl-checklist">' + items.map((t) =>
      '<li class="sl-checklist__row"><span class="sl-checklist__tick">' +
      SL_ICON('check-circle', 20) + '</span><span>' + t + '</span></li>').join('') + '</ul>';
  }
}
customElements.define('dl-checklist', DlChecklist);

/* --- Badge — 24px, 2px radius, mono 12. Not a pill.
   A STATUS chip. For a section label use <dl-eyebrow>. */
class DlBadge extends SLElement {
  render() {
    const live = this.hasAttribute('live') ? ' sl-badge--live' : '';
    this.innerHTML = '<span class="sl-badge' + live + '">' + this.innerHTML + '</span>';
  }
}
customElements.define('dl-badge', DlBadge);

/* --- Tag — renders bracketed: [ label ] ---------------------- */
class DlTag extends SLElement {
  render() { this.innerHTML = '<span class="sl-tag">' + this.innerHTML + '</span>'; }
}
customElements.define('dl-tag', DlTag);

/* --- StatTile ------------------------------------------------
   The 40px/900 value slot is for numerals and SHORT values.
   For long word values use <dl-creds> instead. */
class DlStat extends SLElement {
  render() {
    const tone = SL_ATTR(this, 'tone', 'white');
    const mod = { white: '', glass: ' sl-stat--glass', inverse: ' sl-stat--inverse' }[tone] || '';
    const sub = this.getAttribute('sub');
    this.innerHTML =
      '<div class="sl-stat' + mod + '">' +
      '<div class="sl-stat__label">' + SL_ATTR(this, 'label') + '</div>' +
      '<div class="sl-stat__value">' + SL_ATTR(this, 'value') + '</div>' +
      (sub ? '<div class="sl-stat__sub">' + sub + '</div>' : '') + '</div>';
  }
}
customElements.define('dl-stat', DlStat);

/* --- Credentials row — the phone-width restatement of stats -- */
class DlCreds extends SLElement {
  render() {
    const pairs = SL_ATTR(this, 'items').split('|').filter(Boolean);
    this.innerHTML = '<div class="sl-creds">' + pairs.map((p) => {
      const [label, value] = p.split('=');
      return '<div class="sl-cred-row"><span class="sl-cred-row__label">' + label +
        '</span><span class="sl-cred-row__value">' + (value || '') + '</span></div>';
    }).join('') + '</div>';
  }
}
customElements.define('dl-creds', DlCreds);

/* --- Field --------------------------------------------------- */
class DlField extends SLElement {
  render() {
    const name = SL_ATTR(this, 'name');
    const id = 'sl-field-' + name;
    const hint = this.getAttribute('hint');
    const options = this.getAttribute('options');
    const req = this.hasAttribute('required') ? ' required' : '';
    const control = options
      ? '<select class="sl-select" id="' + id + '" name="' + name + '"' + req + '>' +
        '<option value="" disabled selected>' + SL_ATTR(this, 'placeholder', 'Select an option') + '</option>' +
        options.split('|').map((o) => '<option>' + o + '</option>').join('') + '</select>'
      : '<input class="sl-input" id="' + id + '" name="' + name + '" type="' + SL_ATTR(this, 'type', 'text') + '"' + req + ' />';
    this.innerHTML =
      '<div class="sl-field"><label class="sl-label" for="' + id + '">' + SL_ATTR(this, 'label') + '</label>' +
      control + (hint ? '<p class="sl-hint">' + hint + '</p>' : '') + '</div>';
  }
}
customElements.define('dl-field', DlField);

/* --- Callout -------------------------------------------------
   Flat warm card with an orange icon. The old left-border accent
   bar is retired — the system has no accent-bar pattern. */
class DlCallout extends SLElement {
  render() {
    const icon = this.getAttribute('icon');
    this.innerHTML =
      '<div class="sl-card sl-card--warm sl-callout">' +
      (icon ? '<span class="sl-card__icon">' + SL_ICON(icon, 24) + '</span>' : '') +
      '<div class="sl-body">' + this.innerHTML + '</div></div>';
  }
}
customElements.define('dl-callout', DlCallout);

/* --- Prose — a readable column of long-form copy -------------
   Wraps its children at a 640px measure with body rhythm. Use for
   editorial pages; paragraphs stay plain <p>. */
class DlProse extends SLElement {
  render() {
    const wide = this.hasAttribute('wide') ? ' sl-prose--wide' : '';
    this.innerHTML = '<div class="sl-prose' + wide + '">' + this.innerHTML + '</div>';
  }
}
customElements.define('dl-prose', DlProse);

/* --- List — orange dot, optional bold lead-in ----------------
   <dl-list><li><strong>Buy it outright:</strong> …</li></dl-list> */
class DlList extends SLElement {
  render() {
    const rows = [...this.querySelectorAll('li')].map((li) =>
      '<li class="sl-list__row"><span class="sl-list__dot"></span><span>' + li.innerHTML + '</span></li>').join('');
    this.innerHTML = '<ul class="sl-list">' + rows + '</ul>';
  }
}
customElements.define('dl-list', DlList);

/* --- Contact row — icon, mono label, value ------------------
   <dl-contact-row icon="phone" label="Office" value="(082) 655-5371"
     href="tel:+27826555371"></dl-contact-row> */
class DlContactRow extends SLElement {
  render() {
    const href = this.getAttribute('href');
    const inner =
      '<span class="sl-contact__icon">' + SL_ICON(SL_ATTR(this, 'icon', 'map-pin'), 22) + '</span>' +
      '<span class="sl-contact__body"><span class="sl-contact__label">' + SL_ATTR(this, 'label') + '</span>' +
      '<span class="sl-contact__value">' + SL_ATTR(this, 'value') + '</span></span>';
    this.innerHTML = href
      ? '<a class="sl-contact" href="' + href + '">' + inner + '</a>'
      : '<div class="sl-contact">' + inner + '</div>';
  }
}
customElements.define('dl-contact-row', DlContactRow);

/* --- Person card — avatar slot, name, role, bio -------------- */
class DlPerson extends SLElement {
  render() {
    this.innerHTML =
      '<div class="sl-card sl-person">' +
      '<div class="sl-person__avatar">' + SL_ATTR(this, 'initials', '—') + '</div>' +
      '<h3 class="sl-title">' + SL_ATTR(this, 'name') + '</h3>' +
      '<p class="sl-person__role">' + SL_ATTR(this, 'role') + '</p>' +
      '<p class="sl-body">' + SL_ATTR(this, 'bio') + '</p></div>';
  }
}
customElements.define('dl-person', DlPerson);

/* --- Statement — one large line breaking up long-form copy ---
   Use between prose sections on the long service pages, where a
   wall of paragraphs needs a beat. Navy by default, warm for a
   quieter one. One per two or three sections; more and it stops
   being a break. */
class DlStatement extends SLElement {
  render() {
    const warm = this.hasAttribute('warm') ? ' sl-statement--warm' : '';
    const text = SL_ATTR(this, 'text');
    const eyebrow = this.getAttribute('eyebrow');
    this.innerHTML =
      '<section class="sl-statement' + warm + '"><div class="sl-statement__grad"></div>' +
      '<div class="sl-statement__inner">' +
      (eyebrow ? '<p class="sl-eyebrow' + (warm ? '' : ' sl-eyebrow--inverse') + '">' + eyebrow + '</p>' : '') +
      '<p class="sl-statement__text">' + SL_ACCENT(text) + '</p>' +
      this.innerHTML + '</div></section>';
  }
}
customElements.define('dl-statement', DlStatement);

/* --- Section nav — sticky anchor row -------------------------
   <dl-subnav items="At home=#at-home|For business=#small-business"></dl-subnav>
   For pages that serve three audiences in one scroll. */
class DlSubnav extends SLElement {
  render() {
    const items = SL_ATTR(this, 'items').split('|').filter(Boolean).map((p) => {
      const [label, href] = p.split('=');
      return '<a class="sl-subnav__link" href="' + href + '">' + label + '</a>';
    }).join('');
    this.innerHTML = '<nav class="sl-subnav"><div class="sl-subnav__inner">' + items + '</div></nav>';

    const links = [...this.querySelectorAll('.sl-subnav__link')];
    const targets = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if (!targets.length) return;
    const mark = () => {
      let current = 0;
      targets.forEach((t, i) => { if (t.getBoundingClientRect().top <= 160) current = i; });
      links.forEach((a, i) => a.classList.toggle('is-current', i === current));
    };
    mark();
    window.addEventListener('scroll', mark, { passive: true });
  }
}
customElements.define('dl-subnav', DlSubnav);

/* --- FAQ — accordion ----------------------------------------
   <dl-faq items="Question?=Answer.|Question?=Answer."></dl-faq>
   Quieter than a grid of cards once there are more than three. */
class DlFaq extends SLElement {
  render() {
    const items = SL_ATTR(this, 'items').split('|').filter(Boolean).map((p) => {
      const i = p.indexOf('=');
      const q = p.slice(0, i);
      const a = p.slice(i + 1);
      return '<details class="sl-faq__item"><summary class="sl-faq__q">' + q +
        '<span class="sl-faq__sign" aria-hidden="true"></span></summary>' +
        '<div class="sl-faq__a"><p>' + a + '</p></div></details>';
    }).join('');
    this.innerHTML = '<div class="sl-faq">' + items + '</div>';
  }
}
customElements.define('dl-faq', DlFaq);

/* --- Figures — a row of numbers on a band -------------------- */
class DlFigures extends SLElement {
  render() {
    const items = SL_ATTR(this, 'items').split('|').filter(Boolean).map((p) => {
      const [value, label] = p.split('=');
      return '<div class="sl-figure"><span class="sl-figure__value">' + value +
        '</span><span class="sl-figure__label">' + (label || '') + '</span></div>';
    }).join('');
    this.innerHTML = '<div class="sl-figures">' + items + '</div>';
  }
}
customElements.define('dl-figures', DlFigures);

/* --- Dock — the persistent action pill ----------------------
   NOT a second nav. The header already handles navigation; a
   duplicate at the bottom earns nothing. This carries the two
   things someone wants within reach on a long page: the phone
   number and the quote. Compact, one line, always on top. */
class DlDock extends SLElement {
  render() {
    const phone = SL_ATTR(this, 'phone', '(082) 655-5371');
    const tel = SL_ATTR(this, 'phone-href', 'tel:+27826555371');
    const label = SL_ATTR(this, 'action', 'Get a quote');
    const href = SL_ATTR(this, 'href', 'contact.html');
    this.innerHTML =
      '<div class="sl-dock">' +
      '<a class="sl-dock__phone" href="' + tel + '">' + SL_ICON('phone', 16) + '<span>' + phone + '</span></a>' +
      '<a class="sl-dock__cta" href="' + href + '"><span>' + label + '</span>' + SL_ICON('arrow-right', 16) + '</a>' +
      '</div>';
  }
}
customElements.define('dl-dock', DlDock);

/* --- Placeholder — labelled empty state, never stock --------- */
class DlMediaBg extends SLElement {
  render() {
    const src = this.getAttribute('src');
    const alt = SL_ATTR(this, 'alt', '[Photography pending]');
    const inv = this.hasAttribute('inverse') ? ' sl-placeholder--inverse' : '';
    const ratio = this.getAttribute('ratio');
    if (ratio) this.style.aspectRatio = ratio;
    this.innerHTML = src
      ? '<img class="sl-media" src="' + src + '" alt="' + alt + '" />'
      : '<div class="sl-placeholder' + inv + ' sl-media">' + alt + '</div>';
  }
}
customElements.define('dl-media-bg', DlMediaBg);
customElements.define('dl-media', class extends DlMediaBg {});

/* --- Hero — five layers, all five required -------------------
   photo · 14s gradient drift · 9s light sweep · side scrim ·
   bottom scrim. The drift alone reads static in a single glance;
   the sweep is what makes motion legible over a photograph. The
   side scrim is what holds text contrast against a bright image.
   Do not remove any of them. */
class DlHero extends SLElement {
  render() {
    const photo = this.getAttribute('photo');
    const alt = SL_ATTR(this, 'alt', '[Hero photography pending]');
    const media = photo
      ? '<img class="sl-hero__image" src="' + photo + '" alt="' + alt + '" />'
      : '<div class="sl-placeholder sl-placeholder--inverse sl-hero__empty">' + alt + '</div>';
    this.innerHTML =
      '<section class="sl-hero">' + media +
      '<div class="sl-hero__layer sl-hero__gradient"></div>' +
      '<div class="sl-hero__layer sl-hero__sweep"></div>' +
      '<div class="sl-hero__layer sl-hero__scrim-side"></div>' +
      '<div class="sl-hero__layer sl-hero__scrim-bottom"></div>' +
      '<div class="sl-hero__inner">' + this.innerHTML + '</div></section>';
  }
}
customElements.define('dl-hero', DlHero);

/* --- CTA block — the closing call to action ------------------
   Navy, 16px radius, the dawn gradient drifting behind at 38%.
   The ONLY centred type in the system, and the only place a
   second emphasis button is allowed (because the first is in the
   hero, three screens up). One per page, always last before the
   footer. The motion is the point — do not remove it. */
class DlCta extends SLElement {
  render() {
    const heading = SL_ATTR(this, 'heading');
    const body = this.getAttribute('body');
    const label = SL_ATTR(this, 'action', 'Book a site assessment');
    const href = SL_ATTR(this, 'href', 'contact.html');
    const phone = this.getAttribute('phone');
    this.innerHTML =
      '<div class="sl-cta-wrap"><div class="sl-cta">' +
      '<span class="sl-wordmark" style="font-size:20px;margin-bottom:12px">Sunlogic</span>' +
      (this.getAttribute('eyebrow') ? '<p class="sl-eyebrow sl-eyebrow--centred">' + this.getAttribute('eyebrow') + '</p>' : '') +
      '<h2 class="sl-cta__heading">' + SL_ACCENT(heading) + '</h2>' +
      (body ? '<p class="sl-body sl-body--lg" style="color:rgba(255,255,255,.78);max-width:560px">' + body + '</p>' : '') +
      '<dl-button variant="emphasis" icon="arrow-right" href="' + href + '">' + label + '</dl-button>' +
      (phone ? '<a class="sl-cta__phone" href="' + SL_ATTR(this, 'phone-href', 'tel:' + phone) + '">' + phone + '</a>' : '') +
      '</div></div>';
  }
}
customElements.define('dl-cta', DlCta);

/* --- Terminal — the day's job feed ---------------------------
   Rows bottom-aligned, fading with distance from the newest
   (1 − distance × 0.12, floor 0.35). `stream` reveals one row
   every 900ms and renders complete under prefers-reduced-motion. */
class DlTerminal extends SLElement {
  render() {
    let lines = [];
    try { lines = JSON.parse(this.getAttribute('lines') || '[]'); } catch (e) { lines = []; }
    const tone = this.getAttribute('tone') === 'glass' ? ' sl-terminal--glass' : '';
    this.innerHTML =
      '<div class="sl-terminal' + tone + '">' +
      '<div class="sl-terminal__head"><span>' + SL_ATTR(this, 'title', 'Today') + '</span>' +
      '<span class="sl-badge sl-badge--live sl-badge--bare">Live</span></div>' +
      '<div class="sl-terminal__body" data-sl-rows></div></div>';

    const body = this.querySelector('[data-sl-rows]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = (n) => {
      body.innerHTML = lines.slice(0, n).map((l, i) =>
        '<div class="sl-terminal__row" style="opacity:' + Math.max(0.35, 1 - (n - 1 - i) * 0.12) + '">' +
        '<span class="sl-terminal__time">' + l.time + '</span><span>' + l.text + '</span></div>').join('');
    };
    if (!this.hasAttribute('stream') || reduced) return paint(lines.length);
    let n = 0;
    const tick = () => { paint(++n); if (n < lines.length) setTimeout(tick, 900); };
    tick();
  }
}
customElements.define('dl-terminal', DlTerminal);

/* --- NavBar — 72px, sticky, mono uppercase links -------------
   The system caps this at FOUR links plus the CTA. */
class DlNavBar extends SLElement {
  render() {
    const active = SL_ATTR(this, 'active', 'none');
    /* Electrical takes the navy accent; everything else takes orange. Same
       pairing as the Solar/Electrical buttons, so the two trades read
       consistently wherever they appear together. */
    const links = [
      { href: 'index.html', key: 'home', label: 'Home' },
      { href: 'solar.html', key: 'solar', label: 'Solar' },
      { href: 'electrical.html', key: 'electrical', label: 'Electrical', accent: 'navy' },
      { href: 'energy-management.html', key: 'energy', label: 'Energy' },
    ];
    const hasActive = links.some((l) => l.key === active);
    const navLinks = links.map((l) => '<a class="sl-nav__link' +
      (l.accent === 'navy' ? ' sl-nav__link--navy' : '') + '" href="' + l.href + '"' +
      (l.key === active ? ' aria-current="page"' : '') + '>' + l.label + '</a>').join('');
    const drawerLinks = links.map((l) => '<a class="sl-drawer__link' +
      (l.accent === 'navy' ? ' sl-drawer__link--navy' : '') + '" href="' + l.href + '">' +
      l.label + SL_ICON('arrow-right', 18) + '</a>').join('');

    this.innerHTML =
      '<header class="sl-nav' + (this.hasAttribute('dark') ? ' sl-nav--dark' : '') + '">' +
      '<a href="index.html" style="color:inherit"><span class="sl-wordmark">Sunlogic</span></a>' +
      '<nav class="sl-nav__links" data-has-active="' + hasActive + '">' + navLinks +
      '<dl-button variant="primary" size="sm" href="contact.html">Get a quote</dl-button></nav>' +
      '<button class="sl-icon-btn sl-nav__toggle" type="button" aria-label="Open menu" aria-expanded="false" data-sl-toggle>' +
      SL_ICON('bars-3', 24) + '</button></header>' +
      '<div class="sl-drawer" hidden data-sl-drawer>' +
      '<div class="sl-drawer__top"><span class="sl-wordmark">Sunlogic</span>' +
      '<button class="sl-icon-btn" type="button" aria-label="Close menu" data-sl-close>' + SL_ICON('x-mark', 24) + '</button></div>' +
      drawerLinks +
      '<div class="sl-drawer__cta"><dl-button variant="emphasis" full href="contact.html">Get a quote</dl-button></div></div>';

    const toggle = this.querySelector('[data-sl-toggle]');
    const drawer = this.querySelector('[data-sl-drawer]');
    const open = () => { drawer.hidden = false; toggle.setAttribute('aria-expanded', 'true'); drawer.querySelector('a').focus(); };
    const close = () => { drawer.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); };
    toggle.addEventListener('click', open);
    this.querySelector('[data-sl-close]').addEventListener('click', close);
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });
  }
}
customElements.define('dl-nav-bar', DlNavBar);

/* --- Footer -------------------------------------------------- */
class DlFooter extends SLElement {
  render() {
    const col = (links) => '<div class="sl-footer__col">' + links.map((l) =>
      '<a class="sl-footer__link" href="' + l[1] + '">' + l[0] + '</a>').join('') + '</div>';
    this.innerHTML =
      '<footer class="sl-footer"><div class="sl-footer__groups">' +
      '<div class="sl-footer__brand"><span class="sl-wordmark">Sunlogic</span>' +
      '<p class="sl-footer__strapline">Solar and electrical, Western Cape</p>' +
      '<p class="sl-footer__strapline">Sunlogic SA (Pty) Ltd · Reg. 2022/651654/07</p></div>' +
      col([['Solar', 'solar.html'], ['Electrical', 'electrical.html'], ['Energy', 'energy-management.html'], ['Worth knowing', 'blog.html']]) +
      col([['Contact', 'contact.html'], ['Legal', 'legal.html']]) +
      '<div class="sl-footer__col"><p class="sl-eyebrow sl-eyebrow--accent">Get in touch</p>' +
      '<a class="sl-footer__plain" href="tel:+27826555371">(082) 655-5371</a>' +
      '<a class="sl-footer__plain" href="mailto:sales@sunlogic.co.za">sales@sunlogic.co.za</a>' +
      '<p class="sl-footer__strapline">9 Chesham Road, Claremont, Cape Town</p>' +
      '<p class="sl-footer__strapline">[Business hours — placeholder pending]</p></div>' +
      '</div><div class="sl-footer__rule">' +
      '<p class="sl-footer__strapline">Registered electrical contractor · Certificate of Compliance on every installation</p></div></footer>';
  }
}
customElements.define('dl-footer', DlFooter);

/* --- Reveal — fade + 16px rise, 700ms expo-out ---------------
   Arms only what loads below the fold, so a failure leaves content
   visible rather than blank. No guard attribute: these do not wrap
   their content, and a serialising guard would survive an innerHTML
   round-trip and block re-observation after a component re-parents. */
const SL_REVEAL_OBSERVER = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
}, { threshold: 0.15 });

function slArm(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  requestAnimationFrame(() => {
    if (el.classList.contains('is-visible')) return;
    if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add('is-armed');
    SL_REVEAL_OBSERVER.observe(el);
  });
}
/* Failsafe: nothing stays hidden for more than three seconds, whatever
   happens to the observer. */
setTimeout(() => {
  document.querySelectorAll('.is-armed:not(.is-visible)').forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 2) el.classList.add('is-visible');
  });
}, 3000);

class DlReveal extends HTMLElement {
  connectedCallback() { slArm(this); }
}
customElements.define('dl-reveal', DlReveal);
class DlRevealLines extends HTMLElement {
  connectedCallback() { slArm(this); }
}
customElements.define('dl-reveal-lines', DlRevealLines);
