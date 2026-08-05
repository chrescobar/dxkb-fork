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

// Design tokens copied from the host page into the iframe as `--dxkb-<name>`.
// public/auspice-dark.css consumes exactly these; scripts/auspice-shell.test.ts
// fails the build if the two lists drift apart.
const bridgedTokens = [
  "background",
  "foreground",
  "card",
  "popover",
  "popover-foreground",
  "primary",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "border",
  "input",
  "ring",
  "font-geist-sans",
];

/**
 * Inline script that mirrors the host document's tokens onto this document.
 *
 * Inline rather than a separate file so it runs before first paint — an
 * external <script> would let a light frame through. Auspice is same-origin,
 * so `parent.document` is readable directly and a MutationObserver on the
 * host's `data-theme` attribute fires across the frame boundary. Opened
 * standalone, `parent === window` and this is a no-op; the stylesheet's
 * var() fallbacks then render stock Auspice.
 */
const themeBridge = `(function(){try{
var host=window.parent;if(host===window)return;
var from=host.document.documentElement,to=document.documentElement;
var names=${JSON.stringify(bridgedTokens)};
function sync(){var s=host.getComputedStyle(from);
for(var i=0;i<names.length;i++){var v=s.getPropertyValue("--"+names[i]).trim();
if(v)to.style.setProperty("--dxkb-"+(names[i]==="font-geist-sans"?"font":names[i]),v);}
var t=from.getAttribute("data-theme");if(t)to.setAttribute("data-theme",t);}
sync();new host.MutationObserver(sync).observe(from,{attributes:true,attributeFilter:["data-theme","class","style"]});
}catch(e){}})();`;

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

  const shell = readFileSync(resolve(scratch, "index.html"), "utf8")
    .replaceAll('href="/favicon.png"', 'href="/auspice-favicon.png"')
    .replace(
      "</head>",
      `<link rel="stylesheet" href="/auspice-dark.css"><script>${themeBridge}</script></head>`,
    );
  if (!shell.includes("/auspice-dark.css")) {
    throw new Error(
      "auspice: could not inject the theme bridge — the built index.html no longer has a </head>",
    );
  }
  writeFileSync(resolve(publicDir, "nextstrain-viewer.html"), shell);

  console.log(
    "auspice: built public/dist and public/nextstrain-viewer.html",
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
