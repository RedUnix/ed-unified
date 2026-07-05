// ==UserScript==
// @name         ED Unified - Add to Library
// @namespace    ed-unified-app
// @version      1.1.0
// @description  Send the current page (or an EDCodex tool entry) to ED Unified as a bookmark
// @match        https://edcodex.info/*
// @match        https://*/*
// @match        http://*/*
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

;(function () {
  'use strict'

  const SOCIAL_LINK_HOSTS = ['discord.gg', 'discord.com', 'twitter.com', 'x.com', 'facebook.com', 'reddit.com']

  function sendToApp(payload) {
    const params = new URLSearchParams()
    params.set('name', payload.name)
    params.set('url', payload.url)
    if (payload.icon) params.set('icon', payload.icon)
    if (payload.description) params.set('description', payload.description)
    for (const category of payload.categories || []) params.append('category', category)
    window.location.href = `edtoolapp://import-bookmark?${params.toString()}`
  }

  function isEdcodexToolPage() {
    return (
      window.location.hostname.replace(/^www\./, '') === 'edcodex.info' &&
      /(?:^|[?&])m=tools(?:&|$)/.test(window.location.search) &&
      /(?:^|[?&])entry=/.test(window.location.search)
    )
  }

  // Only web-app tools become bookmarks in ED Unified; native Windows/Mac/
  // Linux tools are added to the Library as filesystem tools instead (via the
  // app's own "Add Tool" flow, not this userscript), so the link shouldn't
  // appear on those pages at all.
  function isWebApplicationTool(entry) {
    const platform = entry.querySelector('span.lang[itemprop="operatingSystem"]')?.textContent?.trim() ?? ''
    return platform.toLowerCase() === 'web application'
  }

  function pickEdcodexHomepageLink(entry) {
    const links = Array.from(entry.querySelectorAll('ul.links li a[itemprop="url"]'))
    const nonSocial = links.filter((a) => {
      try {
        const host = new URL(a.href).hostname.replace(/^www\./, '')
        return !SOCIAL_LINK_HOSTS.includes(host)
      } catch {
        return false
      }
    })
    const name = entry.querySelector('h1[itemprop="name"]')?.textContent?.trim() ?? ''
    const nameMatch = nonSocial.find((a) => a.textContent.trim().toLowerCase() === name.toLowerCase())
    return (nameMatch ?? nonSocial[0] ?? links[0])?.href
  }

  function extractEdcodexEntry() {
    const entry = document.querySelector('.entry')
    if (!entry) return null

    const name = entry.querySelector('h1[itemprop="name"]')?.textContent?.trim()
    if (!name) return null

    const categories = Array.from(entry.querySelectorAll('ul.categories li a')).map((a) => a.textContent.trim())
    const logoImg = entry.querySelector('ul.images li img[alt="Logo"]') ?? entry.querySelector('ul.images li img')
    const icon = logoImg ? logoImg.src : undefined
    const url = pickEdcodexHomepageLink(entry) ?? window.location.href
    // Prefer the short summary (matches the tools-list blurb) over the long
    // description body, same preference order as the server-side importer.
    const shortDescription = entry.querySelector('.content.pan')?.textContent?.trim()
    const longDescription = entry.querySelector('.content[itemprop="description"]')?.textContent?.trim()
    const description = shortDescription || longDescription

    return { name, url, icon, description, categories }
  }

  // Inserts a real <li><span>...</span> <a>...</a></li> into the page's own
  // <ul class="links"> so it renders and is styled exactly like the site's other
  // link entries, instead of a floating overlay that can end up hidden/covered.
  function injectEdcodexLink() {
    const entry = document.querySelector('.entry')
    if (!entry) return
    if (!isWebApplicationTool(entry)) return

    if (entry.querySelector('#ed-unified-add-link')) return // already injected

    let linksList = entry.querySelector('ul.links')
    if (!linksList) {
      linksList = document.createElement('ul')
      linksList.className = 'links'
      const anchor = entry.querySelector('ul.images') ?? entry.querySelector('ul.categories')
      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(linksList, anchor.nextSibling)
      } else {
        entry.appendChild(linksList)
      }
    }

    const li = document.createElement('li')
    const label = document.createElement('span')
    label.textContent = 'ED Unified'
    const link = document.createElement('a')
    link.id = 'ed-unified-add-link'
    link.href = '#'
    link.textContent = 'Add to ED Unified'
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const data = extractEdcodexEntry()
      if (!data) {
        window.alert('Could not read this EDCodex entry.')
        return
      }
      sendToApp(data)
    })

    li.appendChild(label)
    li.appendChild(document.createTextNode(' '))
    li.appendChild(link)
    linksList.appendChild(li)
  }

  function extractGenericPage() {
    const favicon =
      document.querySelector('link[rel~="icon"]')?.href ?? new URL('/favicon.ico', window.location.origin).href
    return { name: document.title || window.location.hostname, url: window.location.href, icon: favicon }
  }

  if (isEdcodexToolPage()) {
    injectEdcodexLink()
  }

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Add to ED Unified', () => sendToApp(extractGenericPage()))
  }
})()
