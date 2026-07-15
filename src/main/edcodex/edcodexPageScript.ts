import { PROTOCOL_SCHEME } from '../protocol/protocolHandler'

/**
 * Injected into every embedded tab on `did-finish-load` (cheap no-op on any
 * page that isn't an EDCodex tool page). Adds an "Add to ED Unified" link
 * directly into the page's own `<ul class="links">`, matching its native
 * markup. Web-application entries import as bookmarks (full payload extracted
 * from the DOM); Windows-platform entries import as filesystem tools (just
 * the entry id + logo URL -- the app fetches the rest from the EDCodex JSON
 * API and instructs the user to install + "Locate Program...").
 *
 * Runs entirely in-app: clicking the link navigates to an `edtoolapp://`
 * URL that WebContentsViewManager's `will-navigate` handler intercepts and
 * resolves internally, so no external browser or userscript manager is
 * involved -- this replaces the original browser-userscript design, which
 * only ever worked for pages visited in the user's own separate browser, not
 * pages embedded inside this app.
 *
 * NOTE: userscript/ed-unified-app.user.js is the standalone-browser twin of
 * this script -- selector or payload changes must be mirrored there.
 */
export function buildEdcodexPageScript(): string {
  return `(() => {
    if (window.__edUnifiedInjected) return;
    window.__edUnifiedInjected = true;

    const SOCIAL_LINK_HOSTS = ['discord.gg', 'discord.com', 'twitter.com', 'x.com', 'facebook.com', 'reddit.com'];

    function isEdcodexToolPage() {
      return /(?:^|[?&])m=tools(?:&|$)/.test(location.search) && /(?:^|[?&])entry=/.test(location.search);
    }
    if (!isEdcodexToolPage()) return;

    const entry = document.querySelector('.entry');
    if (!entry) return;

    const platform = entry.querySelector('span.lang[itemprop="operatingSystem"]')?.textContent?.trim() ?? '';
    const isWebApp = platform.toLowerCase() === 'web application';
    const isWindows = !isWebApp && /\\bwin/i.test(platform);
    if (!isWebApp && !isWindows) return;

    if (entry.querySelector('#ed-unified-add-link')) return;

    function pickHomepageLink() {
      const links = Array.from(entry.querySelectorAll('ul.links li a[itemprop="url"]'));
      const nonSocial = links.filter((a) => {
        try {
          const host = new URL(a.href).hostname.replace(/^www\\./, '');
          return !SOCIAL_LINK_HOSTS.includes(host);
        } catch {
          return false;
        }
      });
      const name = entry.querySelector('h1[itemprop="name"]')?.textContent?.trim() ?? '';
      const nameMatch = nonSocial.find((a) => a.textContent.trim().toLowerCase() === name.toLowerCase());
      return (nameMatch ?? nonSocial[0] ?? links[0])?.href;
    }

    function sendToApp() {
      const name = entry.querySelector('h1[itemprop="name"]')?.textContent?.trim();
      if (!name) {
        window.alert('Could not read this EDCodex entry.');
        return;
      }
      const categories = Array.from(entry.querySelectorAll('ul.categories li a')).map((a) => a.textContent.trim());
      const logoImg = entry.querySelector('ul.images li img[alt="Logo"]') ?? entry.querySelector('ul.images li img');
      const icon = logoImg ? logoImg.src : undefined;
      const url = pickHomepageLink() ?? location.href;
      // Prefer the short summary (matches the tools-list blurb) over the long
      // description body, same preference order as the server-side importer.
      const shortDescription = entry.querySelector('.content.pan')?.textContent?.trim();
      const longDescription = entry.querySelector('.content[itemprop="description"]')?.textContent?.trim();
      const description = shortDescription || longDescription;

      const params = new URLSearchParams();
      params.set('name', name);
      params.set('url', url);
      if (icon) params.set('icon', icon);
      if (description) params.set('description', description);
      for (const category of categories) params.append('category', category);
      location.href = '${PROTOCOL_SCHEME}://import-bookmark?' + params.toString();
    }

    function sendToolToApp() {
      const entryId = new URLSearchParams(location.search).get('entry');
      if (!entryId) return false;
      const logoImg = entry.querySelector('ul.images li img[alt="Logo"]') ?? entry.querySelector('ul.images li img');
      const params = new URLSearchParams();
      params.set('entry', entryId);
      if (logoImg) params.set('icon', logoImg.src);
      location.href = '${PROTOCOL_SCHEME}://import-tool?' + params.toString();
      return true;
    }

    let linksList = entry.querySelector('ul.links');
    if (!linksList) {
      linksList = document.createElement('ul');
      linksList.className = 'links';
      const anchor = entry.querySelector('ul.images') ?? entry.querySelector('ul.categories');
      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(linksList, anchor.nextSibling);
      } else {
        entry.appendChild(linksList);
      }
    }

    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = 'ED Unified';
    const link = document.createElement('a');
    link.id = 'ed-unified-add-link';
    link.href = '#';
    link.textContent = 'Add to ED Unified';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (isWindows) {
        if (sendToolToApp()) link.textContent = 'Sent to ED Unified \\u2713';
        return;
      }
      sendToApp();
    });

    li.appendChild(label);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(link);
    linksList.appendChild(li);
  })();`
}
