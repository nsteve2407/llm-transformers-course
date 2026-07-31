export function gradeMCQ(question, selectedIndex) {
  return selectedIndex === question.answer_index;
}

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function gradeShortAnswer(question, userText) {
  const normalized = normalize(userText);
  return question.answer_keywords.some((keyword) =>
    normalized.includes(normalize(keyword))
  );
}

export function scoreQuiz(questions, responses) {
  const results = questions.map((question, i) => {
    const correct =
      question.type === "mcq"
        ? gradeMCQ(question, responses[i])
        : gradeShortAnswer(question, responses[i] ?? "");
    return { question, correct, explanation: question.explanation };
  });
  const correctCount = results.filter((r) => r.correct).length;
  return { correctCount, total: questions.length, results };
}
