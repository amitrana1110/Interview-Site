# Frontend Lab — Interview preparation

A Next.js static app with 200 interview questions across JavaScript, React, HTML, and Backend, plus 45 interactive labs.

## Run

Use Node.js 20.9 or newer.

```sh
npm install
npm run dev
npm run test:visualizations
npm run build
```

The production export is in `out/`. Serve that directory with any static host. URL fragments support direct entry, for example `#concept/event-loop`, `#backend`, and `#backend-concepts`. Bookmarks, theme, and mastered questions stay in localStorage.

## Reference visualization behavior

All 37 topics from the VisualizeJS [JavaScript](https://visualizejs.com/javascript/event-loop), [React](https://visualizejs.com/react/virtual-dom), and [Backend](https://visualizejs.com/backend) sections use observed-state replay. The 112 built-in examples contain 1,015 states and 903 transitions, captured by playing and stepping through the reference site.

The replay preserves each example's source sample, panel names and geometry, intermediate values, code highlights, and active styles. Controls include Play/Pause, step backward/forward, reset, seeking, example selection, and playback speed. Default playback advances every 1,200 ms. Narrow screens stack the panels.

- `app/BehaviorPlayer.jsx`: shared replay renderer and controls.
- `public/behavior/*.json`: lazy-loaded topic recordings; no remote runtime dependency.
- `app/behavior-manifest.json`: provenance, counts, and file checksums.
- `app/reference-layouts.json`: reference URLs, examples, and panel headings.
- `verification/*.json`: browser comparison results for every topic.
- `scripts/capture-reference-behavior.mjs`: capture helper used through the controlled browser session.
- `scripts/verify-browser-behavior.mjs`: browser comparison of every step's text, active styles, and controls.

These are replays of observed checkpoints, not instrumentation of a JavaScript engine, React scheduler, database, or server. They reproduce the built-in demonstrations; they do not execute arbitrary edits or reproduce every animation subframe. Explanatory captions are authored for this project.

## Event-loop sandbox

Try Sandbox opens an editor initialized with the reference example. Acorn parses up to 25 lines / 1,000 characters. A bounded interpreter supports logging, timers, microtasks, promises, async/await, bindings, and simple functions. Unsupported syntax is reported. It does not use eval or expose browser globals. Custom sandbox programs use this interpreter rather than reference recordings.

`app/event-loop-sandbox.js` contains the interpreter. `app/MatchedLab.jsx` renders its generated traces. The older authored trace modules remain for sandbox and teaching helpers.

## Content and verification

Question content lives in `app/questions.js`, `app/extra-questions.json`, and `app/backend-questions.js`. The concept catalog is in `app/concepts.js` and `app/visual-concepts.js`; routing is in `app/Labs.jsx` and study pages in `app/StudyPages.jsx`.

`npm run test:visualizations` verifies all recording checksums, 112 example menus, 1,015 scene states, safe scene trees, active-line metadata, and sandbox scheduling/limit cases. Browser checks additionally compare rendered panel text and active visual styles for every state and exercise step, seek, reset, and boundary controls.

The original extra labs use actual browser features where appropriate. Backend demonstrations do not contact services or generate usable credentials. The storage demo writes only its dedicated experiment key.
