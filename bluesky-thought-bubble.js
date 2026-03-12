class BlueskyThoughtBubble extends HTMLElement {
  static get observedAttributes() {
    return ['handle', 'limit'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._posts = [];
    this._currentIndex = 0;
  }

  get handle() {
    return this.getAttribute('handle') || 'nolastan.bsky.social';
  }

  get limit() {
    return parseInt(this.getAttribute('limit') || '5');
  }

  connectedCallback() {
    this._render();
    this._fetchPosts();
  }

  attributeChangedCallback() {
    if (this.shadowRoot.innerHTML) {
      this._fetchPosts();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .thought-bubble {
          border: 1px solid var(--rule);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          opacity: 0;
          animation: fadeUp 0.6s ease forwards;
          animation-delay: 0.4s;
        }

        .thought-bubble::before,
        .thought-bubble::after {
          content: '';
          position: absolute;
          border: 1px solid var(--rule);
          border-radius: 50%;
          background: var(--paper);
        }

        .thought-bubble::before {
          width: 16px;
          height: 16px;
          bottom: -24px;
          left: 28px;
          border-right-color: transparent;
          border-bottom-color: transparent;
        }

        .thought-bubble::after {
          width: 10px;
          height: 10px;
          bottom: -36px;
          left: 20px;
          border-right-color: transparent;
          border-bottom-color: transparent;
        }

        .thought-bubble-header {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bluesky-icon {
          width: 16px;
          height: 16px;
          fill: #1185fe;
          flex-shrink: 0;
        }

        .thought-text {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--ink-light);
          margin-bottom: 12px;
        }

        .thought-text a {
          color: var(--accent);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s;
        }

        .thought-text a:hover {
          border-bottom-color: var(--accent);
        }

        .thought-meta {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--ink-faint);
          padding-top: 12px;
          border-top: 1px solid var(--rule);
        }

        .thought-meta a {
          color: var(--ink-faint);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.15s;
        }

        .thought-meta a:hover {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .thought-loading {
          color: var(--ink-faint);
          font-style: italic;
          font-size: 0.88rem;
        }

        .thought-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--rule);
        }

        .thought-nav[hidden] {
          display: none;
        }

        .thought-nav button {
          background: none;
          border: none;
          color: var(--ink-faint);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 1.2rem;
          line-height: 1;
          transition: color 0.15s;
          font-family: 'DM Mono', monospace;
        }

        .thought-nav button:hover:not(:disabled) {
          color: var(--accent);
        }

        .thought-nav button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .thought-counter {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--ink-faint);
          min-width: 40px;
          text-align: center;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .thought-bubble::before,
          .thought-bubble::after {
            display: none;
          }
        }
      </style>

      <div class="thought-bubble">
        <div class="thought-bubble-header">
          <svg class="bluesky-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
          </svg>
          Latest Thought
        </div>
        <div class="post-container thought-loading">Loading...</div>
        <div class="thought-nav" hidden>
          <button class="prev-btn" aria-label="Previous post">←</button>
          <span class="thought-counter">1/5</span>
          <button class="next-btn" aria-label="Next post">→</button>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.prev-btn').addEventListener('click', () => this._navigate(-1));
    this.shadowRoot.querySelector('.next-btn').addEventListener('click', () => this._navigate(1));
  }

  _navigate(direction) {
    const next = this._currentIndex + direction;
    if (next >= 0 && next < this._posts.length) {
      this._currentIndex = next;
      this._displayPost(this._currentIndex);
    }
  }

  _formatTimeAgo(createdAt) {
    const diffMs = Date.now() - createdAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return diffMins === 1 ? '1 min ago' : `${diffMins} mins ago`;
    if (diffHours < 24) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    if (diffDays < 7) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    return createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  _displayPost(index) {
    const { post } = this._posts[index];
    const createdAt = new Date(post.record.createdAt);
    const postUri = post.uri.replace('at://', '').split('/');
    const postUrl = `https://bsky.app/profile/${postUri[0]}/post/${postUri[2]}`;
    const formattedText = post.record.text
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
      .replace(/\n/g, '<br>');

    this.shadowRoot.querySelector('.post-container').innerHTML = `
      <div class="thought-text">${formattedText}</div>
      <div class="thought-meta">
        <a href="${postUrl}" target="_blank">${this._formatTimeAgo(createdAt)}</a>
      </div>
    `;

    const nav = this.shadowRoot.querySelector('.thought-nav');
    this.shadowRoot.querySelector('.thought-counter').textContent = `${index + 1}/${this._posts.length}`;
    this.shadowRoot.querySelector('.prev-btn').disabled = index === 0;
    this.shadowRoot.querySelector('.next-btn').disabled = index === this._posts.length - 1;
    nav.hidden = this._posts.length <= 1;
  }

  async _fetchPosts() {
    try {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(this.handle)}&limit=${this.limit}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.feed && data.feed.length > 0) {
        this._posts = data.feed;
        this._currentIndex = 0;
        this._displayPost(0);
      }
    } catch (error) {
      console.error('Error fetching Bluesky posts:', error);
      this.shadowRoot.querySelector('.post-container').innerHTML = '<div class="thought-loading">Unable to load posts</div>';
    }
  }
}

customElements.define('bluesky-thought-bubble', BlueskyThoughtBubble);
