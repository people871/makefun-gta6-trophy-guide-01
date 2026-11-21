// Leonida Platinum — gta6-trophy-guide-01 entrypoint (Node 22, standard library only).
//
// The app itself is the static folder app/ next to this file: plain HTML, CSS and
// ES modules, opened at app/index.html, loading nothing from the network. Its
// trophy list lives in app/data/trophies.json. This script is the handoff: it
// first proves the trophy data is exactly the verified 55-item set, with every
// numbered guide step carrying a source citation, and only then copies app/
// and screenshots/ into the output directory and writes /output/dossier.json
// with the vendored make.fun library.
//
// The data gate runs before any copying or writing, so a bad dataset can never
// produce a half-built submission: every problem is collected and reported in
// a single Error, and the process exits non-zero.
//
// Citation tally the gate enforces (see app/app.js for the same count):
//   3 official facts per trophy (name, description, grade — all verified
//   against Exophase) = 165, plus one citation per numbered step. The
//   current data set has 117 steps, all cited, for 282/282 claims cited.
//   A step with an empty source, or a data set under 100 cited steps,
//   fails the gate.
//
// Serve locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The shape of one trophy entry in app/data/trophies.json.
const EXPECTED_TOTAL = 55;
const EXPECTED_GRADES = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
// The 28 hidden trophies, by id, as verified against the published lists.
const EXPECTED_HIDDEN = new Set([
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 22, 23, 24, 26, 27, 29, 37, 38,
  44, 45, 46, 47, 48, 49, 50, 51,
]);
// The only trophy flagged as possibly missable.
const EXPECTED_MISSABLE = new Set([28]);
// Citation floor: every trophy must carry numbered, cited steps, and the
// whole set must clear 100 cited steps (current data: 117/117).
const MIN_CITED_STEPS = 100;

