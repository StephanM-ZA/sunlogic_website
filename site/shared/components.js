// `display: contents` on these host tags strips their own margin, padding,
// border, and background — the host element renders no box at all, only its
// children do. This means any *container* that relies on child-margin
// utilities (space-y-*, space-x-*, divide-y, etc.) around one of these tags
// will NOT get the spacing it expects, because there's no margin-bearing box
// for those utilities to act on. Use gap-based layout instead (flex/grid with
// gap-*), which applies to whatever renders as the actual flex/grid item
// (the component's own inner element) regardless of the `display: contents`
// indirection. See the hero assessment form in index.html for the pattern.
const slBaseStyle = document.createElement('style');
slBaseStyle.textContent = `
  sl-button, sl-section-header, sl-card, sl-field, sl-nav-bar, sl-footer, sl-panel, sl-step, sl-section, sl-audience-row, sl-faq-item {
    display: contents;
  }
  /* Shared hover-lift treatment: one reusable primitive instead of a class
     list copied into every component's template. Applied to every
     sl-button, sl-card, sl-panel, and sl-nav-bar link. */
  .sl-lift {
    transition: all 0.5s;
  }
  .sl-lift:hover {
    transform: translateY(-0.25rem);
  }
`;
document.head.appendChild(slBaseStyle);

class SlButton extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const icon = this.getAttribute('icon');
    const href = this.getAttribute('href');
    const type = this.getAttribute('type') || 'button';
    const fullWidth = this.hasAttribute('full-width');
    const hiddenMobile = this.hasAttribute('hidden-mobile');
    const shadow = this.getAttribute('shadow') || 'none';
    const label = this.textContent.trim();

    const VARIANT = {
      primary: 'bg-secondary-container text-on-primary hover:bg-[#e67300]',
      secondary: 'border-2 border-surface/30 text-surface hover:border-surface hover:bg-surface/10',
      dark: 'bg-primary-container text-on-primary hover:bg-[#1a4050]',
    };
    const SIZE = {
      compact: 'px-7 py-2.5 font-body-md',
      md: 'px-8 py-3.5 font-body-md',
      lg: 'px-8 py-4 font-body-md',
      form: 'px-6 py-4 font-body-lg',
    };
    const SHADOW = {
      none: '',
      'hover-lg': 'hover:shadow-lg',
      'static-lg': 'shadow-lg',
      'hover-md-lg': 'shadow-md hover:shadow-lg',
    };

    const classes = [
      'font-bold', 'rounded-[0.75rem]', 'sl-lift',
      VARIANT[variant], SIZE[size], SHADOW[shadow],
      fullWidth ? 'w-full' : '',
      hiddenMobile ? 'hidden md:block' : '',
      icon ? 'inline-flex items-center gap-2' : '',
    ].filter(Boolean).join(' ');

    const iconHtml = icon ? slIcon(icon, 'w-5 h-5') : '';
    const inner = `${label}${iconHtml}`;

    this.innerHTML = href
      ? `<a class="${classes}" href="${href}">${inner}</a>`
      : `<button class="${classes}" type="${type}">${inner}</button>`;
  }
}
customElements.define('sl-button', SlButton);

class SlSectionHeader extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const eyebrow = this.getAttribute('eyebrow') || '';
    const heading = this.getAttribute('heading') || '';
    const subtext = this.getAttribute('subtext');
    const onDark = this.hasAttribute('on-dark');
    const gap = this.getAttribute('gap') || 'md';
    const wide = this.hasAttribute('wide');

    const gapClass = gap === 'lg' ? 'mb-20' : 'mb-16';
    const headingColor = onDark ? 'text-on-primary' : 'text-primary-container';
    const maxWidthClass = wide ? 'max-w-6xl' : 'max-w-3xl';

    this.innerHTML = `
      <div class="text-center ${maxWidthClass} mx-auto ${gapClass}">
        <span class="inline-block px-4 py-1.5 bg-secondary-container/10 border border-secondary-container/20 rounded-[0.75rem] font-label-md text-label-md text-secondary-container uppercase tracking-widest mb-6">${eyebrow}</span>
        <h2 class="font-headline-lg text-headline-lg max-md:font-headline-lg-mobile max-md:text-headline-lg-mobile ${headingColor}">${heading}</h2>
        ${subtext ? `<p class="font-body-lg text-body-lg text-on-surface-variant mt-6 text-xl">${subtext}</p>` : ''}
      </div>
    `;
  }
}
customElements.define('sl-section-header', SlSectionHeader);

