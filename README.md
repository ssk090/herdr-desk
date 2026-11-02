# herdr-desk

The **Snippets** mod for the [Herdr](https://herdr.dev) desktop app: a shelf of
the commands you keep retyping, pinned per space, one click to paste into the
focused terminal.

![Snippets](preview.png)

## Install

```sh
git clone https://github.com/ssk090/herdr-desk
cp -R herdr-desk/mods/snippets ~/.config/herdr-app/mods/
herdr-app check ~/.config/herdr-app/mods/snippets
```

Add the bolt to the top bar by putting this block in the `top-bar` row of your
layout (clone a shipped layout first if needed):

```json
{
  "id": "snippets",
  "type": "block",
  "content": { "mod": "snippets", "props": { "bar": true } },
  "size": { "px": 38 }
}
```

Or leave the layout alone and map a key, from `keys.json` in this repo:

```json
"cmd-alt-s": "mod.open:snippets"
```

## Use

- The bolt, `mod.open:snippets`, or a pane (`pane.split {mod: "snippets"}`).
- Type in the field at the bottom, Enter or Add saves it for the shown space.
- `✎` loads a snippet back into the field; `×` deletes it.
- Click a snippet to paste it into the terminal that was in front. It does not
  press Enter, so you can edit the command first.
- Snippets are per space, stored in Herdr's shared state. They survive restarts
  but are not in any repository.

## What it touches

`shared.json` only. No `exec`, no `hc`, no network, no files outside the mod's
own folder.

## License

MIT
