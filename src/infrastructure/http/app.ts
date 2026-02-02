import express, { Express } from "express";
import { DungeonService } from "../../application/services/DungeonService";
import { createDungeonRoutes } from "./dungeonRoutes";

export function createApp(service: DungeonService): Express {
  const app = express();

  app.use(express.json());

  const dungeonRoutes = createDungeonRoutes(service);
  app.use("/api/v1", dungeonRoutes);

  return app;
}