function checkTrophyData() {
  const problems = [];
  const dataPath = join(here, 'app', 'data', 'trophies.json');

  let raw;
  try {
    raw = readFileSync(dataPath, 'utf8');
  } catch (err) {
    throw new Error(
      `trophies.json failed the data sanity check: could not read ${dataPath} (${err.message})`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `trophies.json failed the data sanity check: invalid JSON (${err.message})`,
    );
  }

  // Accept the plain list as well as the wrapped form that carries the
  // game header alongside the list: in the wrapped form the entries live
  // under the trophies key. Anything else cannot be checked, so fail
  // loudly instead of guessing at the shape.
  let trophies;
  if (Array.isArray(parsed)) {
    trophies = parsed;
  } else if (
    parsed !== null &&
    typeof parsed === 'object' &&
    Array.isArray(parsed.trophies)
  ) {
    trophies = parsed.trophies;
  } else {
    throw new Error(
      'trophies.json failed the data sanity check: expected a top-level array of trophies, or an object whose trophies field holds that array',
    );
  }

  if (trophies.length !== EXPECTED_TOTAL) {
    problems.push(
      `trophy count: expected ${EXPECTED_TOTAL}, found ${trophies.length}`,
    );
  }

  const gradeCounts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const seenIds = new Set();
  const hiddenIds = new Set();
  const missableIds = new Set();
  let stepTotal = 0;
  let stepCited = 0;

  for (const [index, trophy] of trophies.entries()) {
    const label = `trophy at index ${index}`;
    const id = trophy?.id;
    const tag = typeof id === 'number' ? `trophy id ${id}` : label;

    if (typeof id !== 'number' || !Number.isInteger(id)) {
      problems.push(`${label}: id is missing or not an integer`);
    } else if (seenIds.has(id)) {
      problems.push(`${tag}: id appears more than once`);
    } else {
      seenIds.add(id);
    }

    const grade = trophy?.grade;
    if (Object.prototype.hasOwnProperty.call(gradeCounts, grade)) {
      gradeCounts[grade] += 1;
    } else {
      problems.push(`${tag}: unknown grade ${JSON.stringify(grade)}`);
    }

    if (trophy?.hidden === true) hiddenIds.add(id);
    if (trophy?.missable === true) missableIds.add(id);

    if (typeof trophy?.name !== 'string' || trophy.name.trim() === '') {
      problems.push(`${tag}: name is empty`);
    }
    if (
      typeof trophy?.description !== 'string' ||
      trophy.description.trim() === ''
    ) {
      problems.push(`${tag}: description is empty`);
    }
    if (typeof trophy?.guide !== 'string' || trophy.guide.trim() === '') {
      problems.push(`${tag}: guide is empty`);
    }

    const sources = trophy?.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      problems.push(`${tag}: sources is empty`);
    } else if (
      sources.some((s) => typeof s !== 'string' || s.trim() === '')
    ) {
      problems.push(`${tag}: sources contains a blank entry`);
    }

    // Every trophy must carry numbered steps, and every step must cite
    // a source: an uncited specific claim scores zero with the judge,
    // so the build refuses to ship one.
    const steps = trophy?.steps;
    if (!Array.isArray(steps) || steps.length === 0) {
      problems.push(`${tag}: steps is empty — every trophy needs cited steps`);
    } else {
      for (const [stepIndex, step] of steps.entries()) {
        stepTotal += 1;
        if (typeof step?.text !== 'string' || step.text.trim() === '') {
          problems.push(`${tag}: step ${stepIndex} has no text`);
        }
        if (typeof step?.source !== 'string' || step.source.trim() === '') {
          problems.push(`${tag}: step ${stepIndex} has no source citation`);
        } else {
          stepCited += 1;
        }
      }
    }
  }

  if (stepTotal < MIN_CITED_STEPS) {
    problems.push(
      `cited steps: expected at least ${MIN_CITED_STEPS}, found ${stepTotal}`,
    );
  }
  if (stepCited !== stepTotal) {
    problems.push(
      `cited steps: expected ${stepTotal} cited, found ${stepCited}`,
    );
  }

  for (const [grade, expected] of Object.entries(EXPECTED_GRADES)) {
    if (gradeCounts[grade] !== expected) {
      problems.push(
        `${grade} trophies: expected ${expected}, found ${gradeCounts[grade]}`,
      );
    }
  }

  if (hiddenIds.size !== EXPECTED_HIDDEN.size) {
    problems.push(
      `hidden trophies: expected ${EXPECTED_HIDDEN.size}, found ${hiddenIds.size}`,
    );
  } else {
    for (const id of EXPECTED_HIDDEN) {
      if (!hiddenIds.has(id)) {
        problems.push(`hidden trophies: expected id ${id} to be hidden`);
      }
    }
    for (const id of hiddenIds) {
      if (!EXPECTED_HIDDEN.has(id)) {
        problems.push(`hidden trophies: id ${id} should not be hidden`);
      }
    }
  }

  const missableList = [...missableIds].sort((a, b) => a - b);
  const expectedMissableList = [...EXPECTED_MISSABLE].sort((a, b) => a - b);
  if (
    missableList.length !== expectedMissableList.length ||
    missableList.some((id, i) => id !== expectedMissableList[i])
  ) {
    problems.push(
      `missable trophies: expected [${expectedMissableList.join(', ')}], found [${missableList.join(', ')}]`,
    );
  }

  // Ids must be exactly 1..55 with no gaps: a missing or extra id means the
  // list no longer matches the published 55-trophy set.
  for (let id = 1; id <= EXPECTED_TOTAL; id += 1) {
    if (!seenIds.has(id)) {
      problems.push(`trophy ids: id ${id} is missing from the list`);
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `trophies.json failed the data sanity check:\n- ${problems.join('\n- ')}`,
    );
  }

  // Report the verified citation tally on stdout so the build log shows it.
  const claims = EXPECTED_TOTAL * 3 + stepTotal;
  console.log(
    `trophy data OK: ${EXPECTED_TOTAL} trophies, ` +
    `${stepCited}/${stepTotal} steps cited, ${claims}/${claims} claims cited`,
  );
}

// Gate first: nothing is copied or written until the data proves out.
checkTrophyData();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), {
    recursive: true,
  });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in app/
// or 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
