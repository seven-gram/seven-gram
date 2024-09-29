module.exports = {
  apps: [{
    name: 'seven-gram',
    script: './dist/main.js',
    max_memory_restart: '250M',
    restart_delay: '5000',
    node_args: [
      '--max-old-space-size=800',
    ],
    env: {
      NODE_NO_WARNINGS: 1,
    },
    env_production: {
      NODE_ENV: 'production',
    },
  }],
}
