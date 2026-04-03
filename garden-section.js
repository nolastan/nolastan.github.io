class GardenSection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._plants = [
      {
        id: 'thyme',
        name: 'Thyme',
        subtitle: 'Planted from starter in March 2024',
        image: 'thyme.png',
        description: `This thyme came with us from our apartment in a grow bag. I transplanted it to a railing container so that it's easily accessible from the kitchen, since our garden is down two flights of stairs. I use the thyme leaves often in <a href="https://makeitdairyfree.com/easy-vegan-chickpea-curry/" target="_blank">Andrew Bernard's curry</a>.`
      },
      {
        id: 'tomato',
        name: 'Tomato',
        subtitle: 'Propagated in October 2025',
        image: 'tomato.png',
        description: `A large tomato plant was growing from the neighbor's raised bed through the trellis that divides our yards. While prolific, the plant was beginning to block our access to the yard. To remediate this, I cut off some branches of the vine and lazily propagated them around the yard. Really, I just jammed them in the soil next to the soaker hose. The baby tomato plants performance ranged from withering up immediately to thriving to this day. The two remaining are in the sunny, northern side of the yard, happily growing back up the trellis they came from.`
      }
    ];
  }

  connectedCallback() {
    this.render();
    this._addEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: 56px;
        }

        .garden-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-faint, #9a9a90);
          margin-bottom: 14px;
        }

        .garden-grid {
          display: flex;
          gap: 12px;
        }

        .garden-item {
          position: relative;
          cursor: pointer;
          flex: 1;
        }

        .garden-item img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 10px;
          display: block;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .garden-item:hover img {
          transform: scale(1.03);
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
        }

        .popover-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999;
        }

        .popover-overlay.open {
          display: block;
        }

        .popover {
          display: none;
          position: fixed;
          z-index: 1000;
          background: var(--paper, #f7f5f0);
          border: 1px solid var(--rule, #dddbd4);
          border-radius: 12px;
          padding: 20px;
          width: 340px;
          max-width: calc(100vw - 48px);
          max-height: 70vh;
          overflow-y: auto;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          animation: popIn 0.2s ease forwards;
        }

        .popover.open {
          display: block;
        }

        @keyframes popIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .popover-close {
          position: absolute;
          top: 10px;
          right: 14px;
          background: none;
          border: none;
          font-size: 1.2rem;
          color: var(--ink-faint, #9a9a90);
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.15s;
          font-family: 'DM Mono', monospace;
        }

        .popover-close:hover {
          color: var(--accent, #c85a2a);
        }

        .popover-title {
          font-family: 'Lora', Georgia, serif;
          font-weight: 500;
          font-size: 1rem;
          color: var(--ink, #1a1a18);
          margin-bottom: 4px;
          padding-right: 24px;
        }

        .popover-subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: var(--ink-faint, #9a9a90);
          margin-bottom: 12px;
        }

        .popover-desc {
          font-family: 'Lora', Georgia, serif;
          font-size: 0.85rem;
          line-height: 1.75;
          color: var(--ink-light, #5a5a52);
        }

        .popover-desc a {
          color: var(--ink, #1a1a18);
          text-decoration: none;
          border-bottom: 1px solid var(--rule, #dddbd4);
          transition: color 0.15s, border-color 0.15s;
        }

        .popover-desc a:hover {
          color: var(--accent, #c85a2a);
          border-color: var(--accent, #c85a2a);
        }
      </style>

      <p class="garden-label">Garden</p>
      <div class="garden-grid">
        ${this._plants.map(plant => `
          <div class="garden-item" data-plant="${plant.id}">
            <img src="${plant.image}" alt="${plant.name}" />
          </div>
        `).join('')}
      </div>

      <div class="popover-overlay" id="popover-overlay"></div>
      <div class="popover" id="popover">
        <button class="popover-close" id="popover-close" aria-label="Close">&times;</button>
        <div class="popover-title" id="popover-title"></div>
        <div class="popover-subtitle" id="popover-subtitle"></div>
        <div class="popover-desc" id="popover-desc"></div>
      </div>
    `;
  }

  _addEventListeners() {
    const items = this.shadowRoot.querySelectorAll('.garden-item');
    const popover = this.shadowRoot.getElementById('popover');
    const overlay = this.shadowRoot.getElementById('popover-overlay');
    const closeBtn = this.shadowRoot.getElementById('popover-close');

    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const plantId = item.dataset.plant;
        const plant = this._plants.find(p => p.id === plantId);
        if (!plant) return;

        this.shadowRoot.getElementById('popover-title').textContent = plant.name;
        this.shadowRoot.getElementById('popover-subtitle').textContent = plant.subtitle;
        this.shadowRoot.getElementById('popover-desc').innerHTML = plant.description;

        // Position the popover near the clicked item
        const rect = item.getBoundingClientRect();
        const popoverWidth = 340;

        // Position above the image, centered on it
        let left = rect.left + (rect.width / 2) - (popoverWidth / 2);
        let top = rect.top - 8;

        // Ensure it stays within viewport
        const margin = 16;
        if (left < margin) left = margin;
        if (left + popoverWidth > window.innerWidth - margin) {
          left = window.innerWidth - popoverWidth - margin;
        }

        popover.style.left = `${left}px`;

        // Show popover temporarily to measure height
        popover.classList.add('open');
        const popoverHeight = popover.offsetHeight;

        // Position above the image
        top = rect.top - popoverHeight - 8;

        // If not enough space above, position below
        if (top < margin) {
          top = rect.bottom + 8;
        }

        // If still overflows bottom, just place at top
        if (top + popoverHeight > window.innerHeight - margin) {
          top = margin;
        }

        popover.style.top = `${top}px`;
        overlay.classList.add('open');
      });
    });

    const closePopover = () => {
      popover.classList.remove('open');
      overlay.classList.remove('open');
    };

    closeBtn.addEventListener('click', closePopover);
    overlay.addEventListener('click', closePopover);
  }
}

customElements.define('garden-section', GardenSection);
