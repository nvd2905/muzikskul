module.exports = {
  apps: [
    {
      // COEXISTENCE: explicit distinct name so PM2 never collides with the existing app.
      name: 'muzikskul',
      cwd: '/var/www/muzikskul',
      script: 'node_modules/next/dist/bin/next',
      // COEXISTENCE: port 3001 — the existing app is assumed to own 3000. Confirm free before first deploy.
      args: 'start --port 3001',
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
