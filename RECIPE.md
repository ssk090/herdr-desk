# Recipe: install herdr-desk

Written for a Herdr agent. Copy the three mods, add the bar, check everything.

## 1. Copy

```sh
cp -R mods/snippets mods/journal mods/desk-bar ~/.config/herdr-app/mods/
```

If a mod with one of those names already exists, do not overwrite it: clone this
repo's folder under another name and rewrite `mod: "<name>"` in the layout block
below to match.

## 2. Add the top-bar buttons

In the user's shown layout (`herdr-app status` -> `layout`), find the row with
`"id": "top-bar"` and add this block as a child, before the existing buttons:

```json
{
  "id": "desk-bar",
  "type": "block",
  "content": { "mod": "desk-bar" },
  "size": { "px": 66 }
}
```

Shipped layouts are replaced on every start, so if the layout is `main` or
`terminals`, clone it first (`layout.clone {name, as}`) and switch to the clone.
Do not edit a shipped layout in place.

If the user would rather use keys, skip this step and add to `keys.json`:

```json
"global": {
  "cmd-alt-s": "mod.open:snippets",
  "cmd-alt-j": "mod.open:journal"
}
```

Ask before adding a key they already use.

## 3. Check

```sh
herdr-app check ~/.config/herdr-app/mods/snippets
herdr-app check ~/.config/herdr-app/mods/journal
herdr-app check ~/.config/herdr-app/mods/desk-bar
herdr-app status        # "errors": []
```

Then open each once (`herdr-app do mod.open '{"name":"snippets"}'`) and look at
the window. `herdr-app shot file.png` saves a frame, but it can lag while the
app is in the background; focus the app first.

## 4. Tell the user

- The bolt opens Snippets, the book opens Journal.
- Snippets are stored in Herdr's shared state, not in this repo.
- Journal notes go to `~/.config/herdr-app/journal/`, one file per space per
  day; `## Notes` under the generated block is never overwritten.
- `gh` is optional: without it the Pull requests section says none.
