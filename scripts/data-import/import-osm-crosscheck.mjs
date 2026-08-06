import { runImporter } from "./importer-core.mjs";
await runImporter({ sourceId: "openstreetmap-crosscheck", crosscheckOnly: true });
