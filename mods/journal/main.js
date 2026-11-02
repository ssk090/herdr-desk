// A dated note per space: today's commits, pull requests, uncommitted files and
// agent work, collected with git, gh and herdr. Written under
// <app home>/journal/<space>/<date>.md, and only the generated block is replaced.

import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { appHome, agents, closeOverlay, exec, panes, props, readTextFile, settings, spaces, shared, setShared, terminals, theme, writeTextFile } from "herdr";
import { buildNote, merge, slug, titleFor, today } from "./build.js";

async function sh(cmd, args, opts) {
  try {
    const r = await exec(cmd, args, opts);
    return { code: r.code, out: r.stdout ?? "", err: r.stderr ?? "" };
  } catch (e) {
    return { code: -1, out: "", err: String(e?.message ?? e) };
  }
}

const firstLine = (text) => String(text ?? "").split("\n").find((l) => l.trim()) ?? "";

function dirFor(space) {
  const dirs = shared("journal.dirs") ?? {};
  if (dirs[space.id]) return dirs[space.id];
  const dir = `${slug(space.name)}-${space.id.slice(-6)}`;
  setShared("journal.dirs", { ...dirs, [space.id]: dir });
  return dir;
}

async function gather(space) {
  const errors = [];
  const tabIds = new Set(space.tabs.map((t) => t.id));
  const cwd = panes().find((p) => tabIds.has(p.tab) && p.cwd)?.cwd ?? space.folder ?? null;
  const on = space.machine ?? null;
  const date = today();
  let repo = null;
  let branch = space.branch ?? null;

  if (cwd) {
    const top = await sh("git", ["rev-parse", "--show-toplevel"], { cwd, on });
    if (top.code === 0) repo = top.out.trim();
    else errors.push(`git: ${firstLine(top.err)}`);
  } else {
    errors.push("git: this space has no folder");
  }

  let commits = [], changes = [], prs = [];
  if (repo) {
    const email = (await sh("git", ["config", "user.email"], { cwd: repo, on })).out.trim();
    const args = ["log", `--since=${date} 00:00:00`, "--date=format:%H:%M", "--pretty=format:%h%x09%ad%x09%s", "-n", "100"];
    if (email) args.push(`--author=${email}`);
    const log = await sh("git", args, { cwd: repo, on });
    if (log.code === 0) {
      commits = log.out.split("\n").filter(Boolean).map((line) => {
        const [hash, time, ...subject] = line.split("\t");
        return { hash, time, subject: subject.join("\t") };
      });
    } else errors.push(`git log: ${firstLine(log.err)}`);

    const status = await sh("git", ["status", "--porcelain=v1", "--untracked-files=normal"], { cwd: repo, on });
    if (status.code === 0) changes = status.out.split("\n").filter(Boolean).slice(0, 30);
    else errors.push(`git status: ${firstLine(status.err)}`);

    const gh = await sh("gh", ["pr", "list", "--author", "@me", "--state", "all", "--search", `updated:>=${date}`,
      "--json", "number,title,state,isDraft,url", "--limit", "30"], { cwd: repo, on });
    if (gh.code === 0) {
      try { prs = JSON.parse(gh.out); } catch (e) { errors.push(`gh: ${firstLine(e.message)}`); }
    } else if (firstLine(gh.err)) errors.push(`gh: ${firstLine(gh.err)}`);
  }

  const subs = new Set(terminals().filter((t) => t.parent).map((t) => t.address));
  const work = agents()
    .filter((a) => a.space === space.id && !subs.has(a.address))
    .map((a) => ({ title: a.title || a.program?.name || a.app || "agent", app: a.app ?? a.program?.key ?? "agent", status: a.status }));

  const block = buildNote({ date, spaceName: space.name, repo, branch, commits, prs, changes, agents: work, errors });
  return { block, header: `${titleFor(date)} · ${space.name}`, date };
}

export default class Journal extends View {
  init(_props, cx) {
    this.spaceId = null;
    this.text = "";
    this.path = null;
    this.status = "";
    this.problems = [];
    this.busy = false;
    this.handle = cx.focus_handle();
    if (props()?.overlay) this.handle.focus();
    this.collect(cx);
  }

  space() {
    const all = spaces();
    return this.spaceId ? (all.find((s) => s.id === this.spaceId) ?? all.find((s) => s.active) ?? null) : (all.find((s) => s.active) ?? null);
  }

