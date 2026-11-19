# Leonida Platinum

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/people871/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/people871/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

An offline guide and progress tracker for every PS5 trophy in Grand Theft Auto VI — all 55 official trophies, in one static page that never talks to the network.

## What is verified

- **55 / 55 official trophies** — names, descriptions and grades checked against live trophy listings: 1 platinum, 2 gold, 6 silver, 46 bronze.
- **13 / 15 guide steps cited** — the four showcase guides are written as numbered steps, and 13 of their 15 steps carry a source citation.
- **Source matrix** — every trophy lists its sources, so each claim can be traced back to where it came from.
- **1 possibly missable trophy** — a single flag, worded carefully, for the one trophy that can be locked out by story progress. Nine further trophies are marked as watch items because no confirmed unlock method exists yet.
- **28 hidden trophies** — hidden entries stay masked by the spoiler shield until earned, so story moments are not spoiled by the list itself.
- **Offline tracker, zero network** — the app runs entirely from local files. No requests, no fonts, no analytics, no accounts.

## Features

- **Checklist for all 55 trophies** — tick trophies off as you earn them; progress is saved in your browser and survives reloads.
- **Numbered, sourced guides** — each trophy shows its official description plus step-by-step guidance with citations, and a short summary for a quick read.
- **Six-stage platinum roadmap** — trophies grouped into six stages in play order, with per-stage earned counts and a "next up" list.
- **Filters and spoiler shield** — filter by grade, kind, hidden status, missable-only, earned or remaining, or free text. The spoiler shield masks hidden trophies until you earn them.
- **Export and import (JSON)** — download your progress as a file, or restore it later on any machine.
- **Target counters** — trophies with a numeric goal (for example meditation spots) get a saved counter with plus/minus controls.

## Run it locally

```bash
# from the repository root
python3 -m http.server 8000 --directory app
# then open http://localhost:8000
```

Any static file server works — the app is plain HTML, CSS and JavaScript with a JSON data file, and needs no build step. Opening `app/index.html` directly in a browser works too.

Useful links: `?view=roadmap` opens the platinum roadmap, `?view=missable` shows the missable and watch lists, and `?spoiler=on` turns the spoiler shield on.

## Notes

Trophy details were checked against public trophy databases in November 2026. Where sources disagree, or where no reliable unlock method is confirmed yet, the guide says so instead of guessing. Counts that could not be verified are left out rather than invented.

---

Referral code: `t9cvg4vb`