class SlCard extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const variant = this.getAttribute('variant') || 'service';
    const icon = this.getAttribute('icon') || '';
    const heading = this.getAttribute('heading') || '';
    const body = this.getAttribute('body') || '';
    const items = [...this.querySelectorAll(':scope > li')].map(li => li.textContent.trim());

    if (variant === 'service') {
      const listHtml = items.map(item => `
        <li class="flex items-start gap-3">
          ${slIcon('check-circle', 'w-5 h-5 shrink-0 text-secondary-container')}
          <span class="font-body-md text-body-md text-primary-container font-medium">${item}</span>
        </li>
      `).join('');
      this.innerHTML = `
        <div class="bg-surface-container-lowest p-10 rounded-2xl shadow-card hover:shadow-ambient sl-lift group border-t-4 border-transparent hover:border-secondary-container">
          <div class="w-14 h-14 rounded-xl bg-solar-sky flex items-center justify-center mb-8 group-hover:bg-secondary-container group-hover:scale-110 transition-all duration-300 shadow-sm">
            ${slIcon(icon, 'w-8 h-8 text-primary-container group-hover:text-on-primary transition-colors')}
          </div>
          <h4 class="font-headline-sm text-headline-sm text-primary-container mb-4 group-hover:text-secondary-container transition-colors">${heading}</h4>
          <p class="font-body-md text-body-md text-on-surface-variant ${items.length ? 'mb-8' : ''} leading-relaxed">${body}</p>
          ${items.length ? `<ul class="space-y-4 pt-4 border-t border-surface-variant/50">${listHtml}</ul>` : ''}
        </div>
      `;
    } else {
      this.innerHTML = `
        <div class="bg-surface-container-lowest p-8 rounded-2xl shadow-card hover:shadow-ambient sl-lift border border-surface-variant/50">
          <div class="w-14 h-14 rounded-[0.5rem] bg-secondary-container/20 flex items-center justify-center mb-6 shadow-sm border border-secondary-container/30">
            ${slIcon(icon, 'w-8 h-8 text-secondary-container')}
          </div>
          <h4 class="font-headline-sm text-headline-sm text-primary-container mb-3">${heading}</h4>
          <p class="font-body-md text-body-md text-on-surface-variant">${body}</p>
        </div>
      `;
    }
  }
}
customElements.define('sl-card', SlCard);

class SlField extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const fieldId = this.getAttribute('field-id') || '';
    const required = this.hasAttribute('required') ? 'required' : '';
    const inputClasses = 'w-full bg-surface border-2 border-surface-variant rounded-[0.5rem] px-4 py-2.5 text-on-surface focus:border-b-4 focus:border-b-secondary-container focus:ring-0 transition-colors';
    const labelClasses = 'block font-label-md text-label-md text-primary-container mb-1.5';
    // Generic error slot every sl-forms.js-managed field carries — hidden
    // until JS-side validation populates and reveals it. Kept structurally
    // identical for inputs and selects so form-handling code never has to
    // special-case field type when reading/writing error state.
    const errorEl = `<p class="hidden text-xs text-error mt-1.5" data-field-error></p>`;

    if (type === 'select') {
      const options = [...this.querySelectorAll(':scope > option')].map(o => o.outerHTML).join('');
      this.innerHTML = `
        <div class="sl-field-wrap">
          <label class="${labelClasses}" for="${fieldId}">${label}</label>
          <select class="${inputClasses}" id="${fieldId}" name="${fieldId}" ${required}>${options}</select>
          ${errorEl}
        </div>
      `;
    } else if (type === 'textarea') {
      const rows = this.getAttribute('rows') || '4';
      this.innerHTML = `
        <div class="sl-field-wrap">
          <label class="${labelClasses}" for="${fieldId}">${label}</label>
          <textarea class="${inputClasses} resize-none" id="${fieldId}" name="${fieldId}" placeholder="${placeholder}" rows="${rows}" ${required}></textarea>
          ${errorEl}
        </div>
      `;
    } else {
      this.innerHTML = `
        <div class="sl-field-wrap">
          <label class="${labelClasses}" for="${fieldId}">${label}</label>
          <input class="${inputClasses}" id="${fieldId}" name="${fieldId}" placeholder="${placeholder}" type="${type}" ${required}/>
          ${errorEl}
        </div>
      `;
    }
  }
}
customElements.define('sl-field', SlField);

