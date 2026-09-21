"use strict";

const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

const FAQ_PATH = path.join(__dirname, "faq.txt");

function words(text) {
  return new Set((text.toLowerCase().replaceAll("ё", "е").match(/[а-яa-z0-9]+/gi) || []));
}

function loadFaq() {
  return fs
    .readFileSync(FAQ_PATH, "utf8")
    .trim()
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const fields = Object.fromEntries(
        block.split(/\r?\n/).map((line) => {
          const separator = line.indexOf(": ");
          return [line.slice(0, separator), line.slice(separator + 2)];
        }),
      );
      return {
        keywords: words(fields["Ключевые слова"]),
        answer: fields["Ответ"],
      };
    });
}

function findAnswer(question, faq) {
  const questionWords = words(question);
  const scored = faq.map((item) => ({
    ...item,
    score: [...questionWords].filter((word) => item.keywords.has(word)).length,
  }));
  const bestMatch = scored.reduce((best, item) => (item.score > best.score ? item : best));
  return bestMatch.score > 0 ? bestMatch.answer : null;
}

const faq = loadFaq();
const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("FAQ-бот о репетиции. Напишите вопрос или «выход».");
terminal.setPrompt("> ");
terminal.prompt();

terminal.on("line", (question) => {
  const normalized = question.trim();
  if (["выход", "exit", "quit"].includes(normalized.toLowerCase())) {
    terminal.close();
    return;
  }
  if (normalized) console.log(findAnswer(normalized, faq) || "Не знаю.");
  terminal.prompt();
});

terminal.on("close", () => console.log("До встречи!"));
