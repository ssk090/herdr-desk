// Pinned commands for the shown space. Click one to paste it into the terminal
// that had the keyboard when this opened, then this closes (when it is an overlay).

import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { spaces, focused, run, shared, setShared, theme, props, closeOverlay, settings } from "herdr";

const EMPTY = {};

function map() { return shared("snippets") ?? EMPTY; }
function listFor(id) { return map()[id] ?? []; }

function store(id, list) {
  const next = { ...map() };
  if (list.length) next[id] = list; else delete next[id];
  setShared("snippets", next);
}

export default class Snippets extends View {
  init(_props, cx) {
    this.spaceId = null;
    this.target = null;
    this.mode = null;        // null | "add" | "edit"
    this.editIndex = -1;
    this.draft = "";
    this.typing = false;
    this.input = InputState.new({ value: "" });
    this.input.on("change", (_e, cx) => { this.draft = this.input.value(); cx.notify(); });
    this.input.on("submit", (_e, cx) => this.save(cx));
    this.input.on("focus", (_e, cx) => { this.typing = true; cx.notify(); });
    this.input.on("blur", (_e, cx) => { this.typing = false; cx.notify(); });
    this.handle = cx.focus_handle();
    if (props()?.overlay) this.handle.focus();
  }

  start(mode, index, cx) {
    this.mode = mode;
    this.editIndex = index;
    this.draft = mode === "edit" ? (listFor(this.spaceId)[index]?.t ?? "") : "";
    this.input.set_value(this.draft);
    this.input.set_selected_range({ start: 0, end: this.draft.length });
    this.input.focus();
    cx.timer.after(400, () => this.input.focus());
    cx.notify();
  }

  save(cx) {
    const text = this.draft.trim();
    if (!text || !this.spaceId) { this.cancel(cx); return; }
    const list = listFor(this.spaceId);
    if (this.mode === "edit" && list[this.editIndex]) {
      store(this.spaceId, list.map((s, i) => (i === this.editIndex ? { ...s, t: text } : s)));
    } else {
      store(this.spaceId, [{ t: text, at: Date.now() }, ...list]);
    }
    this.cancel(cx);
  }

  cancel(cx) {
    this.mode = null;
    this.editIndex = -1;
    this.draft = "";
    this.input.set_value("");
    this.handle.focus();
    cx.notify();
  }

  remove(index, cx) {
    store(this.spaceId, listFor(this.spaceId).filter((_, i) => i !== index));
    cx.notify();
  }

  // Copy, refocus the terminal that was in front, paste, close.
  paste(text, cx) {
    const f = focused();
    const target = f?.terminal ? { pane: f.pane, terminal: f.terminal } : this.target;
    cx.write_to_clipboard(text);
    if (target?.pane) run("pane.focus", { pane: target.pane });
    else if (target?.terminal) run("pane.focus", { terminal: target.terminal });
    const overlay = props()?.overlay;
    if (overlay) closeOverlay(overlay);
    run("terminal.paste");
  }

  mini(t, glyph, color, action) {
    return h_flex().flex_none().w(22).h(22).items_center().justify_center().rounded(5).cursor_pointer()
      .text_color(color).hover((s) => s.bg(t.hover))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click(action).child(div().text_size(12).child(glyph));
  }

  render(cx) {
    const t = theme(), mono = settings().font_family ?? "JetBrains Mono";
    const space = spaces().find((s) => s.active) ?? null;
    const id = space?.id ?? null;
    if (id !== this.spaceId) {
      this.spaceId = id;
      this.mode = null;
      this.target = null;
    }
    const f = focused();
    if (f?.terminal && f.space === id) this.target = { pane: f.pane, terminal: f.terminal };
    const list = id ? listFor(id) : [];
    const overlay = props()?.overlay;

    const header = h_flex().h(42).flex_none().px(14).gap(8).items_center().border_b(1).border_color(t.border)
      .child(div().font_semibold().child("Snippets"))
      .when(Boolean(space), (el) => el.child(div().text_size(11.5).text_color(t.dim).truncate().child(space.name)))
      .child(div().flex_1().min_w(0))
      .child(this.button("sn-add", "+", t, !id || this.mode === "add", () => this.start("add", -1, cx)))
      .when(Boolean(overlay), (el) => el.child(this.button("sn-close", "×", t, false, () => closeOverlay(overlay))));

    const row = (s, i) => h_flex().id(`sn-${i}`).h(34).flex_none().px(10).gap(8).items_center().rounded(7).cursor_pointer()
      .hover((el) => el.bg(t.hover))
      .on_click((_e, cx) => this.paste(s.t, cx))
      .child(div().flex_1().min_w(0).truncate().font_family(mono).text_size(12).text_color(t.foreground).child(s.t))
      .child(this.mini(t, "✎", t.muted, () => this.start("edit", i, cx)))
      .child(this.mini(t, "×", t.ansi1, () => this.remove(i, cx)));

    const footer = this.mode
      ? h_flex().flex_none().p(10).gap(8).items_center().border_t(1).border_color(t.border)
        .child(h_flex().flex_1().min_w(0).h(32).px(10).items_center().rounded(8).border_1()
          .border_color(this.typing ? t.accent : t.input).bg(t.background)
          .child(Input.new(this.input).h_full().w_full().text_size(12).text_color(t.foreground)))
        .child(this.button("sn-save", this.mode === "edit" ? "Save" : "Add", t, true, () => this.save(cx)))
        .child(this.button("sn-cancel", "Cancel", t, false, () => this.cancel(cx)))
      : div().flex_none().px(14).py(8).text_size(11).text_color(t.dim)
        .child(list.length ? "Click a snippet to paste it into the focused terminal." : "No snippets yet. Press + to add.");

    return v_flex().id("snippets").track_focus(this.handle).size_full().min_h(0)
      .rounded(10).overflow_hidden().bg(t.background).border_1().border_color(t.border)
      .text_color(t.foreground).text_size(12.5)
      .child(header)
      .child(v_flex().flex_1().min_h(0).overflow_y_scrollbar().p(6).children(list.map(row)))
      .child(footer);
  }

  button(id, text, t, primary, action) {
    return h_flex().id(id).h(28).px(11).items_center().justify_center().rounded(7).border_1()
      .border_color(primary ? t.solid : t.input).bg(primary ? t.solid : t.raised)
      .text_color(primary ? t.solid_foreground : t.foreground).text_size(11.5).font_medium().cursor_pointer()
      .hover((s) => s.opacity(0.88)).on_click(action).child(text);
  }
}
