// Pure helpers for the journal note: no Herdr imports, so node can test them.

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const START = "<!-- herdr-desk:start -->";
export const END = "<!-- herdr-desk:end -->";

export function slug(text, fallback = "space") {
  const s = String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return s || fallback;
}

export function today(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function titleFor(date) {
  const d = new Date(`${date}T12:00:00`);
  return `${WEEK[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

const one = (line) => String(line ?? "").split("\n")[0].trim();
const PR_STATE = { open: "open", merged: "merged", closed: "closed" };

export function buildNote({ date, spaceName, repo, branch, commits, prs, changes, agents, errors }) {
  const out = [];
  out.push(repo ? `**Repo** \`${repo}\`${branch ? ` on \`${branch}\`` : ""}` : "**Repo** none found for this space");
  out.push("");
  out.push("## Commits");
  out.push(...(commits.length ? commits.map((c) => `- \`${c.time}\` \`${c.hash}\` ${c.subject}`) : ["- none"]));
  out.push("");
  out.push("## Pull requests");
  out.push(...(prs.length ? prs.map((p) => {
    const state = p.isDraft ? "draft" : (PR_STATE[String(p.state).toLowerCase()] ?? String(p.state).toLowerCase());
    return `- [#${p.number}](${p.url}) ${p.title} · ${state}`;
  }) : ["- none"]));
  out.push("");
  out.push("## Uncommitted");
  out.push(...(changes.length ? changes.map((c) => `- ${c}`) : ["- none"]));
  out.push("");
  out.push("## Agents");
  out.push(...(agents.length ? agents.map((a) => `- ${a.title} · ${a.app} · ${a.status}`) : ["- none"]));
  if (errors.length) {
    out.push("");
    out.push("## Problems");
    out.push(...errors.map((e) => `- ${one(e)}`));
  }
  return out.join("\n");
}

// Replace only the generated block, so anything the person wrote under it stays.
export function merge(existing, block, header) {
  const wrapped = `${START}\n${block}\n${END}`;
  if (!existing || !existing.trim()) return `# ${header}\n\n${wrapped}\n\n## Notes\n`;
  const a = existing.indexOf(START), b = existing.indexOf(END);
  if (a >= 0 && b > a) return existing.slice(0, a) + wrapped + existing.slice(b + END.length);
  return `# ${header}\n\n${wrapped}\n\n## Earlier\n\n${existing.trim()}\n`;
}
