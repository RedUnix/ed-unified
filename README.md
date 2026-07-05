# ED Unified

A Windows-first desktop app that unifies browsing, bookmarking, installing, and launching Elite: Dangerous third-party tools -- so you never need to leave it for your regular web browser.

Browse and bookmark EDCodex tools, launch filesystem programs, chain everything (game + companion apps) into one launch sequence, and theme every embedded site with an Elite Dangerous-inspired HUD look, all from a single app.

## Features

- **Unified library** -- bookmarks and filesystem tools live side by side in one grid, drag-and-drop to reorder, organized by category.
- **In-app browsing** -- embedded sites open as tabs inside the app (with back/forward navigation), never in your OS browser.
- **One-click EDCodex import** -- paste an EDCodex tool URL, or click "Add to ED Unified" directly on an EDCodex tool page while browsing it inside the app, and the name, description, categories, and icon all come across automatically.
- **Launch sequences** -- chain a game launch (Steam/Epic/direct) with companion tools and custom delays, then generate a `.bat` file or run it straight from the app.
- **Auto dark theming** -- per-site brightness/contrast/sepia controls with a smart auto-invert for bright pages, plus legacy one-click presets.
- **Custom library background** -- set your own background image with adjustable opacity behind the library grid.
- **Built-in ad/tracker blocking** for embedded tabs.
- **Fully customizable theme colors** and a collapsible sidebar.
- **Fullscreen/borderless mode** for a clean, distraction-free layout.

## Screenshots

### Library
![Library](Screenshots/Library.png)

### Import from EDCodex
![Import from EDCodex](<Screenshots/import from edcodex.png>)

### Add to ED Unified directly from an EDCodex tool page, with per-site dark theming
![Add to ED Unified and dark mode theming](<Screenshots/add to edu and darkmode theme.png>)

### Add / edit bookmarks
![Add bookmark](<Screenshots/add bookmark.png>)
![Edit bookmark](Screenshots/editbookmark.png)

### Add a filesystem tool
![Add tool](<Screenshots/add tool.png>)

### Launch sequences
![New launch sequence](<Screenshots/new launch sequence.png>)
![Edit launch sequence](<Screenshots/edit launch sequence.png>)

### Settings
![Settings](Screenshots/settings.png)

## Getting Started

### Download

Grab the latest Windows installer from the [Releases](../../releases) page.

### Build from source

Requires [Node.js](https://nodejs.org) 20+.

```sh
npm install
npm run dev          # run in development
npm run build:win    # build the Windows installer (release/)
```

## Tech Stack

Electron, React, TypeScript, and [lowdb](https://github.com/typicode/lowdb) for local storage -- no backend, no account, no telemetry. All data lives on your machine.

## License

[MIT](LICENSE)
