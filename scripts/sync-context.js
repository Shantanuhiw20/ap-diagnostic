#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS script, run directly with `node`, not bundled */
/**
 * Copies the project's authoring source (personas, skills, agents, sample data)
 * from the project root into ey-fin-os/context/, replacing whatever is there.
 *
 * Local-only. This is intentionally not wired into predev/prebuild: the
 * copied context is meant to be committed or otherwise placed deliberately,
 * not regenerated as a build side effect on every machine that builds this app.
 * Run by hand: npm run sync-context
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const appRoot = path.resolve(__dirname, "..");
const contextRoot = path.join(appRoot, "context");

const targets = [
  { src: path.join(projectRoot, "personas"), dest: path.join(contextRoot, "personas") },
  { src: path.join(projectRoot, ".claude", "skills"), dest: path.join(contextRoot, "skills") },
  { src: path.join(projectRoot, ".claude", "agents"), dest: path.join(contextRoot, "agents") },
  { src: path.join(projectRoot, "sample-data"), dest: path.join(contextRoot, "sample-data") },
];

function countEntries(dir) {
  let files = 0;
  let folders = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      folders += 1;
      const sub = countEntries(path.join(dir, entry.name));
      files += sub.files;
      folders += sub.folders;
    } else {
      files += 1;
    }
  }
  return { files, folders };
}

fs.mkdirSync(contextRoot, { recursive: true });

console.log(`Syncing context into ${path.relative(appRoot, contextRoot)}${path.sep}\n`);

let synced = 0;
let skipped = 0;

for (const { src, dest } of targets) {
  const label = path.relative(appRoot, dest);

  if (!fs.existsSync(src)) {
    console.log(`  skip   ${label}  (source not found: ${path.relative(projectRoot, src)})`);
    skipped += 1;
    continue;
  }

  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });

  const { files, folders } = countEntries(dest);
  console.log(`  synced ${label}  (${files} files, ${folders} folders)`);
  synced += 1;
}

console.log(`\nDone. ${synced} folder(s) synced, ${skipped} skipped.`);
