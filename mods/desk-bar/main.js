// Top-bar button for the snippet shelf.

import { View, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { openOverlay, theme } from "herdr";

export default class DeskBar extends View {
  render() {
    const t = theme();
    return h_flex().id("desk-bar").size_full().items_center().justify_center()
      // The bar drags the window; the press belongs to the button.
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .child(h_flex().id("desk-snippets").w(28).h(28).items_center().justify_center().rounded(7)
        .cursor_pointer().text_color(t.dim).hover((s) => s.bg(t.surface).text_color(t.foreground))
        .on_click(() => openOverlay({ mod: "snippets", kind: "window", key: "snippets", width: 560, height: 460 }))
        .child(svg("mods/desk-bar/bolt.svg").size(17)));
  }
}
