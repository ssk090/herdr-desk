import { test } from "node:test";
import assert from "node:assert/strict";
import { START, END, buildNote, merge, slug, titleFor, today } from "../mods/journal/build.js";

const base = {
  date: "2025-08-14",
  spaceName: "chip1-transaction",
  repo: "/Users/me/work/chip1-transaction",
  branch: "develop",
  commits: [{ hash: "3f2a1b", time: "14:03", subject: "Fix login redirect" }],
  prs: [{ number: 1678, title: "Fix login redirect", state: "MERGED", isDraft: false, url: "https://github.com/x/y/pull/1678" }],
  changes: ["M src/Login.java"],
  agents: [{ title: "Fix login redirect", app: "claude-code", status: "done" }],
  errors: [],
};

test("slug keeps names path-safe", () => {
  assert.equal(slug("Chip1 Transaction!"), "chip1-transaction");
  assert.equal(slug("../../etc"), "etc");
  assert.equal(slug("", "space"), "space");
});

test("titleFor is stable and human", () => {
  assert.equal(titleFor("2025-08-14"), "Thu 14 Aug 2025");
});

test("buildNote writes every section", () => {
  const note = buildNote(base);
  assert.match(note, /\*\*Repo\*\* `\/Users\/me\/work\/chip1-transaction` on `develop`/);
  assert.match(note, /## Commits\n- `14:03` `3f2a1b` Fix login redirect/);
  assert.match(note, /- \[#1678\]\(https:\/\/github.com\/x\/y\/pull\/1678\) Fix login redirect · merged/);
  assert.match(note, /## Uncommitted\n- M src\/Login.java/);
  assert.match(note, /## Agents\n- Fix login redirect · claude-code · done/);
  assert.doesNotMatch(note, /## Problems/);
});

test("buildNote says none, and lists problems", () => {
  const note = buildNote({ ...base, repo: null, commits: [], prs: [], changes: [], agents: [], errors: ["gh: not logged in\nmore"] });
  assert.match(note, /\*\*Repo\*\* none found/);
  assert.match(note, /## Commits\n- none/);
  assert.match(note, /## Problems\n- gh: not logged in/);
});

test("merge starts a new note with its heading and a Notes section", () => {
  const out = merge(null, "BLOCK", "Thu 14 Aug 2025 · x");
  assert.equal(out, `# Thu 14 Aug 2025 · x\n\n${START}\nBLOCK\n${END}\n\n## Notes\n`);
});

test("merge replaces only the generated block", () => {
  const old = `# Old\n\n${START}\nOLD\n${END}\n\n## Notes\nmine\n`;
  const out = merge(old, "NEW", "ignored");
  assert.equal(out, `# Old\n\n${START}\nNEW\n${END}\n\n## Notes\nmine\n`);
});

test("merge keeps a hand-written file instead of clobbering it", () => {
  const out = merge("# my own notes\n", "BLOCK", "H");
  assert.match(out, /^# H\n\n<!-- herdr-desk:start -->\nBLOCK/);
  assert.match(out, /## Earlier\n\n# my own notes/);
});
