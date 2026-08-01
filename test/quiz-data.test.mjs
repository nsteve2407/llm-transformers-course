// test/quiz-data.test.mjs
//
// Cross-file invariant checks for every _data/quizzes/*.yml file. This replaces the one-off
// verification scripts that earlier module-authoring tasks hand-rolled per quiz file (see
// .superpowers/sdd/2026-08-01-modules-4-6/task-{2,5,8}-report.md) with a single automated test that
// runs for every quiz file present in the repo, now and in the future.
//
// No YAML-parsing library is a dependency anywhere in this repo's package.json files, so this test
// shells out to `ruby -ryaml` (Ruby is already a required part of this repo's toolchain via the
// Gemfile/Jekyll build) to convert each quiz YAML file to JSON before asserting on it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const quizzesDir = path.join(__dirname, "..", "_data", "quizzes");

function loadQuizFile(filePath) {
  const rubyScript = "require 'yaml'; require 'json'; puts JSON.generate(YAML.load_file(ARGV[0]))";
  const stdout = execFileSync("ruby", ["-ryaml", "-rjson", "-e", rubyScript, filePath], {
    encoding: "utf8",
  });
  return JSON.parse(stdout);
}

// Heuristic for a "bare/short numeric keyword": a standalone digit sequence inside the keyword that
// isn't preceded by at least 1 non-digit, non-space character. This catches keywords that are (or
// start with) a bare number, e.g. "2048" or "8" on their own, which can substring-match all sorts of
// unrelated numbers in a free-text answer (e.g. "12048" or "80"), while allowing digits that are
// anchored by even a single adjacent character -- an identifier-like token such as "h2" or "gpt-3", or
// a word immediately before the number such as "is 9 pixels" -- since the grader requires the *entire*
// keyword to match as a contiguous substring, and any adjacent non-digit character sharply narrows
// what free text could accidentally satisfy that match.
function findWeaklyAnchoredNumericKeywords(keyword) {
  const flagged = [];
  const digitMatches = keyword.matchAll(/\d+/g);
  for (const m of digitMatches) {
    const before = keyword.slice(0, m.index).replace(/[\d\s]/g, "");
    if (before.length < 1) {
      flagged.push(m[0]);
    }
  }
  return flagged;
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

const quizFiles = readdirSync(quizzesDir)
  .filter((f) => f.endsWith(".yml"))
  .sort();

assert.ok(quizFiles.length > 0, "expected at least one quiz YAML file under _data/quizzes/");

for (const fileName of quizFiles) {
  const filePath = path.join(quizzesDir, fileName);

  test(`${fileName}: every question has a valid schema`, () => {
    const questions = loadQuizFile(filePath);
    assert.ok(isNonEmptyArray(questions), `${fileName} should contain a non-empty list of questions`);

    questions.forEach((q, i) => {
      assert.ok(
        q.type === "mcq" || q.type === "short",
        `${fileName} q${i}: type must be "mcq" or "short", got ${JSON.stringify(q.type)}`
      );

      if (q.type === "mcq") {
        assert.ok(isNonEmptyArray(q.choices), `${fileName} q${i}: mcq must have a non-empty choices array`);
        assert.ok(
          Number.isInteger(q.answer_index) && q.answer_index >= 0 && q.answer_index < q.choices.length,
          `${fileName} q${i}: answer_index (${q.answer_index}) must be a valid index into choices (length ${q.choices.length})`
        );
      } else {
        assert.ok(
          isNonEmptyArray(q.answer_keywords),
          `${fileName} q${i}: short must have a non-empty answer_keywords array`
        );
        assert.ok(
          typeof q.model_answer === "string" && q.model_answer.length > 0,
          `${fileName} q${i}: short must have a non-empty model_answer string`
        );
      }
    });
  });

  test(`${fileName}: no weakly-anchored numeric answer_keywords`, () => {
    const questions = loadQuizFile(filePath);
    const offenders = [];

    questions.forEach((q, i) => {
      if (q.type !== "short") return;
      for (const keyword of q.answer_keywords) {
        const flagged = findWeaklyAnchoredNumericKeywords(keyword);
        if (flagged.length > 0) {
          offenders.push(`q${i} keyword "${keyword}" (digits: ${flagged.join(", ")})`);
        }
      }
    });

    assert.deepEqual(offenders, [], `${fileName} has weakly-anchored numeric keywords:\n${offenders.join("\n")}`);
  });

  test(`${fileName}: mcq answer_index values are not all identical`, () => {
    const questions = loadQuizFile(filePath);
    const mcqIndices = questions.filter((q) => q.type === "mcq").map((q) => q.answer_index);

    if (mcqIndices.length < 2) return; // nothing to compare

    const distinct = new Set(mcqIndices).size;
    assert.ok(
      distinct >= 2,
      `${fileName}: all ${mcqIndices.length} mcq answer_index values are identical (${mcqIndices[0]}) -- ` +
        `a learner could guess the same position every time`
    );
  });
}

// Sanity check that the raw file bytes were actually read (guards against a silently empty quizzesDir).
test("quizzesDir contains the expected files", () => {
  const raw = readFileSync(path.join(quizzesDir, quizFiles[0]), "utf8");
  assert.ok(raw.length > 0);
});
