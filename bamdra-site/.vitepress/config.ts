import { defineConfig } from 'vitepress'

const siteUrl = 'https://www.bamdra.com'
const repoUrl = 'https://github.com/bamdra'
const ogImage = `${siteUrl}/og-cover.png`

export default defineConfig({
  lang: 'en',
  title: 'Bamdra',
  description: 'Bamdra imagines AI that enters real work, expands human reach, and helps reshape everyday workflows. bamdra-openclaw-memory brings durable memory to OpenClaw.',
  srcDir: '.',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: siteUrl
  },
  head: [
    [
      'script',
      {},
      "document.documentElement.classList.add('dark');try{localStorage.setItem('vitepress-theme-appearance','dark')}catch(e){}"
    ],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo-mark-static.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Outfit:wght@400;500;600;700;800&display=swap' }],
    ['meta', { name: 'theme-color', content: '#090b12' }],
    ['meta', { name: 'keywords', content: 'Bamdra, 竹蜻蜓, AI应用, OpenClaw, AI memory, topic memory, context assembly, durable memory, agent memory' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Bamdra' }],
    ['meta', { property: 'og:title', content: 'Bamdra | AI that belongs in real work' }],
    ['meta', { property: 'og:description', content: 'Bamdra is building AI that enters real scenarios, changes how work gets done, and helps OpenClaw remember what matters.' }],
    ['meta', { property: 'og:url', content: siteUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Bamdra | AI that belongs in real work' }],
    ['meta', { name: 'twitter:description', content: 'Explore bamdra-openclaw-memory and the Bamdra vision for AI that reshapes real workflows.' }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['script', { src: '/interaction.js', defer: 'true' }],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Bamdra',
        alternateName: '竹蜻蜓',
        url: siteUrl,
        logo: `${siteUrl}/logo-static.svg`,
        sameAs: [repoUrl]
      })
    ],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Bamdra OpenClaw Plugin Suite',
        url: siteUrl,
        itemListElement: [
          {
            '@type': 'SoftwareApplication',
            name: 'bamdra-openclaw-memory',
            url: 'https://github.com/bamdra/bamdra-openclaw-memory'
          },
          {
            '@type': 'SoftwareApplication',
            name: 'bamdra-user-bind',
            url: 'https://github.com/bamdra/bamdra-user-bind'
          },
          {
            '@type': 'SoftwareApplication',
            name: 'bamdra-memory-vector',
            url: 'https://github.com/bamdra/bamdra-memory-vector'
          }
        ]
      })
    ]
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Products', link: '/guide/products' },
          { text: 'Downloads', link: '/guide/downloads' },
          { text: 'Contact', link: '/contact' },
          { text: 'GitHub', link: repoUrl }
        ],
        sidebar: [
          {
            text: 'Bamdra',
            items: [
              { text: 'What Is Bamdra', link: '/guide/what-is-bamdra' }
            ]
          },
          {
            text: 'Products',
            items: [
              { text: 'Suite Overview', link: '/guide/products' },
              { text: 'Architecture', link: '/guide/architecture' },
              { text: 'bamdra-openclaw-memory', link: '/guide/openclaw-topic-memory' },
              { text: 'bamdra-user-bind', link: '/guide/user-bind' },
              { text: 'bamdra-memory-vector', link: '/guide/memory-vector' }
            ]
          },
          {
            text: 'Use And Install',
            items: [
              { text: 'Installation', link: '/guide/installation' },
              { text: 'Upgrade Skill', link: '/guide/upgrade-operator' },
              { text: 'Usage', link: '/guide/usage' },
              { text: 'Best Practices', link: '/guide/best-practices' },
              { text: 'FAQ', link: '/guide/faq' },
              { text: 'Downloads', link: '/guide/downloads' }
            ]
          }
        ],
        outline: {
          level: [2, 3],
          label: 'On this page'
        },
        docFooter: {
          prev: 'Previous',
          next: 'Next'
        }
      }
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '产品', link: '/zh/guide/products' },
          { text: '下载', link: '/zh/guide/downloads' },
          { text: '联系我', link: '/zh/contact' },
          { text: 'GitHub', link: repoUrl }
        ],
        sidebar: [
          {
            text: 'Bamdra',
            items: [
              { text: '什么是 Bamdra', link: '/zh/guide/what-is-bamdra' }
            ]
          },
          {
            text: '产品',
            items: [
              { text: '套件总览', link: '/zh/guide/products' },
              { text: '架构图', link: '/zh/guide/architecture' },
              { text: 'bamdra-openclaw-memory', link: '/zh/guide/openclaw-topic-memory' },
              { text: 'bamdra-user-bind', link: '/zh/guide/user-bind' },
              { text: 'bamdra-memory-vector', link: '/zh/guide/memory-vector' }
            ]
          },
          {
            text: '安装与使用',
            items: [
              { text: '安装部署', link: '/zh/guide/installation' },
              { text: '升级 Skill', link: '/zh/guide/upgrade-operator' },
              { text: '使用方式', link: '/zh/guide/usage' },
              { text: '最佳实践', link: '/zh/guide/best-practices' },
              { text: '常见问题', link: '/zh/guide/faq' },
              { text: '下载资源', link: '/zh/guide/downloads' }
            ]
          }
        ],
        outline: {
          level: [2, 3],
          label: '本页导航'
        },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        }
      }
    }
  },
  themeConfig: {
    logo: '/logo-mark-static.svg',
    siteTitle: 'Bamdra',
    appearance: false,
    socialLinks: [
      { icon: 'github', link: repoUrl }
    ],
    search: {
      provider: 'local'
    },
    footer: {
      message: 'AI becomes meaningful when it returns to real work, real decisions, and real people.',
      copyright:
        '© 2026 Bamdra. All rights reserved. <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">苏ICP备18058082号-1</a>'
    }
  }
})
