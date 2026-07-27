# kiro-cli git-ai hook

This directory holds the per-repo hook config that wires kiro-cli to
[vonage-git-ai](https://github.com/vonage-technology/vonage-git-ai) so every
file kiro writes is attributed to the AI in `git ai status`, `git ai blame`,
and the `vonage-ai-assistant` PR adoption report.

Requires kiro-cli >= v3 and `vgai` installed on your machine.

## Setup

Run once per repo (you only need to read this if you're cloning fresh):

```bash
vgai install-kiro-hooks
git add .kiro/hooks/git-ai.json && git commit -m "chore: enable kiro-cli AI attribution"
# restart kiro-cli — hooks load at session start
```

## Resuming chats

`kiro-cli --resume` skips hook loading
([kiro#7139](https://github.com/kirodotdev/Kiro/issues/7139)). Start a fresh
session and resume from inside it instead:

```bash
kiro-cli chat --v3   # fresh session, hooks load
/chat                # pick your prior conversation in the TUI
```

## Removal

Delete `.kiro/hooks/git-ai.json` from the repo. Nothing else to undo.
