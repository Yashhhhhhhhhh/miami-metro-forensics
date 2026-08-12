# Playroom For Two

A static, GitHub Pages-ready two-player game website for couples. It includes seven playable modes, animated graphics, local stats, sound effects, responsive layouts, and optional live room codes for two-device play.

## Games

- Same Brain
- Word Rush
- Memory Match
- Reflex Duel
- Color Snap
- Story Sparks
- Doodle Pass

## Play Locally

Open `index.html` directly, or run a tiny local server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Play Together After GitHub Push

1. Publish the repo with GitHub Pages.
2. Send her the GitHub Pages URL.
3. For same-screen play, open the site on one device and start any game.
4. For two-device live play, you create a room, send her the 4 digit code, and she joins from the same site.

Live play uses PeerJS over WebRTC. It needs internet access and works best when both browsers allow normal HTTPS connections.
