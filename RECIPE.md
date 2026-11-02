# Recipe: install herdr-desk

Written for a Herdr agent. Copy the two mods, add the button, check everything.

## 1. Copy

```sh
cp -R mods/snippets mods/desk-bar ~/.config/herdr-app/mods/
```

If a mod with one of those names already exists, do not overwrite it: clone this
repo's folder under another name and rewrite `mod: "<name>"` in the layout block
below to match.

## 2. Add the top-bar button

In the user's shown layout (`herdr-app status` -> `layout`), find the row with
`"id": "top-bar"` and add this block as a child, before the existing buttons:

```json
{
  "id": "desk-bar",
  "type": "block",
  "content": { "mod": "desk-bar" },
  "size": { "px": 38 }
}
```

Shipped layouts are replaced on every start, so if the layout is `main` or
`terminals`, clone it first (`layout.clone {name, as}`) and switch to the clone.
Do not edit a shipped layout in place.

If the user would rather use a key, skip this step and add to `keys.json`:

```json
"global": {
  "cmd-alt-s": "mod.open:snippets"
}
```

Ask before adding a key they already use.

## 3. Check

```sh
herdr-app check ~/.config/herdr-app/mods/snippets
herdr-app check ~/.config/herdr-app/mods/desk-bar
herdr-app status        # "errors": []
```

Then open it once (`herdr-app do mod.open '{"name":"snippets"}'`) and look at
the window. `herdr-app shot file.png` saves a frame, but it can lag while the
app is in the background; focus the app first.

## 4. Tell the user

- The bolt opens Snippets.
- Snippets are per space and stored in Herdr's shared state, not in this repo.
- Clicking one pastes it into the terminal that was in front. It does not press
  Enter.
