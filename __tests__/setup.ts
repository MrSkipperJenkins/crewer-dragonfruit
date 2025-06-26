import { Express } from "express";
import { Server } from "http";
import express from "express";
import { registerRoutes } from "../server/routes.js";

let app: Express;
let server: Server;

// Setup test server
beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

// Close server after tests
afterAll((done) => {
  server.close(done);
});

export { app };
