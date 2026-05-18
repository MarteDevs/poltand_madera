module.exports = {
  apps: [
    {
      name: 'madera-poltand-api',
      script: './src/app.js',
      cwd: __dirname,

      // Entorno de producción por defecto
      env: {
        NODE_ENV: 'production',
      },

      // Sobreescritura para desarrollo (pm2 start --env development)
      env_development: {
        NODE_ENV: 'development',
      },

      // Instancias y modo
      instances: 1,           // Cambia a 'max' para usar todos los CPU cores
      exec_mode: 'fork',      // Cambia a 'cluster' si usas múltiples instancias

      // Auto-restart y estabilidad
      autorestart: true,
      watch: false,            // No vigilar cambios en producción
      max_memory_restart: '300M',
      restart_delay: 5000,     // Esperar 5s antes de reiniciar
      max_restarts: 10,        // Máximo 10 reinicios antes de detenerse

      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      log_file: './logs/pm2-combined.log',

      // Variables de entorno desde .env
      // PM2 carga automáticamente dotenv si está en tu app.
      // Las variables sensibles (DB_PASSWORD, JWT_SECRET) se leen desde .env
    },
  ],
};
