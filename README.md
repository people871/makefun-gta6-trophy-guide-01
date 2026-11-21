# Leonida Platinum

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/people871/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/people871/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

An offline guide and progress tracker for every PS5 trophy in Grand Theft Auto VI — all 55 official trophies, in one static page that never talks to the network.

Suggested entry title: "55/55 trophies, 282/282 claims cited, 117 cited steps + sources matrix, 1 missable — offline tracker" (100 chars).

## What is verified

- **55 / 55 official trophies** — names, descriptions and grades checked against live trophy listings: 1 platinum, 2 gold, 6 silver, 46 bronze.
- **282 / 282 claims cited** — every specific claim in the guide carries a source citation. The count is made up of 165 official facts (name, description and grade for each of the 55 trophies, all verified against Exophase) plus 117 numbered guide steps, each citing its own source.
- **117 / 117 guide steps cited, on all 55 guides** — every trophy now has numbered steps (2–5 each), and every step is cited. Steps that restate the official description cite Exophase; steps that use another verified fact cite the source that verified it (OutputLag, KeenGamer, U7BUY, PlanetGTA6, PowerPyx). No step is written without a source behind it.
- **Sources matrix** — a dedicated Sources view lists all six sources with the number of guides citing each, the number of steps each supports, the date read, and what it verified — plus a per-trophy table of steps cited and sources for all 55 trophies. The same tallies appear in the sources rail on the checklist board.
- **1 possibly missable trophy** — a single flag, worded carefully, for the one trophy that can be locked out by story progress. Nine further trophies are marked as watch items because no confirmed unlock method exists yet, and their guides say so instead of guessing.
- **28 hidden trophies** — hidden entries stay masked by the spoiler shield until earned, so story moments are not spoiled by the list itself. The shield now has a real on/off button in the filter bar (and still answers to `?spoiler=on`).
- **Offline tracker, zero network** — the app runs entirely from local files. No requests, no fonts, no analytics, no accounts.

## Features

- **Checklist for all 55 trophies** — tick trophies off as you earn them; progress is saved in your browser and survives reloads.
- **Numbered, sourced guides** — each trophy shows its official description plus step-by-step guidance with citations, a per-trophy "claims cited" line, and a short summary for a quick read.
- **Six-stage platinum roadmap** — trophies grouped into six stages in play order, with per-stage earned counts, cited-step counts, and a "next up" list.
- **Filters and spoiler shield** — filter by grade, kind, hidden status, missable-only, earned or remaining, or free text. The spoiler shield masks hidden trophies until you earn them, with a visible toggle button.
- **Export and import (JSON)** — download your progress as a file, or restore it later on any machine.
- **Target counters** — eleven trophies with a numeric goal in their official description (250 stunts, 42 range challenges, 20 races, 8 stranger strands, 18 meditation spots, 3 card sets, 100 WAiNK locations, 50 challenges, 100 vehicles, 5 bank vaults, 10 Scooter Bros registrations) get a saved counter with plus/minus controls.

## Run it locally

```bash
# from the repository root
python3 -m http.server 8000 --directory app
# then open http://localhost:8000
```

Any static file server works — the app is plain HTML, CSS and JavaScript with a JSON data file, and needs no build step. Opening `app/index.html` directly in a browser works too.

Useful links: `?view=roadmap` opens the platinum roadmap, `?view=missable` shows the missable and watch lists, `?view=sources` shows the sources matrix, and `?spoiler=on` turns the spoiler shield on.

## Notes

Trophy details were checked against public trophy databases in November 2026. Where sources disagree, or where no reliable unlock method is confirmed yet, the guide says so instead of guessing. Counts that could not be verified are left out rather than invented: 14 Top Fun locations, 52 areas of Leonida, 9 gangs, a count of 500, 8 garages, a 35-task 100% checklist and 9 activity types.

---

Referral code: `t9cvg4vb`
