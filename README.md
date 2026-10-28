# Floor Planner 3D

A one-floor apartment planner in the browser: draw walls, place furniture at real sizes
(inches), and look around in 3D. Plain HTML, CSS and JavaScript with three.js; no build step.

The apartment plan built from the sketch and walkthrough video is `apartmentState()` in
[public/app.js](public/app.js).

## Run it locally

```bash
python3 serve.py 8766
```

Then open http://localhost:8766.

## Deploy

It is hosted on Cloudflare as a Worker with static assets (`wrangler.jsonc`), behind
Cloudflare Access so only allowed email addresses can open it.

```bash
npx wrangler@4 deploy
```
