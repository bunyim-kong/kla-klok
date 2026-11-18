# Kla Klok

A responsive Khmer dice game with virtual riel. Built with React and Vite, with a Node server for 2–4-player rooms. See [HOSTING.md](HOSTING.md) for room rules, development commands, and deployment.

Run `npm install`, then `npm run dev`. Run `npm test` for payout tests and `npm run build` to produce `dist/` for static hosting.

Place chips on symbols and shake the bowl. A matching symbol returns the original stake plus one stake per matching die. Solo results use rejection-sampled Web Crypto values; multiplayer rolls and balances are controlled by the server. Solo balance is saved locally. Transparent SVG symbols, CSS bowl animation, sound, and result popups are included. It does not yet include 3D physics, offline installation, or full Khmer translation.
