# Changelog

## v0.4.0

### Added

- **One-click tool install from EDCodex**: the "Add to ED Unified" button now also appears on Windows-platform EDCodex entries (both inside the app and via the browser userscript, updated to v1.2.0). Clicking it imports the tool's name, description, categories, and icon automatically via the EDCodex JSON API and creates a library card immediately; a modal then walks you through downloading the program and linking it with the card's "Locate Program..." button, including an "Open Download Page" shortcut to the entry's homepage/source link. Web-application entries keep the existing bookmark import. If the tool is already in your library, clicking the button again tells you so instead of creating a duplicate.
- **Download manager**: files downloaded from embedded sites now save straight to your Downloads folder and appear in a new Downloads section in the sidebar (under Launch Sequences, with an active-download badge). Each download shows live progress, speed, ETA, and destination folder (click it to reveal the file), can be cancelled, and has a "Launch when done" toggle that opens the file automatically once it finishes -- handy for tool installers grabbed via the new EDCodex install flow.

## v0.3.1

### Added

- **Library filters**: filter the grid by item type (All / Bookmarks / Tools) and by category. Drag-and-drop reordering still works while filtered.
- **Edit filesystem tools**: tool cards now have an Edit button opening the same form as Add Tool (name, description, category, program path, icon), with Delete moved into the edit dialog to match bookmarks.
- **Local file icons for bookmarks**: the bookmark form now accepts either an icon URL or a local image file (local file wins if both are set).

### Fixed

- The ED Tools bookmark now ships with a bundled icon -- ed.tools blocks the favicon fetch the app fell back to, leaving the entry iconless. Existing installs get the icon attached automatically (unless you already set one).
- The Add Bookmark button now matches the styling of the other library toolbar buttons.

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
