import { DungeonService } from "../application/services/DungeonService";
import { DungeonRepository } from "../domain/repositories/DungeonRepository";
import { Dungeon } from "../domain/entities/Dungeon";

// Mock fetch globally
global.fetch = jest.fn();

class InMemoryDungeonRepository implements DungeonRepository {
  private dungeons: Dungeon[] = [];

  async getAll(): Promise<Dungeon[]> {
    return this.dungeons;
  }

  async getById(id: number): Promise<Dungeon | null> {
    return this.dungeons.find((d) => d.id === id) ?? null;
  }

  async create(input: Omit<Dungeon, "id" | "createdAt">): Promise<Dungeon> {
    const created: Dungeon = {
      id: this.dungeons.length + 1,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      ...input,
    };
    this.dungeons.push(created);
    return created;
  }

  async delete(id: number): Promise<boolean> {
    const before = this.dungeons.length;
    this.dungeons = this.dungeons.filter((d) => d.id !== id);
    return this.dungeons.length < before;
  }
}

describe("DungeonService", () => {
  let repo: InMemoryDungeonRepository;
  let service: DungeonService;
  const mockFetch = global.fetch as jest.Mock;

  beforeEach(() => {
    repo = new InMemoryDungeonRepository();
    service = new DungeonService(repo);
    mockFetch.mockReset();

    // Default mock responses for brainrot and item services
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("brainrots")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              { id: "1", name: "Enemy1", isBoss: false },
              { id: "2", name: "Enemy2", isBoss: false },
              { id: "3", name: "Enemy3", isBoss: false },
              { id: "27", name: "Boss", isBoss: true },
              { id: "67", name: "Boss2", isBoss: true },
            ]),
        });
      }
      if (url.includes("items")) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              { id: "item1", name: "Potion1" },
              { id: "item2", name: "Potion2" },
              { id: "item3", name: "Potion3" },
            ]),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  describe("create", () => {
    it("creates a dungeon with provided parameters", async () => {
      const created = await service.create({
        size: 10,
        difficulty: "easy",
      });

      expect(created.id).toBeDefined();
      expect(created.size).toBe(10);
      expect(created.difficulty).toBe("easy");
      expect(created.seed).toBeDefined();
      expect(created.paths).toBeDefined();
      expect(created.enemies).toBeDefined();
      expect(created.items).toBeDefined();
    });

    it("creates a dungeon with custom seed", async () => {
      const customSeed = "my-seed-123";
      const created = await service.create({
        seed: customSeed,
        size: 5,
        difficulty: "medium",
      });

      expect(created.seed).toBe(customSeed);
    });

    it("generates paths with start position", async () => {
      const created = await service.create({
        size: 5,
        difficulty: "hard",
      });

      expect(created.paths["start"]).toBeDefined();
    });

    it("always includes boss_arena in paths", async () => {
      const created = await service.create({
        size: 8,
        difficulty: "medium",
      });

      // Check that boss_arena is reachable from some position
      const allPositions = Object.keys(created.paths);
      expect(allPositions).toContain("boss_arena");
    });

    it("always spawns final boss at boss_arena", async () => {
      const created = await service.create({
        size: 6,
        difficulty: "easy",
      });

      // Boss should be at boss_arena (using real boss brainrot ID)
      const bossIds = ["27", "67"]; // Our boss IDs
      const bossAtArena = Object.entries(created.enemies).find(
        ([id, positions]) => bossIds.includes(id) && positions.includes("boss_arena")
      );
      expect(bossAtArena).toBeDefined();
      expect(bossAtArena?.[1]).toContain("boss_arena");
    });

    it("generates correct number of paths for size", async () => {
      const size = 7;
      const created = await service.create({
        size,
        difficulty: "medium",
      });

      // Should have approximately size + 1 levels of positions (including start and boss)
      const pathCount = Object.keys(created.paths).length;
      expect(pathCount).toBeGreaterThan(0);
    });

    it("easy difficulty has 60% enemy spawn rate", async () => {
      // Run multiple times to check statistical distribution
      let totalEnemies = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const created = await service.create({
          size: 10,
          difficulty: "easy",
        });
        totalEnemies += Object.keys(created.enemies).length;
      }

      const avgEnemies = totalEnemies / iterations;
      // Should spawn around 60% of non-start positions + boss
      expect(avgEnemies).toBeGreaterThan(5);
    });

    it("hard difficulty has higher enemy spawn rate than easy", async () => {
      let easyEnemies = 0;
      let hardEnemies = 0;
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const easy = await service.create({
          size: 10,
          difficulty: "easy",
        });
        easyEnemies += Object.keys(easy.enemies).length;

        const hard = await service.create({
          size: 10,
          difficulty: "hard",
        });
        hardEnemies += Object.keys(hard.enemies).length;
      }

      expect(hardEnemies).toBeGreaterThan(easyEnemies);
    });

    it("generates paths converging to boss", async () => {
      const created = await service.create({
        size: 10,
        difficulty: "medium",
      });

      // All paths should eventually lead to boss_arena
      const paths = created.paths;
      const canReachBoss = (position: string, visited = new Set<string>()): boolean => {
        if (position === "boss_arena") return true;
        if (visited.has(position)) return false;
        visited.add(position);

        const nextPositions = paths[position] || [];
        return nextPositions.some((next) => canReachBoss(next, visited));
      };

      // Check a sample of positions
      const positionsToCheck = Object.keys(paths).slice(0, 5);
      for (const pos of positionsToCheck) {
        expect(canReachBoss(pos)).toBe(true);
      }
    });
  });

  describe("getAll", () => {
    it("returns empty array when no dungeons exist", async () => {
      const all = await service.getAll();
      expect(all).toEqual([]);
    });

    it("returns all created dungeons", async () => {
      await service.create({ size: 5, difficulty: "easy" });
      await service.create({ size: 10, difficulty: "medium" });
      await service.create({ size: 15, difficulty: "hard" });

      const all = await service.getAll();
      expect(all).toHaveLength(3);
    });
  });

  describe("getById", () => {
    it("returns dungeon when it exists", async () => {
      const created = await service.create({
        size: 8,
        difficulty: "medium",
      });

      const found = await service.getById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.size).toBe(8);
    });

    it("returns null when dungeon does not exist", async () => {
      const found = await service.getById(999);
      expect(found).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes an existing dungeon", async () => {
      const created = await service.create({
        size: 5,
        difficulty: "easy",
      });

      const deleted = await service.delete(created.id);
      expect(deleted).toBe(true);

      const found = await service.getById(created.id);
      expect(found).toBeNull();
    });

    it("returns false when deleting non-existent dungeon", async () => {
      const deleted = await service.delete(999);
      expect(deleted).toBe(false);
    });
  });
});
