const slBaseStyle = document.createElement('style');
slBaseStyle.textContent = `
  sl-button, sl-section-header, sl-card, sl-field, sl-nav-bar, sl-footer {
    display: contents;
  }
`;
document.head.appendChild(slBaseStyle);

class SlButton extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const icon = this.getAttribute('icon');
    const href = this.getAttribute('href');
    const type = this.getAttribute('type') || 'button';
    const fullWidth = this.hasAttribute('full-width');
    const lift = this.hasAttribute('lift');
    const hiddenMobile = this.hasAttribute('hidden-mobile');
    const shadow = this.getAttribute('shadow') || 'none';
    const transition = this.getAttribute('transition') || 'all';
    const label = this.textContent.trim();

    const VARIANT = {
      primary: 'bg-secondary-container text-on-primary hover:bg-secondary',
      secondary: 'border-2 border-surface/30 text-surface hover:border-surface hover:bg-surface/10',
      dark: 'bg-primary-container text-on-primary hover:bg-primary',
    };
    const SIZE = {
      compact: 'px-7 py-2.5 font-body-md',
      md: 'px-8 py-3.5 font-body-md',
      lg: 'px-8 py-4 font-body-md',
      form: 'px-6 py-4 font-body-lg mt-4',
    };
    const SHADOW = {
      none: '',
      'hover-lg': 'hover:shadow-lg',
      'static-lg': 'shadow-lg',
      'hover-md-lg': 'shadow-md hover:shadow-lg',
    };

    const classes = [
      'font-bold', 'rounded-[0.75rem]', `transition-${transition}`,
      VARIANT[variant], SIZE[size], SHADOW[shadow],
      fullWidth ? 'w-full' : '',
      lift ? 'hover:-translate-y-0.5' : '',
      hiddenMobile ? 'hidden md:block' : '',
      icon ? 'inline-flex items-center gap-2' : '',
    ].filter(Boolean).join(' ');

    const iconHtml = icon ? `<span class="material-symbols-outlined text-xl">${icon}</span>` : '';
    const inner = `${label}${iconHtml}`;

    this.innerHTML = href
      ? `<a class="${classes}" href="${href}">${inner}</a>`
      : `<button class="${classes}" type="${type}">${inner}</button>`;
  }
}
customElements.define('sl-button', SlButton);

class SlSectionHeader extends HTMLElement {
  connectedCallback() {
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
