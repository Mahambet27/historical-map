import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import * as prettier from "prettier";

// Fixed pre-CI-fix baseline. Never advance this automatically: every new or
// modified file must pass Prettier. Existing .prettierignore exemptions remain.
const baseline = "f9251a69a44389ba76820c6ca89350e116d14668";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
// Fail closed if a shallow checkout cannot resolve the baseline.
git("cat-file", "-e", `${baseline}^{commit}`);
const paths = new Set(
  [
    git("diff", "--name-only", "--diff-filter=ACMRT", "-z", baseline),
    git("ls-files", "--others", "--exclude-standard", "-z"),
  ].flatMap((output) => output.split("\0").filter(Boolean))
);
let checked = 0;
let failed = 0;
for (const file of paths) {
  const info = await prettier.getFileInfo(file, { ignorePath: ".prettierignore" });
  if (info.ignored || !info.inferredParser) continue;
  const options = (await prettier.resolveConfig(file)) || {};
  const content = await readFile(file, "utf8");
  checked += 1;
  if (!(await prettier.check(content, { ...options, filepath: file }))) {
    process.stderr.write(`[warn] ${file}\n`);
    failed += 1;
  }
}
process.stdout.write(
  `Prettier: ${checked} new/modified files checked against legacy baseline ${baseline.slice(0, 7)}; ${failed} failed.\n`
);
process.exitCode = failed ? 1 : 0;
