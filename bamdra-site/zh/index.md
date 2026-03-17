---
layout: home

title: Bamdra | 让 AI 真正进入真实工作
titleTemplate: false
description: Bamdra 希望让 AI 真正进入真实工作，扩展人的能力边界，并重塑日常工作流。OpenClaw 记忆套件只是当前产品线的一部分。

hero:
  name: ""
  text: "意志所举，终携深序长忆，归向人间。"
  tagline: ""
  image:
    src: /logo-animated.svg
    alt: Bamdra 动态 Logo
  actions:
    - theme: brand
      text: 一条命令安装
      link: /zh/guide/installation
    - theme: alt
      text: 查看全部产品
      link: /zh/guide/products

---

<div class="home-shell">
  <section class="home-panel download-panel">
    <div>
      <p class="accent-kicker">安装</p>
      <h2>一条命令先把整套能力准备好</h2>
      <p>安装主插件一次即可。它会自动创建本地 memory 目录、自动补齐 <code>bamdra-user-bind</code>，并把 <code>bamdra-memory-vector</code> 一起放到本地，让完整记忆栈立即可用。</p>
      <div class="language-bash vp-adaptive-theme">
        <pre class="shiki shiki-themes github-light github-dark vp-code"><code><span class="line">openclaw plugins install @bamdra/bamdra-openclaw-memory</span></code></pre>
      </div>
    </div>
    <div class="inline-actions">
      <a class="contact-link" href="/zh/guide/installation">查看安装指南</a>
      <a class="contact-link" href="/zh/guide/architecture">查看架构图</a>
      <a class="contact-link" href="/zh/guide/downloads">下载正式发布包</a>
    </div>
  </section>

  <section class="home-panel">
    <div class="story-band">
      <p class="accent-kicker">竹蜻蜓的隐喻</p>
      <h2>Bamdra 之所以叫竹蜻蜓，是因为它不是脱离人的飞行器，而是由人的意志托举而起，并最终回到人间的器物。</h2>
      <p>竹蜻蜓之所以能起飞，是因为人的手给了它动力。飞起来之后，它能看得更远、抵达更高的视角；但它的意义并不在于脱离人，而在于带着更广阔的视野重新回到人的手中。我们对 AI 的理解也是如此：它应当由人的目标发起，由机器能力放大，并最终回到人的判断、人的责任与人的创造之内。</p>
    </div>
    <h2>为什么现在需要 Bamdra</h2>
    <div class="signal-grid">
      <div class="signal-item">
        <strong>OpenClaw</strong>
        <span>围绕 OpenClaw 的真实使用链路打造，产品定位清晰，不做泛泛的概念包装。</span>
      </div>
      <div class="signal-item">
        <strong>SQLite</strong>
        <span>默认即可落地，部署轻量，持久化可控，适合从个人到团队的连续使用。</span>
      </div>
      <div class="signal-item">
        <strong>工作流重塑</strong>
        <span>真正有价值的不是“AI 能做什么”，而是它是否改变了团队每天协作、记录和延续工作的方式。</span>
      </div>
      <div class="signal-item">
        <strong>回到人手中</strong>
        <span>AI 可以飞得更高、更远，但最终仍要回到人的目标、人的判断和人的责任之中。</span>
      </div>
    </div>
  </section>

  <section class="home-panel">
    <div class="section-heading">
      <p class="accent-kicker">产品套件</p>
      <h2>三个插件，共同组成一套 continuity-first 记忆系统</h2>
      <p>Bamdra 现在以 3 个公开插件组成套件发布。它们都可以独立运行，而主记忆插件在安装时也会自动补齐身份插件，并把向量插件一并准备好。</p>
    </div>
    <div class="signal-grid">
      <div class="signal-item">
        <strong>bamdra-openclaw-memory</strong>
        <span>主记忆运行时，负责话题连续性、上下文装配、事实存储和长会话恢复。</span>
      </div>
      <div class="signal-item">
        <strong>bamdra-user-bind</strong>
        <span>身份与画像插件，负责把原始 channel 身份转换成稳定用户边界。它可以独立运行，也可以在安装主记忆插件时被自动补齐。</span>
      </div>
      <div class="signal-item">
        <strong>bamdra-memory-vector</strong>
        <span>语义召回与知识库层。安装主插件时会一起落到本地，让本地 Markdown 知识库能直接进入召回链路。</span>
      </div>
      <div class="signal-item">
        <strong>为什么要拆分</strong>
        <span>分仓库、分 npm 包、分发布职责之后，安装逻辑更清晰，安全边界更可靠，后续迭代也更容易管理。</span>
      </div>
    </div>
  </section>

  <section class="home-panel product-card">
    <div class="product-copy">
      <p class="accent-kicker">主入口插件</p>
      <h2>bamdra-openclaw-memory 是这套产品的主入口</h2>
      <p>bamdra-openclaw-memory 面向 OpenClaw 提供长期记忆能力。它能够分离话题分支、保存稳定事实、刷新摘要，并把当前上下文控制在更适合生产环境的体量里，让智能体在长会话中真正具备连续性。</p>
      <p><code>bamdra-openclaw-memory</code> 本身可以独立运行。通过 npm 安装时，如果本地 OpenClaw 扩展目录里还没有 <code>bamdra-user-bind</code>，主插件会自动把这个依赖补齐进去。</p>
      <p><code>bamdra-memory-vector</code> 现在也会被自动放到本地，因此一次安装就能同时获得话题连续性、用户画像感知和可维护知识库这三条能力线。</p>
      <div class="inline-actions">
        <a class="contact-link" href="/zh/guide/products">查看全部产品</a>
        <a class="contact-link" href="/zh/guide/architecture">查看架构图</a>
        <a class="contact-link" href="https://github.com/bamdra">访问 GitHub 首页</a>
      </div>
    </div>
    <div class="product-meta">
      <ul>
        <li><span>仓库地址</span><strong>bamdra/bamdra-openclaw-memory</strong></li>
        <li><span>核心价值</span><strong>连续性不依赖 prompt 堆叠</strong></li>
        <li><span>自动配套</span><strong>bamdra-user-bind</strong></li>
        <li><span>知识库层</span><strong>bamdra-memory-vector</strong></li>
        <li><span>部署方式</span><strong>SQLite + 可编辑 Markdown 知识库</strong></li>
      </ul>
    </div>
  </section>

  <section class="home-panel home-columns">
    <div class="info-card">
      <p class="accent-kicker">适用场景</p>
      <h3>不是实验，而是工作中的协作能力</h3>
      <ul class="clean-list">
        <li>产品与运营团队在多任务切换中保持上下文连续。</li>
        <li>开发协作中长期保留约束、路径、环境信息与决策记录。</li>
        <li>知识工作流里让稳定事实、私有笔记和共享文档跨中断、跨重启继续发挥作用。</li>
      </ul>
    </div>
    <div class="info-card">
      <p class="accent-kicker">它改变什么</p>
      <h3>不只是部署成功，而是工作方式开始变化</h3>
      <ul class="clean-list">
        <li>团队不必在每次回到旧任务时重讲一遍背景。</li>
        <li>中断、切题和重启不再天然意味着上下文断裂。</li>
        <li>偏好、路径、约束、决策和知识文件能够在更长的工作周期里持续发挥作用。</li>
      </ul>
    </div>
  </section>

  <section class="home-panel download-panel">
    <div>
      <p class="accent-kicker">立即开始</p>
      <h2>下载当前发布版本</h2>
      <p>如果环境支持，优先使用一条命令安装；否则再从正式 release 包开始，按真实方式接入 OpenClaw。</p>
    </div>
    <div class="inline-actions">
      <a class="contact-link" href="/zh/guide/installation">一键安装</a>
      <a class="contact-link" href="/zh/guide/downloads">进入下载中心</a>
    </div>
  </section>
</div>
