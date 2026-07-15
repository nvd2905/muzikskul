# Deployment

Auto-deploy of `muzikskul` to a VPS via GitHub Actions on each published Release.

## Production topology as actually deployed (103.45.232.100)

The VPS turned out to already be running `muzikskul.xyz` in production via a **separate, fully-Dockerized app** (`MMMuzik V2` — Prisma/Postgres/Redis, project dir `/opt/mmmuzik/MMMuzik`), whose own `nginx:alpine` container (`mmmuzik-nginx-1`) held host ports 80/443 directly and already had a valid Let's Encrypt cert for `muzikskul.xyz` + `www.muzikskul.xyz`. The bare-metal `nginx` package described in the steps below was installed but never actually used. Decision made: **replace** that app with this repo, reusing its existing Nginx container and cert rather than standing up a second one. Concretely:

1. `deploy` user created, owns `/var/www/muzikskul` (see Coexistence checklist below — still relevant for process name/port/swap).
2. App runs under PM2 as `deploy` on `127.0.0.1:3001` (its own PM2 daemon at `/home/deploy/.pm2`, fully separate from anything running as `root`).
3. **No host Nginx/Certbot was installed.** Instead, `/opt/mmmuzik/MMMuzik/deploy/nginx/conf.d/muzikskul-ssl.conf` inside the existing `mmmuzik-nginx-1` container was edited: `proxy_pass http://app:3000;` → `proxy_pass http://172.18.0.1:3001;` (`172.18.0.1` is the `mmmuzik_default` Docker bridge gateway — from inside that container, the host's PM2 app is reachable there). Reload with `docker exec mmmuzik-nginx-1 nginx -t && docker exec mmmuzik-nginx-1 nginx -s reload`. A `.bak-mmmuzik` copy of the original conf was left alongside it.
4. `ufw`'s default-deny-incoming policy blocked the Docker bridge from reaching port 3001 on the host. Fixed narrowly (not opening 3001 to the internet): `ufw allow from 172.18.0.0/16 to any port 3001 proto tcp`.
5. The old `mmmuzik-app-1`, `mmmuzik-postgres-1`, `mmmuzik-redis-1` containers were **stopped, not removed** — their volumes (`mmmuzik_pgdata`, `mmmuzik_redisdata`) are untouched on disk in case that data is ever needed. `mmmuzik-nginx-1` and `mmmuzik-certbot-1` are still running (they front the domain and keep the cert renewed).
6. `deploy/nginx.conf.example` and the "Nginx + Certbot" step below describe a **host-level** Nginx setup — that's what to use on a *fresh* VPS with no pre-existing app on the domain. It is **not** what's running on 103.45.232.100 today; skip that step there.

If this VPS is rebuilt from scratch, or `muzikskul` is ever deployed to a fresh box, the Coexistence checklist + host-Nginx steps below are the right path.

## Coexistence checklist (READ FIRST — this VPS already runs another app)

Before the first deploy, confirm muzikskul will not collide with the existing app on process name, port, Nginx site, or memory:

1. **See what's already running & on which port:**
   ```bash
   pm2 list                # note the existing app's name and status
   sudo ss -ltnp           # note which ports are already bound (expect the other app on 3000)
   ```
   Confirm no PM2 process is already named `muzikskul`.
2. **Confirm muzikskul's chosen port is free.** Verify **3001** shows nothing bound in `sudo ss -ltnp`. If it's taken, pick another free port and update it in **three** places: `ecosystem.config.js` (`args` + `env.PORT`) and `deploy/nginx.conf.example` (`proxy_pass`).
3. **List existing Nginx sites before adding ours:**
   ```bash
   ls -l /etc/nginx/sites-enabled/    # know what's there so you don't overwrite it
   ```
   Add muzikskul as a **new** file (`muzikskul.conf`); never edit or replace an existing site, and never use `default_server`.
4. **Size swap for BOTH apps' peak memory, not just muzikskul.** `next build` on the VPS is memory-hungry and can trigger the OOM killer — which on a shared box could also kill the *existing* app. Add the swap file (below) **before** the first build, and size it for the existing app's steady-state RSS (from `pm2 list` / `free -m`) **plus** muzikskul's build peak. On a small (1–2 GB) VPS already running another app, prefer **4 GB** swap over 2 GB.

## One-time VPS setup

1. **Swap (do this first — OOM prevention, sized for both apps per checklist step 4).**
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
   Verify with `free -h` that both apps + build headroom fit.
2. **Node 20 LTS** via nvm or NodeSource; verify `node -v` / `npm -v`.
3. **PM2:** if PM2 is already installed (the existing app likely uses it), reuse it — do **not** reinstall in a way that resets the daemon. Run `pm2 startup` only if it isn't already configured. Run `pm2 save` **after** muzikskul's first deploy so the persisted list contains *both* apps.
4. **Clone the repo** to the app path (the deploy user must own it):
   ```bash
   sudo mkdir -p /var/www/muzikskul
   sudo chown "$USER":"$USER" /var/www/muzikskul
   git clone <repo-url> /var/www/muzikskul
   ```
5. **Create `/var/www/muzikskul/.env.production.local`** (never committed) with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   WALLET_ENCRYPTION_KEY=...
   DATABASE_URL=...
   DIRECT_URL=...
   YOUTUBE_API_KEY=...
   ```
   `WALLET_ENCRYPTION_KEY` must match the key used to write existing encrypted `personal_transactions` rows, or that data becomes permanently unreadable. `DATABASE_URL`/`DIRECT_URL` are required at runtime by the muzik module (Prisma) — see `.env.example` for the pooled-vs-direct connection string format; without them, `assertRuntimeConfig()` fails fast and any Prisma-backed request (e.g. creating a room) errors. `YOUTUBE_API_KEY` is optional.
6. **Nginx + Certbot (new site file, does not touch the existing app):**
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ls -l /etc/nginx/sites-enabled/     # confirm what's already enabled first
   sudo cp /var/www/muzikskul/deploy/nginx.conf.example /etc/nginx/sites-available/muzikskul.conf
   # server_name is already set to muzikskul.xyz / www.muzikskul.xyz; confirm proxy_pass port matches ecosystem.config.js
   sudo ln -s /etc/nginx/sites-available/muzikskul.conf /etc/nginx/sites-enabled/muzikskul.conf
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d muzikskul.xyz -d www.muzikskul.xyz
   ```
   `nginx -t` will fail if the new `server_name` clashes with the existing app's — resolve before reload. Renewal runs automatically via the certbot systemd timer.
7. **First deploy:** `cd /var/www/muzikskul && ./scripts/deploy.sh <tag>` (or just publish a Release once secrets are set). Afterwards run `pm2 list` again and confirm **both** apps show `online`.

   On 103.45.232.100 the very first bring-up was done manually (`npm ci && npm run build && pm2 start ecosystem.config.js --only muzikskul`) since no Git tag/Release existed yet. **Publish a Release now to establish the first tag** — every subsequent deploy goes through `scripts/deploy.sh` via the GitHub Action, which requires an actual tag to `git checkout`.
8. **Supabase + Discord allowlists:** add `https://muzikskul.xyz/auth/callback` to Supabase (Authentication → URL Configuration) and the Discord Developer Portal (OAuth2 → Redirects). Production login fails silently otherwise.

## Required GitHub repo secrets

Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `SSH_HOST` | VPS IP or hostname |
| `SSH_USER` | the existing deploy user |
| `SSH_PRIVATE_KEY` | private key whose public half is in the deploy user's `~/.ssh/authorized_keys` |
| `SSH_PORT` | SSH port (`22` if default) |

No Supabase/app secrets go in GitHub — they live only in `.env.production.local` on the VPS.