  collect(cx) {
    const space = this.space() ?? spaces().find((s) => s.active);
    if (!space || this.busy) return;
    this.spaceId = space.id;
    this.busy = true;
    this.status = "Collecting…";
    cx.notify();
    cx.spawn(async (cx) => {
      let problems = [];
      try {
        const { block, header } = await gather(space);
        const dir = dirFor(space);
        const path = `${appHome()}/journal/${dir}/${today()}.md`;
        const existing = await readTextFile(path);
        const text = merge(existing, block, header);
        if (text !== existing) await writeTextFile(path, text, existing);
        this.path = path;
        this.text = text;
        this.status = `Updated ${new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
      } catch (e) {
        this.status = "Collection failed";
        problems = [String(e?.message ?? e)];
      }
      this.problems = problems;
      this.busy = false;
      cx.notify();
    });
  }

  copy(text, cx, what) {
    cx.write_to_clipboard(text);
    this.status = `Copied ${what}`;
    cx.notify();
  }

  // Bold and code marks become styling; the note's HTML markers never show.
  inline(text, t, mono, size) {
    const out = [];
    const push = (el) => out.push(el);
    text.split("`").forEach((part, i) => {
      if (i % 2) { push(div().font_family(mono).text_size(size - 1).text_color(t.accent).child(part)); return; }
      part.split("**").forEach((run, j) => {
        if (run) push(div().text_size(size).text_color(t.foreground).when(j % 2 === 1, (el) => el.font_semibold()).child(run));
      });
    });
    return out;
  }

  render(cx) {
    const t = theme(), mono = settings().font_family ?? "JetBrains Mono";
    const space = spaces().find((s) => s.active) ?? null;
    const overlay = props()?.overlay;
    if (!overlay && space && space.id !== this.spaceId) {
      this.spaceId = space.id;
      this.text = "";
      this.status = "";
      this.collect(cx);
    }
    const name = this.space()?.name ?? "";

    const button = (id, text, primary, action) => h_flex().id(id).h(26).px(10).items_center().justify_center().rounded(7).border_1()
      .border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(11.5).font_medium().cursor_pointer()
      .hover((s) => s.opacity(0.88)).on_click(action).child(text);

    const header = h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
      .child(div().font_semibold().child("Journal"))
      .when(Boolean(name), (el) => el.child(div().text_size(11.5).text_color(t.dim).truncate().child(name)))
      .child(div().flex_1().min_w(0))
      .child(button("jr-collect", this.busy ? "Collecting…" : "Collect", true, () => this.collect(cx)))
      .child(button("jr-copy", "Copy", false, (_e, c) => this.copy(this.text, c, "note")))
      .when(Boolean(overlay), (el) => el.child(button("jr-close", "×", false, () => closeOverlay(overlay))));

    const rows = this.text.split("\n").filter((line) => !line.trim().startsWith("<!--")).map((line) => {
      if (line.startsWith("# ")) return div().px(14).pt(12).pb(4).text_size(15).font_semibold().text_color(t.foreground).child(line.slice(2));
      if (line.startsWith("## ")) return div().px(14).pt(14).pb(3).text_size(11.5).font_semibold().text_color(t.muted).child(line.slice(3).toUpperCase());
      if (line.startsWith("- ")) return h_flex().px(14).py(1.5).gap(7).items_start()
        .child(div().flex_none().text_size(12.5).text_color(t.dim).child("•"))
        .child(div().flex_1().min_w(0).children(this.inline(line.slice(2), t, mono, 12.5)));
      if (!line.trim()) return div().h(4);
      return div().px(14).py(1.5).children(this.inline(line, t, mono, 12));
    });

    return v_flex().id("journal").track_focus(this.handle).size_full().min_h(0)
      .rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border)
      .text_color(t.foreground)
      .on_key_down((e, cx) => { if (e.key === "escape" && overlay) { closeOverlay(overlay); cx.stop_propagation(); } })
      .child(header)
      .when(this.problems.length > 0, (el) => el.child(div().px(14).py(6).text_size(11).text_color(t.ansi1)
        .child(this.problems.join(" · "))))
      .child(this.text
        ? v_flex().flex_1().min_h(0).overflow_y_scrollbar().py(4).children(rows)
        : div().flex_1().p(14).text_color(t.dim).child(this.status || "Nothing yet"))
      .child(h_flex().flex_none().h(28).px(14).gap(8).items_center().border_t(1).border_color(t.border).text_size(10.5).text_color(t.dim)
        .child(div().flex_1().min_w(0).truncate().child(this.path ?? this.status))
        .when(Boolean(this.path), (el) => el.child(div().cursor_pointer().hover((s) => s.text_color(t.foreground))
          .on_click((_e, c) => this.copy(this.path, c, "path")).child("Copy path"))));
  }
}
