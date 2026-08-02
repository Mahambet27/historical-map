import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  onlinePackageDir,
  onlinePackageName,
  releaseVersion,
} from "./package-config.mjs";
import { getGitCommit } from "./release-metadata.mjs";

const releaseFiles = () => ({
  "DEPLOYMENT_CHECKLIST.md": `# ${onlinePackageName}

- [ ] Confirm branch, commit and tag placeholders.
- [ ] Run the full local release verification.
- [ ] Create a Vercel preview deployment.
- [ ] Verify /demo, /exhibition, /map and /demo/diagnostics.
- [ ] Verify PWA update, incognito and mobile.
- [ ] Promote only after sign-off. This package performs no deployment.
`,
  ".env.example.safe": `VITE_RELEASE_CHANNEL=exhibition-stable
VITE_OFFLINE_EXHIBITION=false
VITE_HISTORICAL_DATA_SOURCE=local
VITE_MAPBOX_TOKEN=<public-token-or-empty>
`,
  "VERCEL_SETTINGS.md": `# Vercel settings

Build command: \`npm run build\`  
Output: \`dist\`  
Node: 22  
Never add service-role keys. Use only a public Mapbox token if approved.
`,
  "ROUTES.md": `# Route verification

- /demo
- /demo?lang=ru
- /demo?lang=kk
- /demo?lang=en
- /demo?quality=light
- /exhibition
- /map
- /demo/diagnostics
`,
  "ROLLBACK.md": `# Rollback

Promote the previous known-good Vercel deployment, verify its release manifest,
then clear only Qazaq Heritage Map caches. Do not change the database and do not
use destructive Git reset.
`,
  "RELEASE.json": `${JSON.stringify(
    {
      releaseVersion,
      expectedCommit: getGitCommit(),
      expectedTag: "TAG_PLACEHOLDER",
      deploymentPerformed: false,
      credentialsIncluded: false,
    },
    null,
    2
  )}\n`,
});

export const buildOnlineRelease = async () => {
  await rm(onlinePackageDir, { recursive: true, force: true });
  await mkdir(onlinePackageDir, { recursive: true });
  for (const [name, content] of Object.entries(releaseFiles())) {
    await writeFile(path.join(onlinePackageDir, name), content, "utf8");
  }
  console.log(`Online deployment package: ${onlinePackageDir}`);
  return onlinePackageDir;
};

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  buildOnlineRelease().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
