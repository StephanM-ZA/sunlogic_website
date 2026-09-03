(function () {
  if (customElements.get('plugin-review-carousel')) return;

  function injectBaseStyles() {
    if (document.getElementById('plugin-review-carousel-styles')) return;
    const style = document.createElement('style');
    style.id = 'plugin-review-carousel-styles';
    style.textContent = `
      plugin-review-carousel { display: contents; }

      :where(:root) {
        --plugin-review-accent: #ff8000;
        --plugin-review-card-bg: #ffffff;
        --plugin-review-text-color: #1a1a1a;
        --plugin-review-text-muted: #6b7280;
        --plugin-review-card-height: 260px;
        --plugin-review-card-width: 320px;
        --plugin-review-card-width-mobile: 260px;
        --plugin-review-radius: 1rem;
        --plugin-review-gap: 1.5rem;
        --plugin-review-speed: 40s;
        --plugin-review-font: inherit;
      }

      .plugin-review-viewport {
        overflow: hidden;
        width: 100%;
        font-family: var(--plugin-review-font);
        /* Cards continuously enter and exit at both edges — a hard clip
           there reads as cropping. Fading them out over the last ~10%
           makes the same clip read as an edge the row scrolls under,
           not a cut. */
        -webkit-mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
        mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent);
      }

      .plugin-review-track {
        display: flex;
        gap: var(--plugin-review-gap);
        width: max-content;
        animation: plugin-review-scroll var(--plugin-review-speed) linear infinite;
      }

      plugin-review-carousel:hover .plugin-review-track,
      plugin-review-carousel:focus-within .plugin-review-track {
        animation-play-state: paused;
      }

      @keyframes plugin-review-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      .plugin-review-card {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        width: var(--plugin-review-card-width-mobile);
        height: var(--plugin-review-card-height);
        background: var(--plugin-review-card-bg);
        border-radius: var(--plugin-review-radius);
        padding: 1.25rem;
        text-decoration: none;
        color: var(--plugin-review-text-color);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        position: relative;
        overflow: hidden;
      }

      @media (min-width: 641px) {
        .plugin-review-card {
          width: var(--plugin-review-card-width);
        }
      }

      .plugin-review-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .plugin-review-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      .plugin-review-avatar-initials {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        background: color-mix(in srgb, var(--plugin-review-accent) 15%, white);
        color: var(--plugin-review-accent);
      }

      .plugin-review-identity {
        min-width: 0;
      }

      .plugin-review-name {
        font-weight: 700;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .plugin-review-meta {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: var(--plugin-review-text-muted);
      }

      .plugin-review-stars {
        display: flex;
        gap: 0.125rem;
        margin-bottom: 0.625rem;
      }

      .plugin-review-star {
        width: 1rem;
        height: 1rem;
      }

      .plugin-review-text-wrap {
        position: relative;
        flex: 1;
        min-height: 0;
      }

      .plugin-review-text {
        font-size: 0.875rem;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .plugin-review-fade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2rem;
        background: linear-gradient(to bottom, transparent, var(--plugin-review-card-bg));
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .plugin-review-track {
          animation: none;
        }
        .plugin-review-viewport {
          overflow-x: auto;
          scroll-snap-type: x mandatory;
        }
        .plugin-review-card {
          scroll-snap-align: start;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const STAR_PATH = 'M12 2.5l2.9 6.06 6.6.87-4.86 4.6 1.27 6.6L12 17.9l-5.91 2.73 1.27-6.6-4.86-4.6 6.6-.87L12 2.5z';

  function starIcon(filled) {
    const fill = filled ? 'var(--plugin-review-accent)' : 'none';
    const stroke = filled ? 'none' : 'var(--plugin-review-text-muted)';
    return `<svg class="plugin-review-star" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.5" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderCard(review) {
    const avatarHtml = review.avatar
      ? `<img class="plugin-review-avatar" src="${escapeHtml(review.avatar)}" alt="" loading="lazy"/>`
      : `<div class="plugin-review-avatar-initials">${escapeHtml(initials(review.name))}</div>`;

    const starsHtml = Array.from({ length: 5 }, (_, i) => starIcon(i < review.rating)).join('');

    const dateHtml = review.date
      ? `<span>${escapeHtml(review.date)}</span><span aria-hidden="true">&middot;</span>`
      : '';

    return `
      <a class="plugin-review-card" href="${escapeHtml(review.url)}" target="_blank" rel="noopener">
        <div class="plugin-review-header">
          ${avatarHtml}
          <div class="plugin-review-identity">
            <div class="plugin-review-name">${escapeHtml(review.name)}</div>
            <div class="plugin-review-meta">${dateHtml}<span>Posted on Google</span></div>
          </div>
        </div>
        <div class="plugin-review-stars" role="img" aria-label="Rated ${review.rating} out of 5 stars">${starsHtml}</div>
        <div class="plugin-review-text-wrap">
          <p class="plugin-review-text">${escapeHtml(review.text)}</p>
          <div class="plugin-review-fade"></div>
        </div>
      </a>
    `;
  }

  class PluginReviewCarousel extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;

      const reviews = window.PLUGIN_REVIEWS;
      if (!Array.isArray(reviews) || reviews.length === 0) {
        console.warn('[plugin-review-carousel] No reviews found — set window.PLUGIN_REVIEWS before this script loads.');
        return;
      }

      this._rendered = true;
      injectBaseStyles();

      const cardsHtml = reviews.map(renderCard).join('');
      this.innerHTML = `
        <div class="plugin-review-viewport">
          <div class="plugin-review-track">
            ${cardsHtml}
            ${cardsHtml}
          </div>
        </div>
      `;

      /* The track is two back-to-back copies of the cards, animating
         translateX(0) to -50% — exactly one copy's width — so it loops
         seamlessly. --plugin-review-speed is a fixed DURATION, so more
         reviews (more distance to cover in the same time) scrolled
         visibly faster with no change to the reviewer count's intent.
         Deriving the duration from the actual rendered width instead
         holds a constant px/s pace regardless of how many reviews exist.
         52px/s matches the original 6-card set's tuned 40s duration.
         Reading scrollWidth right after the innerHTML write forces a
         synchronous layout flush mid-script (Lighthouse's "forced
         reflow" audit). Deferring the read to the next frame lets it
         land inside the browser's normal layout pass instead. */
      const track = this.querySelector('.plugin-review-track');
      requestAnimationFrame(() => {
        const PX_PER_SECOND = 52;
        const oneCopyWidth = track.scrollWidth / 2;
        track.style.setProperty('--plugin-review-speed', (oneCopyWidth / PX_PER_SECOND) + 's');
      });
    }
  }

  customElements.define('plugin-review-carousel', PluginReviewCarousel);
})();
