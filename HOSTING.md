# Multiplayer hosting

Use Node 22+. Run `npm install`, `npm run build`, then `npm start`. Open http://localhost:3001. The server serves the game and room API together. Set `PORT` to change the port.

For development run `npm run server` and `npm run dev` in separate terminals. Vite forwards API calls to port 3001.

For internet play host this entire project on a Node or Docker host. Build: `npm install && npm run build`. Start: `npm start`. Use HTTPS and one server instance. A Dockerfile is included. Share the hosted URL and room code. Uploading only `dist/` to static hosting does not support multiplayer.

On the same Wi-Fi, friends can visit `http://YOUR_COMPUTER_LAN_IP:3001` after a production build, if the firewall allows connections.

Click Play with friends, enter a name and create a room. Friends enter unique names and the six-character code. Two to four people can play. Everyone places bets and presses Ready; bets lock, and the server rolls when everyone is ready. Everyone gets a result popup, then presses Ready for next round.

Refreshing the same tab restores its seat. After 25 seconds without contact a player becomes offline and loses Ready status. The host can remove offline seats between rolls. Hosting transfers to an online player when the host disconnects, or to the next player when the host leaves. Inactive rooms expire after ten minutes.

Rooms and multiplayer balances are in server memory and reset on restart/deployment. This version requires one server instance. Shared persistent storage is needed for multiple instances or durable rooms. State synchronizes about once per second. Solo balances stay in local storage; room session credentials stay in session storage.

Run `npm test` for payout and multiplayer tests. Run `npm run build` for the frontend build.
