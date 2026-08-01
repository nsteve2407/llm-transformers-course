// assets/js/quiz.js
import { scoreQuiz } from "./quiz-logic.mjs";

function renderQuestion(question, index, moduleSlug) {
  const wrapper = document.createElement("div");
  wrapper.className = "quiz-question";

  const questionPara = document.createElement("p");
  const questionLabel = document.createElement("strong");
  questionLabel.textContent = `Q${index + 1}.`;
  questionPara.appendChild(questionLabel);
  questionPara.appendChild(document.createTextNode(` ${question.question}`));
  wrapper.appendChild(questionPara);

  if (question.type === "mcq") {
    question.choices.forEach((choice, choiceIndex) => {
      const label = document.createElement("label");
      label.style.display = "block";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q-${moduleSlug}-${index}`;
      input.value = choiceIndex;
      label.appendChild(input);
      label.appendChild(document.createTextNode(` ${choice}`));
      wrapper.appendChild(label);
    });
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.name = `q-${moduleSlug}-${index}`;
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
  const moduleSlug = container.dataset.module;
  if (question.type === "mcq") {
    const checked = container.querySelector(`input[name="q-${moduleSlug}-${index}"]:checked`);
    return checked ? Number(checked.value) : null;
  }
  const input = container.querySelector(`input[name="q-${moduleSlug}-${index}"]`);
  return input ? input.value : "";
}

function initQuiz(container) {
  const dataEl = container.querySelector("script[type='application/json']");
  if (!dataEl) return;
  const questions = JSON.parse(dataEl.textContent);
  const moduleSlug = container.dataset.module;
  const app = container.querySelector(`#quiz-app-${moduleSlug}`);

  questions.forEach((q, i) => app.appendChild(renderQuestion(q, i, moduleSlug)));

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
      const parts = [r.correct ? "Correct." : "Incorrect."];
      if (r.explanation) parts.push(r.explanation);
      if (r.question.type === "short" && r.question.model_answer) {
        parts.push(`Model answer: ${r.question.model_answer}`);
      }
      feedback.textContent = parts.join(" ");
      feedback.style.color = r.correct ? "green" : "crimson";
    });
  });
}

function init() {
  document.querySelectorAll(".quiz-widget").forEach(initQuiz);
}

init();
