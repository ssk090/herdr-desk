// Top-bar buttons for the desk mods: open the snippet shelf or the day journal.

import { View, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { run, theme } from "herdr";

export default class DeskBar extends View {
  render() {
    const t = theme();
    const button = (mod, icon) => h_flex().id(`desk-${mod}`).w(28).h(28).items_center().justify_center().rounded(7)
      .cursor_pointer().text_color(t.dim).hover((s) => s.bg(t.surface).text_color(t.foreground))
      .on_click(() => run("mod.open", { name: mod }))
      .child(svg(`mods/desk-bar/${icon}.svg`).size(17));
    return h_flex().id("desk-bar").size_full().items_center().justify_center().gap(2)
      // The bar drags the window; the press belongs to the button.
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .child(button("snippets", "bolt"))
      .child(button("journal", "book"));
  }
}
