import { Router, Request, Response } from "express";
import { DungeonService } from "../../application/services/DungeonService";
import { DungeonInput } from "../../domain/entities/Dungeon";

export function createDungeonRoutes(service: DungeonService): Router {
  const router = Router();

  router.get("/dungeon", async (_req: Request, res: Response) => {
    try {
      const dungeons = await service.getAll();
      res.json(dungeons);
    } catch (error) {
      console.error("Error fetching dungeons:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/dungeon", async (req: Request, res: Response) => {
    try {
      const input: DungeonInput = req.body;

      // Validate input
      if (!input.size || input.size < 1) {
        res.status(400).json({ error: "size is required and must be >= 1" });
        return;
      }

      if (!input.difficulty || !["easy", "medium", "hard"].includes(input.difficulty)) {
        res.status(400).json({
          error: "difficulty is required and must be easy, medium, or hard",
        });
        return;
      }

      const dungeon = await service.create(input);
      res.status(201).json(dungeon);
    } catch (error) {
      console.error("Error creating dungeon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/dungeon/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dungeon = await service.getById(id);

      if (!dungeon) {
        res.status(404).json({ error: "Dungeon not found" });
        return;
      }

      res.json(dungeon);
    } catch (error) {
      console.error("Error fetching dungeon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete("/dungeon/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await service.delete(id);

      if (!deleted) {
        res.status(404).json({ error: "Dungeon not found" });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dungeon:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
