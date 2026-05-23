import { existsSync, rmSync } from "node:fs";

const userAgent = process.env.npm_config_user_agent ?? "";
const npmExecPath = process.env.npm_execpath ?? "";

for (const lockfile of ["package-lock.json", "yarn.lock"]) {
  if (existsSync(lockfile)) {
    rmSync(lockfile, { force: true });
  }
}

const isPnpm =
  userAgent.startsWith("pnpm/") ||
  /pnpm(?:\.cjs|\.js|\.mjs)?$/i.test(npmExecPath) ||
  /pnpm/i.test(npmExecPath);

if (!isPnpm) {
  console.error(
    "Use pnpm instead: run `pnpm install` from the repository root.",
  );
  process.exit(1);
}
