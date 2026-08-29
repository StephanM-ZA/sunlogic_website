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

class DlNavBar extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'none';
    const links = [
      { href: 'index.html', key: 'home', label: 'Home' },
      { href: 'solar.html', key: 'solar', label: 'Solar' },
      { href: 'electrical.html', key: 'electrical', label: 'Electrical' },
      { href: 'energy-management.html', key: 'energy', label: 'Energy Management' },
      { href: 'blog.html', key: 'blog', label: 'Worth Knowing' },
    ];
    const linksHtml = links.map(function(l) {
      const colorClass = l.key === active ? 'text-accent' : 'text-text-muted hover:text-text-primary';
      return '<a href="' + l.href + '" class="nav-link px-3 py-2 rounded-lg font-body text-sm transition-colors duration-150 ' + colorClass + '">' + l.label + '</a>';
    }).join('');
    this.innerHTML =
      '<nav class="fixed top-0 left-0 right-0 z-[100] flex items-center gap-2 px-6 py-3 border-b border-border bg-background">' +
      '<a href="index.html" class="font-display text-text-primary text-lg mr-6">Sunlogic</a>' +
      linksHtml +
      '<dl-button variant="primary" href="contact.html" class="ml-auto">Get Started</dl-button>' +
      '</nav>';
  }
}
customElements.define('dl-nav-bar', DlNavBar);

class DlFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML =
      '<footer class="bg-surface border-t border-border py-16 px-6">' +
      '<div class="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-text-muted font-body text-sm">' +
      '<div><div class="font-display text-text-primary text-lg mb-4">Sunlogic</div>' +
      '<p>Solar, electrical, and smart energy management for South African homes and businesses.</p></div>' +
      '<div class="flex flex-col gap-2">' +
      '<a href="solar.html" class="hover:text-text-primary">Solar</a>' +
      '<a href="electrical.html" class="hover:text-text-primary">Electrical</a>' +
      '<a href="energy-management.html" class="hover:text-text-primary">Energy Management</a>' +
      '<a href="blog.html" class="hover:text-text-primary">Worth Knowing</a></div>' +
      '<div class="flex flex-col gap-2">' +
      '<a href="contact.html" class="hover:text-text-primary">Contact</a>' +
      '<a href="legal.html" class="hover:text-text-primary">Legal</a></div>' +
      '</div></footer>';
  }
}
customElements.define('dl-footer', DlFooter);

class DlReveal extends HTMLElement {
  connectedCallback() {
    DlReveal._observer.observe(this);
  }
}
DlReveal._observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      DlReveal._observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
customElements.define('dl-reveal', DlReveal);

class DlRevealLines extends HTMLElement {
  connectedCallback() {
    DlRevealLines._observer.observe(this);
  }
}
DlRevealLines._observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      DlRevealLines._observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
customElements.define('dl-reveal-lines', DlRevealLines);