// Glass panel with an orange top accent bar and hover lift — used for the
// hero assessment form. Wraps arbitrary content (not attribute-driven like
// the other components), so it relocates its existing child *nodes* into the
// new wrapper rather than rewriting innerHTML as a string — nested components
// (e.g. sl-field's <select>) may have already rendered by the time this runs,
// and re-parsing their already-expanded markup would drop their options.
class SlPanel extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const originalChildren = [...this.childNodes];
    this.innerHTML = `
      <div class="bg-surface/95 dark:bg-surface-dim/95 backdrop-blur-2xl p-10 rounded-2xl shadow-ambient border-t-4 border-t-secondary-container relative overflow-hidden group sl-lift">
        <div class="absolute top-0 right-0 w-40 h-40 bg-secondary-container/10 rounded-[0.75rem] blur-3xl -mr-20 -mt-20"></div>
        <div class="relative z-10 sl-panel-slot"></div>
      </div>
    `;
    const slot = this.querySelector('.sl-panel-slot');
    originalChildren.forEach(node => slot.appendChild(node));
  }
}
customElements.define('sl-panel', SlPanel);

// Process-step block (icon box + heading + body) — used on the dark "Our
// Process" section only, so its colors are hardcoded for that context rather
// than exposed as an on-dark toggle no other usage needs yet.
class SlStep extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const icon = this.getAttribute('icon') || '';
    const heading = this.getAttribute('heading') || '';
    const body = this.getAttribute('body') || '';
    this.innerHTML = `
      <div class="relative z-10 text-center">
        <div class="w-16 h-16 mx-auto bg-surface border-4 border-primary-container rounded-[0.75rem] flex items-center justify-center text-secondary-container shadow-sm mb-6">
          ${slIcon(icon, 'w-6 h-6')}
        </div>
        <h3 class="font-headline-sm text-headline-sm mb-3 text-on-primary">${heading}</h3>
        <p class="font-body-md text-body-md text-inverse-primary/80">${body}</p>
      </div>
    `;
  }
}
customElements.define('sl-step', SlStep);

