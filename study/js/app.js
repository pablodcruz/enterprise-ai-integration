(() => {
  "use strict";

  const STORAGE_KEY = "enterprise-ai-study-progress-v1";
  const questions = Array.isArray(window.studyQuestions) ? window.studyQuestions : [];

  const elements = {
    mode: document.querySelector("#mode-select"),
    topic: document.querySelector("#topic-select"),
    start: document.querySelector("#start-button"),
    reset: document.querySelector("#reset-button"),
    restart: document.querySelector("#restart-button"),
    empty: document.querySelector("#empty-state"),
    card: document.querySelector("#question-card"),
    complete: document.querySelector("#complete-state"),
    completeMessage: document.querySelector("#complete-message"),
    position: document.querySelector("#position"),
    score: document.querySelector("#score"),
    mastered: document.querySelector("#mastered"),
    reviewCount: document.querySelector("#review-count"),
    topicBadge: document.querySelector("#topic-badge"),
    difficultyBadge: document.querySelector("#difficulty-badge"),
    questionText: document.querySelector("#question-text"),
    codeSample: document.querySelector("#code-sample"),
    answerList: document.querySelector("#answer-list"),
    flashcardActions: document.querySelector("#flashcard-actions"),
    reveal: document.querySelector("#reveal-button"),
    ratingButtons: document.querySelector("#rating-buttons"),
    knew: document.querySelector("#knew-button"),
    review: document.querySelector("#review-button"),
    feedback: document.querySelector("#feedback"),
    feedbackTitle: document.querySelector("#feedback-title"),
    feedbackText: document.querySelector("#feedback-text"),
    reference: document.querySelector("#reference-link"),
    next: document.querySelector("#next-button"),
  };

  let session = [];
  let currentIndex = 0;
  let sessionScore = 0;
  let currentAnswered = false;

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (_error) {
      return {};
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  function shuffle(values) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  }

  function topicLabel(topic) {
    return topic.replace("-", " ");
  }

  function updateProgressSummary() {
    const progress = loadProgress();
    const entries = Object.values(progress);
    const mastered = entries.filter((entry) => entry.correct >= 2 && entry.correct > entry.incorrect).length;
    const needsReview = entries.filter((entry) => entry.incorrect > 0 && entry.correct <= entry.incorrect).length;
    elements.mastered.textContent = String(mastered);
    elements.reviewCount.textContent = String(needsReview);
  }

  function recordResult(questionId, correct) {
    const progress = loadProgress();
    const entry = progress[questionId] || { attempts: 0, correct: 0, incorrect: 0 };
    entry.attempts += 1;
    if (correct) {
      entry.correct += 1;
    } else {
      entry.incorrect += 1;
    }
    entry.lastAttempt = new Date().toISOString();
    progress[questionId] = entry;
    saveProgress(progress);
    updateProgressSummary();
  }

  function selectQuestions() {
    const topic = elements.topic.value;
    let selected = topic === "all" ? questions : questions.filter((question) => question.topic === topic);

    if (elements.mode.value === "smart-review") {
      const progress = loadProgress();
      const needsReview = selected.filter((question) => {
        const entry = progress[question.id];
        return entry && entry.incorrect > 0 && entry.correct <= entry.incorrect;
      });
      if (needsReview.length > 0) {
        selected = needsReview;
      }
    }

    return shuffle(selected);
  }

  function showFeedback(question, correct, title) {
    elements.feedback.hidden = false;
    elements.feedbackTitle.textContent = title;
    elements.feedbackTitle.style.color = correct ? "var(--success)" : "var(--danger)";
    elements.feedbackText.textContent = question.explanation;
    elements.reference.href = question.reference;
  }

  function disableAnswers(question, selectedIndex) {
    [...elements.answerList.querySelectorAll("button")].forEach((button, index) => {
      button.disabled = true;
      if (index === question.correct) {
        button.classList.add("correct");
      } else if (index === selectedIndex) {
        button.classList.add("incorrect");
      }
    });
  }

  function answerQuestion(question, selectedIndex) {
    if (currentAnswered) return;
    currentAnswered = true;
    const correct = selectedIndex === question.correct;
    if (correct) sessionScore += 1;
    recordResult(question.id, correct);
    disableAnswers(question, selectedIndex);
    showFeedback(question, correct, correct ? "Correct" : `Correct answer: ${question.answers[question.correct]}`);
    elements.score.textContent = String(sessionScore);
    elements.next.disabled = false;
  }

  function renderAnswers(question) {
    elements.answerList.replaceChildren();
    question.answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer";
      button.textContent = answer;
      button.addEventListener("click", () => answerQuestion(question, index));
      elements.answerList.append(button);
    });
  }

  function revealFlashcard(question) {
    elements.feedback.hidden = false;
    elements.feedbackTitle.textContent = `Answer: ${question.answers[question.correct]}`;
    elements.feedbackTitle.style.color = "var(--accent)";
    elements.feedbackText.textContent = question.explanation;
    elements.reference.href = question.reference;
    elements.reveal.hidden = true;
    elements.ratingButtons.hidden = false;
  }

  function rateFlashcard(question, knewIt) {
    if (currentAnswered) return;
    currentAnswered = true;
    if (knewIt) sessionScore += 1;
    recordResult(question.id, knewIt);
    elements.score.textContent = String(sessionScore);
    elements.knew.disabled = true;
    elements.review.disabled = true;
    elements.next.disabled = false;
  }

  function renderQuestion() {
    if (currentIndex >= session.length) {
      showComplete();
      return;
    }

    const question = session[currentIndex];
    const flashcards = elements.mode.value === "flashcards";
    currentAnswered = false;

    elements.position.textContent = `${currentIndex + 1} / ${session.length}`;
    elements.topicBadge.textContent = topicLabel(question.topic);
    elements.difficultyBadge.textContent = question.difficulty;
    elements.questionText.textContent = question.question;
    elements.feedback.hidden = true;
    elements.next.disabled = true;
    elements.reveal.hidden = false;
    elements.ratingButtons.hidden = true;
    elements.knew.disabled = false;
    elements.review.disabled = false;

    if (question.code) {
      elements.codeSample.hidden = false;
      elements.codeSample.querySelector("code").textContent = question.code;
    } else {
      elements.codeSample.hidden = true;
    }

    renderAnswers(question);
    elements.answerList.hidden = flashcards;
    elements.flashcardActions.hidden = !flashcards;

    elements.reveal.onclick = () => revealFlashcard(question);
    elements.knew.onclick = () => rateFlashcard(question, true);
    elements.review.onclick = () => rateFlashcard(question, false);
  }

  function startSession() {
    session = selectQuestions();
    currentIndex = 0;
    sessionScore = 0;
    elements.score.textContent = "0";
    elements.empty.hidden = true;
    elements.complete.hidden = true;

    if (session.length === 0) {
      elements.card.hidden = true;
      elements.complete.hidden = false;
      elements.completeMessage.textContent = "No questions match the current selection.";
      return;
    }

    elements.card.hidden = false;
    renderQuestion();
  }

  function showComplete() {
    elements.card.hidden = true;
    elements.complete.hidden = false;
    elements.completeMessage.textContent = `You marked ${sessionScore} of ${session.length} questions correct. Use Smart Review to revisit weak areas.`;
  }

  elements.start.addEventListener("click", startSession);
  elements.restart.addEventListener("click", startSession);
  elements.next.addEventListener("click", () => {
    currentIndex += 1;
    renderQuestion();
  });
  elements.reset.addEventListener("click", () => {
    if (window.confirm("Reset all locally stored study progress?")) {
      localStorage.removeItem(STORAGE_KEY);
      updateProgressSummary();
    }
  });

  updateProgressSummary();
})();
