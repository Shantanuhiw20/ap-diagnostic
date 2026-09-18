import { access, readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

// Everything the app knows (persona, skills, sample data) lives here, synced
// in from the project root by `npm run sync-context`. The app must never
// read outside it, not even to reach files that exist one level up in the
// same repo.
const CONTEXT_ROOT = resolve(process.cwd(), "context");

function resolveContextPath(relativePath: string): string {
  if (relativePath.split(/[\\/]/).includes("..")) {
    throw new Error(
      `Refusing to read "${relativePath}": ".." is not allowed, paths must stay inside context/.`,
    );
  }

  const resolved = resolve(CONTEXT_ROOT, relativePath);

  // Belt and suspenders beyond the ".." check above: confirm the resolved
  // path is still actually inside CONTEXT_ROOT before touching the disk.
  if (resolved !== CONTEXT_ROOT && !resolved.startsWith(CONTEXT_ROOT + sep)) {
    throw new Error(`Refusing to read "${relativePath}": resolves outside context/.`);
  }

  return resolved;
}

export async function readContextFile(relativePath: string): Promise<string> {
  return readFile(resolveContextPath(relativePath), "utf8");
}

export async function contextFileExists(relativePath: string): Promise<boolean> {
  try {
    await access(resolveContextPath(relativePath));
    return true;
  } catch {
    return false;
  }
}
