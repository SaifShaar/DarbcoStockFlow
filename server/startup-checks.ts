import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Required environment variables for the application
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'REPLIT_DOMAINS'
];

// Optional environment variables with defaults
const optionalEnvVars = [
  { name: 'PORT', defaultValue: '5000' },
  { name: 'NODE_ENV', defaultValue: 'development' },
  { name: 'ISSUER_URL', defaultValue: 'https://replit.com/oidc' }
];

export function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...');
  
  const missingVars: string[] = [];
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure all required environment variables are set before deployment.'
    );
  }
  
  // Set defaults for optional variables
  for (const { name, defaultValue } of optionalEnvVars) {
    if (!process.env[name]) {
      process.env[name] = defaultValue;
      console.log(`⚙️  Set ${name} to default value: ${defaultValue}`);
    }
  }
  
  console.log('✅ Environment variables validated successfully');
}

export async function testDatabaseConnection(): Promise<void> {
  console.log('🔍 Testing database connection...');
  
  try {
    // Create temporary pool for testing (don't import global pool)
    neonConfig.webSocketConstructor = ws;
    const testPool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test basic connection
    const client = await testPool.connect();
    
    // Test simple query
    const result = await client.query('SELECT 1 as test');
    
    if (result.rows[0]?.test !== 1) {
      throw new Error('Database connection test failed: unexpected result');
    }
    
    // Test users table exists (main table for our app)
    await client.query('SELECT COUNT(*) FROM users LIMIT 1');
    
    client.release();
    await testPool.end();
    console.log('✅ Database connection successful');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('relation "users" does not exist')) {
        throw new Error(
          'Database schema not initialized. Please run database migrations:\n' +
          '  npm run db:push'
        );
      }
      
      if (error.message.includes('connect')) {
        throw new Error(
          'Cannot connect to database. Please check:\n' +
          '  1. DATABASE_URL is correct\n' +
          '  2. Database server is running\n' +
          '  3. Network connectivity\n' +
          `  Original error: ${error.message}`
        );
      }
    }
    
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function setupGracefulShutdown(httpServer?: any): void {
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
      // Close HTTP server first
      if (httpServer) {
        await new Promise<void>((resolve) => {
          httpServer.close((err: any) => {
            if (err) console.error('Error closing HTTP server:', err);
            else console.log('✅ HTTP server closed');
            resolve();
          });
        });
      }
      
      // Close database pool
      const { pool } = await import('./db');
      await pool.end();
      console.log('✅ Database connections closed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions and rejections
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}