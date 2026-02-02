import { Pool } from "pg";
import { PostgresDungeonRepository } from "./infrastructure/database/PostgresDungeonRepository";
import { DungeonService } from "./application/services/DungeonService";
import { createApp } from "./infrastructure/http/app";

const PORT = process.env.PORT || 4003;

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE || "brc_dungeon",
  user: process.env.PGUSER || "brc_dungeon_user",
  password: process.env.PGPASSWORD || "brc_dungeon_password",
});

const repository = new PostgresDungeonRepository(pool);
const service = new DungeonService(repository);
const app = createApp(service);

app.listen(PORT, () => {
  console.log(`Dungeon service listening on port ${PORT}`);
});
