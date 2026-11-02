# herdr-desk

Two small mods for the [Herdr](https://herdr.dev) desktop app, plus the top-bar
buttons that open them:

- **Snippets**: the commands you keep retyping, pinned per space. Click one and
  it is pasted into the terminal that had the keyboard, then the shelf closes.
- **Journal**: a dated markdown note per space, collecting that day's commits,
  pull requests, uncommitted files and agent work.

## Install

Ask your Herdr agent: *"install the mods from github.com/ssk090/herdr-desk"*,
or copy them by hand:

```sh
git clone https://github.com/ssk090/herdr-desk
cp -R herdr-desk/mods/snippets herdr-desk/mods/journal herdr-desk/mods/desk-bar ~/.config/herdr-app/mods/
herdr-app check ~/.config/herdr-app/mods/snippets
herdr-app check ~/.config/herdr-app/mods/journal
herdr-app check ~/.config/herdr-app/mods/desk-bar
```

### The top-bar buttons

Add one block to the `top-bar` row of your layout, before the other buttons:

```json
{
  "id": "desk-bar",
  "type": "block",
  "content": { "mod": "desk-bar" },
  "size": { "px": 66 }
}
```

That is two 28px buttons: a bolt (snippets) and a book (journal). If you would
rather not touch the top bar, bind keys instead:

```json
"cmd-alt-s": "mod.open:snippets",
"cmd-alt-j": "mod.open:journal"
```

## Snippets

- Opened from the bolt, `mod.open:snippets`, or as a pane
  (`pane.split {mod: "snippets"}`).
- **+** adds a snippet for the shown space, **✎** edits it, **×** deletes it.
- Clicking a snippet writes it to the clipboard, focuses the terminal that was
  in front when the shelf opened, and sends Ctrl+V. It does not press Enter, so
  you can edit the command first.
- Snippets live in Herdr's shared state (`shared.json`), keyed by space id, so
  they follow across layouts and restarts but are not in any repository.

## Journal

- Opened from the book, `mod.open:journal`, or as a pane.
- **Collect** walks the space's repository and writes
  `~/.config/herdr-app/journal/<space>-<id>/<YYYY-MM-DD>.md`:
  - commits from today, authored by your `git config user.email` (all authors
    when that is not set)
  - pull requests you authored and that changed today, when `gh` is available
  - uncommitted changes
  - each agent in the space, with the task it reported and its status
- Only the block between `<!-- herdr-desk:start -->` and
  `<!-- herdr-desk:end -->` is rewritten. Whatever you write under `## Notes`
  stays.
- Spaces on another machine are read through `herdr-core` (`git` and `gh` run
  there); the note itself is written on this machine.

### What it does not do

- It does not run on its own. Nothing is collected until you open the journal or
  press Collect.
- Agent lines are the title and status the agent reports in the tab, not a
  written summary.
- PRs you only reviewed are not listed.

## Layout

```
mods/snippets/    the shelf
mods/journal/     the note collector and viewer
mods/desk-bar/    the two top-bar buttons
tests/            node tests for the note's markdown
```

Run the tests with `node --test`.

## License

MIT
