import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

copyFileSync(resolve("docs/index.html"), resolve("docs/404.html"));
