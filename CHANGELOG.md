# Changelog

## v0.3.0

### Added

- **Find in page (Ctrl+F)** for website tabs: a find bar with match counts and previous/next navigation. Works whether keyboard focus is in the app shell or inside the embedded site (Escape closes it from either side).
- **New tab with URL bar**: a "+" button in the tab strip opens a blank tab with an address bar at the top. Type a URL (or a search query) to browse anywhere; the blank tab uses your library background image and opacity as its default page. Tabs opened from links inside embedded sites now get the URL bar too.
- **Launch overlay**: launching a filesystem tool now shows a small boot-screen-styled "Launching <tool name>" overlay that fades out on its own.
- **[ED Tools](https://ed.tools/)** is now part of the default library. Existing installs get it added once automatically (skipped if you already bookmarked it).
- **Linux support**: an AppImage build (`npm run build:linux`), with tool launching wired up for Linux paths and protocol URLs. Launch-sequence `.bat` generation remains Windows-only.

## v0.2.0

### Fixed

- JavaScript dialogs (`alert()` / `confirm()`) triggered by embedded tool sites no longer silently fail to appear. Tool tabs render in an Electron `WebContentsView`, which isn't owned by a `BrowserWindow` the normal way -- Electron can't find a parent window to anchor the native dialog to, so it dropped the call entirely instead of showing anything. Dialogs are now routed through the main process and shown anchored to the app window.
- **Known Electron limitation:** `window.prompt()` can't be fixed the same way. Electron deliberately never implements it -- calling it always throws "prompt() is not supported," in every version, and this cannot be intercepted or overridden by any preload or page script. Third-party tool sites that call `prompt()` directly (rather than building their own in-page modal) for things like naming a saved ship build will still not get a native input box inside this app. In practice this is a narrow gap: most modern ED tool sites (EDSY included) implement their own custom modal for save/name flows rather than relying on the raw browser `prompt()` API, so this only affects sites that lean on that specific API.

### Added

- Right-click a tab to copy its URL to the clipboard, with a "Copied!" bubble that floats up from the tab.
- Automatic update checking: on launch, the app checks the latest GitHub release and shows a dismissible "Update available" toast in the top-right corner while viewing the Library, plus a persistent reminder in the sidebar. A manual "Check for Updates" button was also added to Settings.

## v0.1.0

First release. See README for feature overview and screenshots.
