module.exports = {
  apps: [
    {
      // COEXISTENCE: explicit distinct name so PM2 never collides with the existing app.
      name: 'muzikskul',
      cwd: '/var/www/muzikskul',
      // Custom server (Socket.IO + advance/reaper/presence workers) — NOT
      // `next start`, which never boots WebSockets or the workers the muzik
      // module needs (see CLAUDE.md's muzik module note).
      script: 'node_modules/.bin/tsx',
      args: 'src/server.ts',
      // COEXISTENCE: port 3001 — the existing app is assumed to own 3000. Confirm free before first deploy.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
      },
    },
  ],
}
