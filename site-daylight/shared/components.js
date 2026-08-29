class DlSection extends HTMLElement {
  connectedCallback() {
    const bg = this.getAttribute('bg') || 'background';
    const bgClass = bg === 'surface' ? 'bg-surface' : 'bg-background';
    const content = this.innerHTML;
    this.innerHTML = `<div class="${bgClass} py-16 md:py-32 px-6"><div class="max-w-[1000px] mx-auto">${content}</div></div>`;
  }
}
customElements.define('dl-section', DlSection);

class DlCard extends HTMLElement {
  connectedCallback() {
    const content = this.innerHTML;
    this.innerHTML = `<div class="bg-surface border border-border rounded-lg p-4">${content}</div>`;
  }
}
customElements.define('dl-card', DlCard);

class DlBadge extends HTMLElement {
  connectedCallback() {
    const content = this.innerHTML;
    this.innerHTML = `<span class="inline-flex items-center px-2 py-1 rounded-3xl font-mono text-[11px] uppercase tracking-[0.08em] bg-surface text-text-muted">${content}</span>`;
  }
}
customElements.define('dl-badge', DlBadge);

class DlButton extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    const href = this.getAttribute('href');
    const icon = this.getAttribute('icon');
    const label = this.innerHTML;
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body font-medium transition-opacity duration-150';
    const styles = variant === 'primary'
      ? base + ' bg-accent text-text-primary hover:opacity-90'
      : base + ' bg-transparent border border-border text-text-primary hover:opacity-90';
    const iconSvg = (icon && window.dlIcons && window.dlIcons[icon]) ? window.dlIcons[icon] : '';
    const tag = href ? 'a' : 'button';
    const hrefAttr = href ? ' href="' + href + '"' : '';
    this.innerHTML = '<' + tag + hrefAttr + ' class="' + styles + '">' + label + iconSvg + '</' + tag + '>';
  }
}
customElements.define('dl-button', DlButton);

class DlField extends HTMLElement {
  connectedCallback() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const name = this.getAttribute('name') || '';
    const required = this.hasAttribute('required') ? 'required' : '';
    const id = 'dl-field-' + name;
    this.innerHTML =
      '<label for="' + id + '" class="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted mb-2">' + label + '</label>' +
      '<input id="' + id + '" name="' + name + '" type="' + type + '" ' + required + ' class="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />';
  }
}
customElements.define('dl-field', DlField);

class DlCallout extends HTMLElement {
  connectedCallback() {
    const icon = this.getAttribute('icon');
    const iconSvg = (icon && window.dlIcons && window.dlIcons[icon]) ? window.dlIcons[icon] : '';
    const content = this.innerHTML;
    this.innerHTML =
      '<div class="flex gap-4 items-start bg-surface border-l-4 border-accent rounded-lg p-4">' +
      (iconSvg ? '<span class="text-accent shrink-0 mt-1">' + iconSvg + '</span>' : '') +
      '<div class="font-body text-sm text-text-primary leading-[1.5]">' + content + '</div>' +
      '</div>';
  }
}
customElements.define('dl-callout', DlCallout);
