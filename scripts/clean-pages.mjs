import { rmSync } from "node:fs";
import { resolve } from "node:path";

for (const path of [
  "docs/assets",
  "docs/index.html",
  "docs/404.html",
  "docs/sample-micrograph.png",
]) {
  rmSync(resolve(path), { force: true, recursive: true });
}
