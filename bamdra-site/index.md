---
layout: home

title: Bamdra | AI That Belongs In Real Work
titleTemplate: false
description: Bamdra imagines AI that enters real work, expands human reach, and reshapes workflows. The OpenClaw memory suite is one part of the current product line.

hero:
  name: ""
  text: "Lifted by will, it returns with deep order, long memory, and a human destination."
  tagline: ""
  image:
    src: /logo-animated.svg
    alt: Bamdra animated logo
  actions:
    - theme: brand
      text: Install With One Command
      link: /guide/installation
    - theme: alt
      text: Browse Products
      link: /guide/products

---

<div class="home-shell">
  <section class="home-panel download-panel">
    <div>
      <p class="accent-kicker">Install</p>
      <h2>One command gets the suite started</h2>
      <p>Install the main plugin once. It will auto-create the local memory directory, auto-provision <code>bamdra-user-bind</code>, and stage <code>bamdra-memory-vector</code> locally so the full stack is ready immediately.</p>
      <div class="language-bash vp-adaptive-theme">
        <pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line">openclaw plugins install @bamdra/bamdra-openclaw-memory</span></code></pre>
      </div>
    </div>
    <div class="inline-actions">
      <a class="contact-link" href="/guide/installation">Read Install Guide</a>
      <a class="contact-link" href="/guide/architecture">See Architecture</a>
      <a class="contact-link" href="/guide/downloads">Download Release Package</a>
    </div>
  </section>

  <section class="home-panel">
    <div class="story-band">
      <p class="accent-kicker">The Meaning Of Bamdra</p>
      <h2>Bamdra is named after the bamboo dragonfly, a simple object lifted by human hands and completed only when it returns.</h2>
      <p>A bamboo dragonfly rises because a person gives it force. Once airborne, it sees farther and moves beyond the reach of the hand alone. But its value is not separation from people. Its meaning is fulfilled only when it returns with a broader view. That is how we think about AI: launched by human intent, expanded by machine capability, and always brought back to human judgment, human purpose, and human responsibility.</p>
    </div>
    <h2>Why teams look at Bamdra now</h2>
    <div class="signal-grid">
      <div class="signal-item">
        <strong>OpenClaw</strong>
        <span>Focused product fit from day one, with a dedicated memory system built specifically for OpenClaw workflows.</span>
      </div>
      <div class="signal-item">
        <strong>SQLite-first</strong>
        <span>Simple deployment, predictable persistence, and fast retrieval without introducing unnecessary infrastructure.</span>
      </div>
      <div class="signal-item">
        <strong>Workflow change</strong>
        <span>What matters is not just that AI can do something, but that it changes the rhythm, continuity, and leverage of everyday work.</span>
      </div>
      <div class="signal-item">
        <strong>Human return</strong>
        <span>AI should always come back to human judgment, human goals, and human accountability, even after it has expanded what is possible.</span>
      </div>
    </div>
  </section>

  <section class="home-panel">
    <div class="section-heading">
      <p class="accent-kicker">Product Suite</p>
      <h2>Three plugins, one continuity-first memory stack</h2>
      <p>Bamdra now ships as a three-plugin public suite. All three plugins can run independently, while the main memory plugin can also auto-provision its identity companion and stage the vector plugin during install.</p>
    </div>
    <div class="signal-grid">
      <div class="signal-item">
        <strong>bamdra-openclaw-memory</strong>
        <span>The main runtime for topic continuity, compact context assembly, fact storage, and long-session recovery in OpenClaw.</span>
      </div>
      <div class="signal-item">
        <strong>bamdra-user-bind</strong>
        <span>The identity and profile plugin. It resolves raw channel identities into stable user boundaries, and it can run on its own or be auto-provisioned by the main memory plugin.</span>
      </div>
      <div class="signal-item">
        <strong>bamdra-memory-vector</strong>
        <span>The semantic retrieval and knowledge-base layer. It is auto-staged by the main install so local Markdown knowledge can join recall immediately.</span>
      </div>
      <div class="signal-item">
        <strong>Why the split matters</strong>
        <span>Separate repositories, packages, and release roles make deployment clearer, security boundaries safer, and future iteration easier.</span>
      </div>
    </div>
  </section>

  <section class="home-panel product-card">
    <div class="product-copy">
      <p class="accent-kicker">Suite Entry</p>
      <h2>bamdra-openclaw-memory is the main entry point</h2>
      <p>bamdra-openclaw-memory gives OpenClaw durable memory for long-running sessions. It separates conversation branches, saves reusable facts, refreshes summaries, and keeps the active prompt compact enough to stay practical in production.</p>
      <p>`bamdra-openclaw-memory` can run independently. When it is installed through npm, it can also auto-provision <code>bamdra-user-bind</code> if that dependency is not already materialized in the local OpenClaw extensions directory.</p>
      <p><code>bamdra-memory-vector</code> is also staged automatically, so one install already gives you topic continuity, user-aware memory, and a maintainable local knowledge base.</p>
      <div class="inline-actions">
        <a class="contact-link" href="/guide/products">Browse All Products</a>
        <a class="contact-link" href="/guide/architecture">View Architecture</a>
        <a class="contact-link" href="https://github.com/bamdra">Open GitHub</a>
      </div>
    </div>
    <div class="product-meta">
      <ul>
        <li><span>Repository</span><strong>bamdra/bamdra-openclaw-memory</strong></li>
        <li><span>Primary value</span><strong>Continuity without prompt bloat</strong></li>
        <li><span>Auto companion</span><strong>bamdra-user-bind</strong></li>
        <li><span>Knowledge layer</span><strong>bamdra-memory-vector</strong></li>
        <li><span>Deployment mode</span><strong>SQLite + editable Markdown knowledge</strong></li>
      </ul>
    </div>
  </section>

  <section class="home-panel home-columns">
    <div class="info-card">
      <p class="accent-kicker">Use Cases</p>
      <h3>Built for nonlinear work</h3>
      <ul class="clean-list">
        <li>Product operations that jump between incidents, planning, and handoff notes.</li>
        <li>Developer copilots that must preserve project constraints across long sessions.</li>
        <li>Knowledge workflows where stable facts, private notes, and shared docs all need to survive restarts and topic drift.</li>
      </ul>
    </div>
    <div class="info-card">
      <p class="accent-kicker">What Changes</p>
      <h3>Not just deployment, but a new working pattern</h3>
      <ul class="clean-list">
        <li>Less repetition when teams return to paused work.</li>
        <li>Stronger continuity across interruptions, detours, and restarts.</li>
        <li>A more durable way to carry decisions, paths, constraints, preferences, and knowledge files through long workflows.</li>
      </ul>
    </div>
  </section>

  <section class="home-panel download-panel">
    <div>
      <p class="accent-kicker">Get Started</p>
      <h2>Download the current release</h2>
      <p>Use the one-command install when possible, or start from the packaged release and wire it into OpenClaw with the guidance on this site.</p>
    </div>
    <div class="inline-actions">
      <a class="contact-link" href="/guide/installation">One-Command Install</a>
      <a class="contact-link" href="/guide/downloads">Open Download Center</a>
    </div>
  </section>
</div>
