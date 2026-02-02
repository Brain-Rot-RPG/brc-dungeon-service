import { DIFFICULTY_CONFIGS } from "../../infrastructure/config/DifficultyConfig";

export class DungeonGenerator {
  /**
   * Generates dungeon paths with convergence towards a boss
   * size: number of steps player can take to reach boss
   * Paths converge at halfway point
   */
  static generatePaths(size: number): Record<string, string[]> {
    const paths: Record<string, string[]> = {};
    const convergencePoint = Math.ceil(size / 2);
    const positionsByDepth = new Map<number, Set<string>>();

    // Generate initial paths
    let currentPositions: Set<string> = new Set(["start"]);
    positionsByDepth.set(0, currentPositions);

    // Generate paths up to convergence point with branching (1-3 next positions)
    for (let depth = 0; depth < convergencePoint - 1; depth++) {
      const nextPositions = new Set<string>();

      for (const pos of currentPositions) {
        const numNext = Math.floor(Math.random() * 3) + 1; // 1-3 next positions
        for (let i = 0; i < numNext; i++) {
          const nextPos = `pos_${depth + 1}_${nextPositions.size + i}`;
          nextPositions.add(nextPos);
          paths[pos] = paths[pos] || [];
          paths[pos].push(nextPos);
        }
      }

      currentPositions = nextPositions;
      positionsByDepth.set(depth + 1, currentPositions);
    }

    // From convergence point, paths start converging towards boss
    // All paths eventually lead to boss_arena
    const convergencePositions = currentPositions;
    const remainingSteps = size - convergencePoint;

    let converging = convergencePositions;
    for (let depth = convergencePoint; depth < size; depth++) {
      const nextConverging = new Set<string>();
      let nextPosIndex = 0;

      for (const pos of converging) {
        // Create fewer positions as we converge
        const convergeRatio = (depth - convergencePoint + 1) / remainingSteps;
        const numNext = Math.max(1, Math.floor(3 * (1 - convergeRatio)) || 1);

        for (let i = 0; i < numNext; i++) {
          const nextPos =
            depth === size - 1
              ? "boss_arena"
              : `pos_${depth + 1}_${nextPosIndex}`;
          nextConverging.add(nextPos);
          paths[pos] = paths[pos] || [];
          if (!paths[pos].includes(nextPos)) {
            paths[pos].push(nextPos);
          }
          nextPosIndex++;
        }
      }

      converging = nextConverging;
    }

    return paths;
  }

  /**
   * Spawns enemies based on difficulty configuration
   * Uses real brainrot IDs from database
   * Returns enemy_id: [positions] format
   */
  static spawnEnemies(
    paths: Record<string, string[]>,
    difficulty: "easy" | "medium" | "hard",
    normalBrainrotIds: string[],
    bossBrainrotIds: string[]
  ): Record<string, string[]> {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const enemies: Record<string, string[]> = {};
    const allPositions = Object.keys(paths);

    // Don't spawn at start position
    const spawnPositions = allPositions.filter((p) => p !== "start");

    for (const pos of spawnPositions) {
      // Skip boss_arena for normal enemies
      if (pos === "boss_arena") {
        continue;
      }

      const rand = Math.random();
      if (rand < config.enemySpawnRate && normalBrainrotIds.length > 0) {
        // Pick random normal brainrot ID from database
        const randomBrainrotId = normalBrainrotIds[Math.floor(Math.random() * normalBrainrotIds.length)];
        if (!enemies[randomBrainrotId]) {
          enemies[randomBrainrotId] = [];
        }
        enemies[randomBrainrotId].push(pos);
      }
    }

    // Boss is always at boss_arena - pick a random boss brainrot ID
    if (bossBrainrotIds.length > 0) {
      const bossBrainrot = bossBrainrotIds[Math.floor(Math.random() * bossBrainrotIds.length)];
      enemies[bossBrainrot] = ["boss_arena"];
    }

    return enemies;
  }

  /**
   * Spawns items based on difficulty configuration
   * Uses real item IDs from database
   */
  static spawnItems(
    paths: Record<string, string[]>,
    difficulty: "easy" | "medium" | "hard",
    itemIds: string[],
    occupiedPositions: Set<string>
  ): Record<string, string[]> {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const items: Record<string, string[]> = {};
    const allPositions = Object.keys(paths);

    // Don't spawn at start or boss_arena
    const spawnPositions = allPositions.filter(
      (p) => p !== "start" && p !== "boss_arena"
    );

    for (const pos of spawnPositions) {
      if (occupiedPositions.has(pos)) {
        continue;
      }
      const rand = Math.random();
      if (rand < config.itemSpawnRate) {
        // Pick random item ID from database
        const randomItemId = itemIds[Math.floor(Math.random() * itemIds.length)];
        if (!items[randomItemId]) {
          items[randomItemId] = [];
        }
        items[randomItemId].push(pos);
        occupiedPositions.add(pos);
      }
    }

    return items;
  }
}
