# GM Tech Snow Tracker

Live snow-event tracker for the five GM Tech Center parking decks: Super Sack usage,
lower/top level plow, material, doors and gate status, and crew assignments.

## What's in here

- `public/index.html` - the app
- `netlify/functions/api.mjs` - saves and loads data (Netlify Blobs storage, built in to Netlify)
- `netlify.toml`, `package.json` - Netlify settings

Every open phone or computer checks for updates every 4 seconds, so everyone sees the same board.
The employee list starts with: Aaron, Greg T, Jamie P, Justin G, Nancy A, Patrick G, Scott B, Vinny S.

## Deploy with the Netlify CLI

1. Install Node.js (nodejs.org), then open a terminal in this folder.
2. `npm install`
3. `npm install -g netlify-cli`
4. `netlify login`
5. `netlify deploy --prod` (choose "Create & configure a new project" the first time)

## Deploy with GitHub

1. Put this folder in a new GitHub repository.
2. In Netlify: Add new project > Import an existing project > pick the repo.
3. Leave the build settings as they are (they come from netlify.toml) and deploy.

Note: Netlify's drag-and-drop upload does not run the data function, so the app would
open in "Offline" mode with sample data. Use the CLI or GitHub.

## Access

There is no password. Anyone with the site link can view and change the board.
