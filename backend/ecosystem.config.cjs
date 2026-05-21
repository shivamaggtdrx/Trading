// PM2 Ecosystem Configuration for Oracle Cloud Deployment
// Usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'stockslab-backend',
      script: 'src/server.js',
      cwd: '/home/ubuntu/stockslab/backend',
      instances: 1,
      exec_mode: 'fork',       // fork mode for Socket.IO (cluster mode breaks sticky sessions)
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      // Logging
      error_file: '/home/ubuntu/stockslab/backend/logs/pm2-error.log',
      out_file: '/home/ubuntu/stockslab/backend/logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart policy
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
    },
  ],
};
