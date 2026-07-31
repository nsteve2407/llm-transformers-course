// assets/js/quiz.js
import { scoreQuiz } from "./quiz-logic.mjs";

function renderQuestion(question, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-question";
  wrapper.innerHTML = `<p><strong>Q${index + 1}.</strong> ${question.question}</p>`;

  if (question.type === "mcq") {
    question.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.innerHTML = `<input type="radio" name="q${index}" value="${choiceIndex}"> ${choice}`;
      wrapper.appendChild(label);
    });
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.name = `q${index}`;
    input.placeholder = "Your answer";
    wrapper.appendChild(input);
  }

  const feedback = document.createElement("p");
  feedback.className = "quiz-feedback";
  feedback.dataset.index = index;
  wrapper.appendChild(feedback);

  return wrapper;
}

function collectResponse(container, question, index) {
  if (question.type === "mcq") {
    const checked = container.querySelector(`input[name="q${index}"]:checked`);
    return checked ? Number(checked.value) : null;
  }
  const input = container.querySelector(`input[name="q${index}"]`);
  return input ? input.value : "";
}

function initQuiz(container) {
  const dataEl = container.querySelector("script[type='application/json']");
  if (!dataEl) return;
  const questions = JSON.parse(dataEl.textContent);
  const moduleSlug = container.dataset.module;
  const app = container.querySelector(`#quiz-app-${moduleSlug}`);

  questions.forEach((q, i) => app.appendChild(renderQuestion(q, i)));

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit answers";
  const scoreEl = document.createElement("p");
  scoreEl.className = "quiz-score";
  app.appendChild(submitBtn);
  app.appendChild(scoreEl);

  submitBtn.addEventListener("click", () => {
    const responses = questions.map((q, i) => collectResponse(container, q, i));
    const { correctCount, total, results } = scoreQuiz(questions, responses);
    scoreEl.textContent = `Score: ${correctCount} / ${total}`;
    results.forEach((r, i) => {
      const feedback = container.querySelector(`.quiz-feedback[data-index="${i}"]`);
      feedback.textContent = r.correct
        ? "Correct."
        : `Incorrect. ${r.explanation}`;
      feedback.style.color = r.correct ? "green" : "crimson";
    });
  });
}

function init() {
  document.querySelectorAll('[data-module]').forEach(initQuiz);
}

init();
