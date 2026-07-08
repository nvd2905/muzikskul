# Deployment

Auto-deploy of `muzikskul` to a VPS via GitHub Actions on each published Release. The VPS already runs one other application — every step here is scoped to avoid disturbing it.

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
   ```
   `WALLET_ENCRYPTION_KEY` must match the key used to write existing encrypted `personal_transactions` rows, or that data becomes permanently unreadable.
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