// Homepage audience row (photo + dark panel, alternating sides) — introduces
// people to Residential / Small Business / Commercial and routes each into
// the Solar/Electrical sections of the two service pages. `flip` swaps which
// side the photo is on for desktop only; on mobile the photo always sits on
// top regardless, for a consistent stacked reading order.
class SlAudienceRow extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const eyebrow = this.getAttribute('eyebrow') || '';
    const heading = this.getAttribute('heading') || '';
    const body = this.getAttribute('body') || '';
    const image = this.getAttribute('image') || '';
    const flip = this.hasAttribute('flip');
    const solarHref = this.getAttribute('solar-href') || '#';
    const electricalHref = this.getAttribute('electrical-href') || '#';

    const photoOrder = flip ? 'order-1 md:order-2' : '';
    const textOrder = flip ? 'order-2 md:order-1' : '';

    const photoHtml = `<div class="bg-cover bg-center h-64 md:h-auto ${photoOrder}" style="background-image: url('${image}')"></div>`;
    const textHtml = `
      <div class="bg-primary-container p-10 flex flex-col justify-center ${textOrder}">
        <span class="inline-block px-3 py-1 bg-secondary-container rounded-[0.75rem] font-label-md text-label-md text-on-secondary uppercase tracking-widest mb-4 w-fit">${eyebrow}</span>
        <h3 class="font-headline-sm text-headline-sm text-on-primary mb-2">${heading}</h3>
        <p class="font-body-md text-body-md text-inverse-primary/85 mb-6">${body}</p>
        <div class="flex gap-3">
          <sl-button variant="primary" size="compact" href="${solarHref}">Solar</sl-button>
          <sl-button variant="secondary" size="compact" href="${electricalHref}">Electrical</sl-button>
        </div>
      </div>
    `;

    this.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden sl-lift">
        ${flip ? textHtml + photoHtml : photoHtml + textHtml}
      </div>
    `;
  }
}
customElements.define('sl-audience-row', SlAudienceRow);

// FAQ accordion entry. Uses native <details>/<summary> rather than
// hand-rolled JS toggle state — free keyboard/accessibility support, and
// Tailwind's `group-open:` variant handles the chevron rotation with no
// event listener needed. `question` is an attribute; the answer is whatever
// content was originally inside the tag (captured before innerHTML is
// overwritten, same node-safety concern as sl-panel above).
class SlFaqItem extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const question = this.getAttribute('question') || '';
    const answer = this.innerHTML;
    this.innerHTML = `
      <details class="group border-b border-surface-variant/50 py-5">
        <summary class="flex items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-headline-sm text-headline-sm text-primary-container">
          <span>${question}</span>
          ${slIcon('chevron-down', 'w-5 h-5 shrink-0 text-secondary-container transition-transform duration-300 group-open:rotate-180')}
        </summary>
        <div class="pt-4 font-body-md text-body-md text-on-surface-variant leading-relaxed">${answer}</div>
      </details>
    `;
  }
}
customElements.define('sl-faq-item', SlFaqItem);

// Standard page-section wrapper: enforces the same vertical/horizontal rhythm
// everywhere (section-gap-mobile/desktop, margin-mobile/gutter) instead of
// each section repeating and risking drift. `bg` takes a color token name
// (e.g. "surface-container"); the host's own `id`/`class` attributes pass
// through onto the generated <section> since a display:contents host has no
// box of its own to scroll to or style.
class SlSection extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const bg = this.getAttribute('bg') || 'surface-container-lowest';
    const extraClasses = this.getAttribute('class') || '';
    const sectionId = this.id || '';
    const originalChildren = [...this.childNodes];
    this.removeAttribute('class');
    this.removeAttribute('id');
    this.innerHTML = `
      <section class="py-section-gap-mobile md:py-section-gap-desktop px-margin-mobile md:px-gutter bg-${bg} ${extraClasses}"${sectionId ? ` id="${sectionId}"` : ''}></section>
    `;
    const section = this.querySelector('section');
    originalChildren.forEach(node => section.appendChild(node));
  }
}
customElements.define('sl-section', SlSection);

function slBrand(extraClasses, href) {
  const tag = href ? 'a' : 'div';
  const hrefAttr = href ? ` href="${href}"` : '';
  return `<${tag} class="font-headline-sm text-headline-sm text-on-primary flex items-center justify-center md:justify-start gap-2 ${extraClasses}"${hrefAttr}>${slIcon('sun', 'w-7 h-7 text-secondary-container')}Sunlogic</${tag}>`;
}

function slLinkList(items) {
  return items.map(item => `<li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="${item.href}">${item.label}</a></li>`).join('');
}

class SlNavBar extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    const active = this.getAttribute('active') || 'home';
    const items = [
      { key: 'home', label: 'Home', href: 'index.html' },
      { key: 'solar', label: 'Solar', href: 'solar.html' },
      { key: 'electrical', label: 'Electrical', href: 'electrical.html' },
      { key: 'energy', label: 'Energy Management', href: 'energy-management.html' },
      { key: 'contact', label: 'Contact', href: 'contact.html' },
    ];
    const linksHtml = items.map(item => {
      const base = 'font-label-md uppercase tracking-wide pb-1 border-b-2 sl-lift';
      const classes = item.key === active
        ? `${base} text-secondary-container border-secondary-container font-bold`
        : `${base} text-on-primary/80 border-transparent hover:text-secondary-container hover:border-secondary-container hover:font-bold`;
      return `<a class="${classes}" href="${item.href}">${item.label}</a>`;
    }).join('');

    this.innerHTML = `
      <nav class="fixed top-4 z-50 backdrop-blur-md border border-on-primary/10 transition-all duration-300 ease-in-out py-1 mx-auto max-w-6xl rounded-xl left-4 right-4 bg-black/65 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_0_20px_rgba(255,128,0,0.12)]">
        <div class="flex justify-between items-center px-8 py-3">
          ${slBrand('font-bold', 'index.html')}
          <div class="hidden md:flex gap-8 items-center">${linksHtml}</div>
          <sl-button variant="primary" size="compact" shadow="hover-lg" hidden-mobile href="index.html#assessment">Free Assessment</sl-button>
          <button class="md:hidden text-on-primary p-2" data-menu-toggle aria-label="Toggle menu">
            ${slIcon('bars-3', 'w-6 h-6')}
          </button>
        </div>
        <div class="hidden md:hidden flex-col gap-4 px-8 pb-6 pt-2" data-mobile-panel>
          <div class="flex flex-col gap-4 items-start">${linksHtml}</div>
          <sl-button variant="primary" size="compact" shadow="hover-lg" full-width href="index.html#assessment">Free Assessment</sl-button>
        </div>
      </nav>
    `;

    const toggleBtn = this.querySelector('[data-menu-toggle]');
    const panel = this.querySelector('[data-mobile-panel]');
    const closeMenu = () => {
      panel.classList.remove('flex');
      panel.classList.add('hidden');
      toggleBtn.innerHTML = slIcon('bars-3', 'w-6 h-6');
    };
    toggleBtn.addEventListener('click', () => {
      const isOpen = panel.classList.contains('flex');
      if (isOpen) {
        closeMenu();
      } else {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
        toggleBtn.innerHTML = slIcon('x-mark', 'w-6 h-6');
      }
    });
    panel.querySelectorAll('a, sl-button').forEach(el => el.addEventListener('click', closeMenu));
  }
}
customElements.define('sl-nav-bar', SlNavBar);

class SlFooter extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this.innerHTML = `
      <footer class="bg-primary-container w-full border-t border-on-primary/10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 px-margin-mobile md:px-gutter py-section-gap-mobile md:py-section-gap-desktop mx-auto max-w-6xl text-center md:text-left">
          <div class="col-span-1 md:col-span-1">
            ${slBrand('mb-6')}
            <p class="font-body-md text-body-md mb-8 leading-relaxed text-on-primary">Providing leading Solar and Electrical services across all industries.</p>
            <div class="flex justify-center md:justify-start gap-4">
              <div aria-label="Share this page" class="w-10 h-10 rounded-[0.75rem] bg-surface/10 flex items-center justify-center hover:bg-secondary-container hover:text-on-primary cursor-pointer transition-colors text-on-primary/80">
                ${slIcon('share', 'w-5 h-5')}
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <h5 class="font-label-md text-label-md text-secondary-container font-bold mb-6 uppercase tracking-widest">Support</h5>
            <ul class="space-y-4">${slLinkList([
              { label: 'Privacy Policy', href: 'legal.html#privacy-policy' },
              { label: 'Terms of Service', href: 'legal.html#terms-and-conditions' },
              { label: 'Warranty', href: 'legal.html#warranty-statement' },
              { label: 'Safety Certification', href: '#' },
              { label: 'Maintenance Portal', href: '#' },
            ])}</ul>
          </div>
          <div class="col-span-1">
            <h5 class="font-label-md text-label-md text-secondary-container font-bold mb-6 uppercase tracking-widest">Recent Posts</h5>
            <ul class="space-y-4">${slLinkList([
              { label: '3 Essential Checks', href: '#' },
              { label: 'Rent-to-own', href: '#' },
              { label: 'View All Posts', href: 'blog.html' },
            ])}</ul>
          </div>
          <div class="col-span-1">
            <h5 class="font-label-md text-label-md text-secondary-container font-bold mb-6 uppercase tracking-widest">Contact</h5>
            <p class="font-body-md text-body-md mb-6 text-on-primary">Ready to start your project?</p>
            <sl-button variant="primary" size="md" shadow="static-lg" icon="arrow-right" href="contact.html">Contact Us</sl-button>
          </div>
        </div>
        <div class="border-t border-on-primary/10 bg-primary/20">
          <div class="mx-auto px-margin-mobile md:px-gutter py-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl">
            <p class="font-body-md text-body-md text-on-primary/60 text-on-primary">
              © 2024 Sunlogic Electrical. All rights reserved.
            </p>
            <div aria-label="Share this page" class="flex gap-6">
              <a class="text-on-primary/60 hover:text-secondary-container transition-colors text-sm" href="legal.html#privacy-policy">Privacy</a>
              <a class="text-on-primary/60 hover:text-secondary-container transition-colors text-sm" href="legal.html#terms-and-conditions">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('sl-footer', SlFooter);
