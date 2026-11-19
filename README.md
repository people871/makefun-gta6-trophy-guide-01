# Leonida Platinum — GTA 6 Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/people871/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/people871/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An entry for the [make.fun](https://make.fun/) bounty
**gta6-trophy-guide-01 — "Build the best GTA 6 trophy guide"**
($250 prize pool, entries close 21 November 2026 11:00 UTC).

An offline web app that guides and tracks all **55 PlayStation 5 trophies**
of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them
hidden — with a guide in our own words and named sources for every trophy, a
6-stage platinum roadmap, **1 confirmed missable trophy**
(Positive Mental Attitude), filters by grade/kind/hidden/missable/earned, a
spoiler shield that hides story trophies until earned, progress saved in the
browser (localStorage), and JSON export/import. No network requests at run
time; every file lives under `app/` and the guide works with the network off.

Run it: `node serve.ts` then open http://localhost:8080 — or serve `app/`
with any static server.

Hand it in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`
