import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const repoRoot = resolve(__dirname, "..", "..");

const optOutFiles = [
  "src/components/shared/data-table.tsx",
  "src/components/shared/file-table.tsx",
  "src/components/workspace/file-viewer/viewers/csv-viewer.tsx",
  "src/components/organisms/reference-genomes/reference-genomes-client.tsx",
] as const;

function readRepoFile(relPath: string): string {
  return readFileSync(join(repoRoot, relPath), "utf8");
}

function* walkFiles(dir: string, extensions: readonly string[]): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry === ".next" || entry.startsWith("__")) continue;
      yield* walkFiles(full, extensions);
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      yield full;
    }
  }
}

describe("React Compiler configuration", () => {
  it("next.config.ts has reactCompiler: true", () => {
    const config = readRepoFile("next.config.ts");
    expect(config).toMatch(/reactCompiler:\s*true/);
  });

  it("package.json declares babel-plugin-react-compiler ^1.x in devDependencies", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    expect(pkg.devDependencies?.["babel-plugin-react-compiler"]).toMatch(/^\^?1\./);
    expect(pkg.dependencies?.["babel-plugin-react-compiler"]).toBeUndefined();
  });

  it.each(optOutFiles)('"%s" still contains the "use no memo" directive', (path) => {
    expect(readRepoFile(path)).toContain('"use no memo"');
  });

  it("eslint.config.mjs opt-out files list matches the documented opt-out set exactly", () => {
    const eslintConfig = readRepoFile("eslint.config.mjs");
    for (const optOut of optOutFiles) {
      expect(eslintConfig).toContain(`"${optOut}"`);
    }

    const blockMatch = /"react-hooks\/incompatible-library":\s*"off"/.exec(eslintConfig);
    expect(blockMatch).not.toBeNull();
    const blockStart = eslintConfig.lastIndexOf("files: [", blockMatch?.index);
    const blockEnd = eslintConfig.indexOf("]", blockStart);
    const block = eslintConfig.slice(blockStart, blockEnd);
    const declaredPaths = [...block.matchAll(/"([^"]+\.tsx?)"/g)].map((m) => m[1]);
    expect(declaredPaths).toEqual([...optOutFiles]);
  });

  it("no src file uses \"use no memo\" without being in the eslint config opt-out list", () => {
    const offenders: string[] = [];
    for (const file of walkFiles(join(repoRoot, "src"), [".tsx", ".ts"])) {
      if (!readFileSync(file, "utf8").includes('"use no memo"')) continue;
      const relPath = relative(repoRoot, file);
      if (!(optOutFiles as readonly string[]).includes(relPath)) {
        offenders.push(relPath);
      }
    }
    expect(offenders).toEqual([]);
  });

  it.skipIf(!existsSync(join(repoRoot, ".next", "static", "chunks")))(
    "compiled bundles contain the React Compiler memo-cache sentinel",
    () => {
      const chunksDir = join(repoRoot, ".next", "static", "chunks");
      const sentinel = 'Symbol.for("react.memo_cache_sentinel")';
      for (const file of walkFiles(chunksDir, [".js"])) {
        if (readFileSync(file, "utf8").includes(sentinel)) return;
      }
      throw new Error(
        `Did not find ${sentinel} in any chunk under ${chunksDir}. ` +
          "Either the React Compiler is not running, or the build is stale.",
      );
    },
  );
});
