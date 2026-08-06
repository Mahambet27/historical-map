import { runImporter } from "./importer-core.mjs";
await runImporter({ sourceId: "geonames", crosscheckOnly: true });
