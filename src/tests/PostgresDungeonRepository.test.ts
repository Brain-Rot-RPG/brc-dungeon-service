import { Pool } from "pg";
import { PostgresDungeonRepository } from "../infrastructure/database/PostgresDungeonRepository";

jest.mock("pg", () => {
  const mockQuery = jest.fn();
  return {
    Pool: jest.fn(() => ({
      query: mockQuery,
    })),
  };
});

describe("PostgresDungeonRepository", () => {
  let pool: Pool;
  let repository: PostgresDungeonRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    pool = new Pool();
    mockQuery = pool.query as jest.Mock;
    mockQuery.mockReset();
    repository = new PostgresDungeonRepository(pool);
  });

  describe("getAll", () => {
    it("returns all dungeons from database", async () => {
      const mockRows = [
        {
          id: "dung1",
          seed: "seed1",
          size: 5,
          difficulty: "easy" as const,
          enemies: { enemy1: ["pos1"] },
          items: { item1: ["pos2"] },
          paths: { start: ["pos1"] },
          created_at: new Date("2026-01-01"),
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getAll();

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM dungeons ORDER BY created_at DESC"
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("dung1");
      expect(result[0].enemies).toEqual({ enemy1: ["pos1"] });
    });
  });

  describe("getById", () => {
    it("returns dungeon when found", async () => {
      const mockRow = {
        id: "dung1",
        seed: "seed1",
        size: 8,
        difficulty: "medium" as const,
        enemies: { enemy1: ["pos1"] },
        items: { item1: ["pos2"] },
        paths: { start: ["pos1"] },
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 });

      const result = await repository.getById("dung1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("dung1");
      expect(result?.size).toBe(8);
    });

    it("returns null when dungeon not found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await repository.getById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates a dungeon and returns it", async () => {
      const mockRow = {
        id: expect.any(String),
        seed: "custom-seed",
        size: 10,
        difficulty: "hard" as const,
        enemies: {},
        items: {},
        paths: {},
        created_at: new Date("2026-01-01"),
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockRow] });

      const result = await repository.create({
        seed: "custom-seed",
        size: 10,
        difficulty: "hard",
        enemies: {},
        items: {},
        paths: {},
      });

      expect(result.seed).toBe("custom-seed");
      expect(result.size).toBe(10);
      expect(result.difficulty).toBe("hard");
    });
  });

  describe("delete", () => {
    it("returns true when dungeon is deleted", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await repository.delete("dung1");

      expect(result).toBe(true);
    });

    it("returns false when dungeon not found", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await repository.delete("non-existent");

      expect(result).toBe(false);
    });
  });
});
