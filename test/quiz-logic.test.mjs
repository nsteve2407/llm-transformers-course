// test/quiz-logic.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeMCQ, gradeShortAnswer, scoreQuiz } from "../assets/js/quiz-logic.mjs";

test("gradeMCQ returns true for the correct index", () => {
  const q = { type: "mcq", choices: ["a", "b", "c"], answer_index: 1 };
  assert.equal(gradeMCQ(q, 1), true);
  assert.equal(gradeMCQ(q, 0), false);
});

test("gradeShortAnswer matches on any keyword, case- and punctuation-insensitive", () => {
  const q = { type: "short", answer_keywords: ["adam", "adaptive moment"] };
  assert.equal(gradeShortAnswer(q, "It uses Adam!"), true);
  assert.equal(gradeShortAnswer(q, "adaptive-moment estimation"), true);
  assert.equal(gradeShortAnswer(q, "plain SGD"), false);
});

test("scoreQuiz tallies correct answers across mixed question types", () => {
  const questions = [
    { type: "mcq", choices: ["a", "b"], answer_index: 0, explanation: "e1" },
    { type: "short", answer_keywords: ["dropout"], explanation: "e2" },
  ];
  const responses = [0, "we use dropout here"];
  const result = scoreQuiz(questions, responses);
  assert.equal(result.correctCount, 2);
  assert.equal(result.total, 2);
  assert.equal(result.results[0].correct, true);
  assert.equal(result.results[1].correct, true);
});

test("scoreQuiz records incorrect answers too", () => {
  const questions = [{ type: "mcq", choices: ["a", "b"], answer_index: 0, explanation: "e1" }];
  const result = scoreQuiz(questions, [1]);
  assert.equal(result.correctCount, 0);
  assert.equal(result.results[0].correct, false);
});
