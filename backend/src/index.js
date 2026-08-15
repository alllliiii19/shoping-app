import 'dotenv/config';
import app from './app.js';
import { connectRedis } from './config/redis.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect Redis once, at startup
    await connectRedis();
    console.log('✅ Redis connected');

    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();