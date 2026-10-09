# zsho.ot

A photography portfolio for Yeah Jing Ze. React, TypeScript and Vite; Node.js runs the development tools. Booking features are on hold.

## Run and edit

On this Mac, double-click **Start Portfolio.command** in Finder to launch the site and editor. It opens Terminal and automatically opens your browser once the server is ready. Opening the file inside VS Code only displays its source; you can also run `./"Start Portfolio.command"` in the VS Code terminal. A verified Node.js runtime is included locally under ignored `.tools/` so no system installation is needed. Keep the terminal open.

On another computer, install Node.js 22 LTS or newer, then run these commands in this folder:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal (usually http://127.0.0.1:5173).
Open **http://127.0.0.1:5173/edit** for the content editor. You can:

- Add or replace photos, edit titles and descriptions, reorder the gallery and choose the cover image.
- Add Instagram reel links or upload MP4/WebM videos (up to 64 MB). Videos appear one at a time in a horizontal carousel with navigation arrows when there is more than one. Visitors can swipe or use arrow keys to browse.
- Choose a gallery photo for a video cover, upload a JPG/PNG/WebP from Finder, or click **Get Instagram cover** after entering a public reel link. Instagram imports use the public page’s cover metadata when available, and keep your current cover when retrieval fails. Covers are saved under `public/covers/` and deploy with the website; no Instagram credentials are required. On macOS, importing uses the built-in `/usr/bin/curl` for system networking support; other systems use Node’s networking. Finder uploads use `public/photos/`.
- Update your introduction, biography, equipment and experience.

Click **Save changes**, then refresh the portfolio. Changes save to `public/content.json`; uploads save under `public/photos/` or `public/videos/`. The editor runs only on the local development server and is unavailable on the published site. Keep the terminal open while editing. Uploaded files are not automatically compressed; resize large images before uploading. Use Git to publish saved changes. Removed gallery entries do not delete their media files.

The initial gallery includes 14 photographs. `photo/IMG_8183.JPG` appeared black in its preview and was omitted; the original remains intact. Gallery titles and categories are editable starting points. The About section uses Jing Ze’s portrait at `public/photos/me.JPG`.

## Storage

Instagram-linked videos play on Instagram and are not stored in this project. Imported or uploaded covers are stored with the website and use hosting storage and bandwidth. Importing the same Instagram image again reuses its file. Full uploaded videos deploy as files and consume much more storage and bandwidth. Resize large cover images before uploading. Actual allowances depend on your chosen hosting service.

## Build

```sh
npm run build
npm run preview
```

The production site is in `dist/`. It can be served by any static host. Set the build command to `npm run build` and the publish directory to `dist`. Paths are relative, so subdirectory hosting is supported. Fonts come from Google Fonts, with local system font fallbacks.

## Checks

Run `npm test` for cover retrieval validation and `npm run build` for TypeScript and production checks.

## GitHub

The remote is https://github.com/JzeAnson/zsho.ot.git. To publish source updates after checking your changes:

```sh
git add .
git commit -m "Update portfolio"
git push -u origin main
```

Original photos, the original logo directory and the PDF are ignored. Web copies in `public/` are tracked. The repository does not publish a website by itself; connect a static host to it, or configure GitHub Pages. No credentials or tokens belong in this repository.
