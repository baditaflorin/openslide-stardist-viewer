import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8"),
);

const info = {
  version: packageJson.version,
  commit: process.env.VITE_COMMIT_SHA || "local",
  repositoryUrl:
    process.env.VITE_REPOSITORY_URL ||
    "https://github.com/baditaflorin/openslide-stardist-viewer",
  paypalUrl:
    process.env.VITE_PAYPAL_URL ||
    "https://www.paypal.com/paypalme/florinbadita",
  pagesUrl: "https://baditaflorin.github.io/openslide-stardist-viewer/",
};

const target = resolve(root, "src/generated/buildInfo.ts");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(
  target,
  `export const buildInfo = ${JSON.stringify(info, null, 2)} as const;\n`,
  "utf8",
);
