import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scratch = resolve(root, ".auspice-build");
const cli = resolve(root, "node_modules/auspice/auspice.js");
const publicDir = resolve(root, "public");

rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

try {
  execFileSync(
    process.execPath,
    [cli, "build", "--extend", resolve(root, "auspice/config.json")],
    { cwd: scratch, stdio: "inherit" },
  );

  rmSync(resolve(publicDir, "dist"), { recursive: true, force: true });
  cpSync(resolve(scratch, "dist"), resolve(publicDir, "dist"), {
    recursive: true,
  });
  cpSync(
    resolve(root, "node_modules/auspice/favicon.png"),
    resolve(publicDir, "auspice-favicon.png"),
  );

  const shell = readFileSync(resolve(scratch, "index.html"), "utf8").replaceAll(
    'href="/favicon.png"',
    'href="/auspice-favicon.png"',
  );
  writeFileSync(resolve(publicDir, "nextstrain-viewer.html"), shell);

  console.log(
    "auspice: built public/dist and public/nextstrain-viewer.html",
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
