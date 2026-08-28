const slBaseStyle = document.createElement('style');
slBaseStyle.textContent = `
  sl-button, sl-section-header, sl-card, sl-field, sl-nav-bar, sl-footer {
    display: contents;
  }
`;
document.head.appendChild(slBaseStyle);
