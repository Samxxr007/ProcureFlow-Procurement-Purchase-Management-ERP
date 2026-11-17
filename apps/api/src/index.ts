import { app } from './app';
import { ENV } from './config/env';

const server = app.listen(ENV.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ProcureFlow Backend API running on port ${ENV.PORT}`);
  console.log(`📡 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${ENV.PORT}/health`);
  console.log(`⚡ Quality Lab:   http://localhost:${ENV.PORT}/api/qa/overview`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
