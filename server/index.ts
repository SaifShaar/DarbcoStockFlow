import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironment, testDatabaseConnection, setupGracefulShutdown } from "./startup-checks";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    console.log('🚀 Starting Darbco ERP Server...');
    
    // 1. Validate environment variables
    validateEnvironment();
    
    // 2. Test database connection
    await testDatabaseConnection();
    
    // 3. Dynamic import of routes after validation (prevents eager db.ts imports)
    console.log('🔧 Setting up routes...');
    const { registerRoutes } = await import("./routes");
    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');
    
    // 4. Setup graceful shutdown handlers with server instance
    setupGracefulShutdown(server);

    // 5. Setup error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`❌ Server error ${status}:`, message);
      res.status(status).json({ message });
    });

    // 6. Setup Vite in development or static serving in production
    console.log('🎯 Setting up frontend serving...');
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    console.log('✅ Frontend serving configured');

    // 7. Start the server
    const port = parseInt(process.env.PORT || '5000', 10);
    
    await new Promise<void>((resolve, reject) => {
      server.listen({
        port,
        host: "0.0.0.0",
        reusePort: true,
      }, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
      
      // Handle server errors
      server.on('error', (error: Error) => {
        reject(error);
      });
    });
    
    console.log(`🎉 Server successfully started on port ${port}`);
    console.log(`🌐 Server is listening on http://0.0.0.0:${port}`);
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    // Exit with error code for deployment systems
    process.exit(1);
  }
}

// Start the server
startServer();
