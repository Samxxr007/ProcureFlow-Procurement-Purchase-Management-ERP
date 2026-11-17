import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

export const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-qa-lab-profile'],
}));

app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ProcureFlow API',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);
