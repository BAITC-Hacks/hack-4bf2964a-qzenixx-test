"use strict";

const fs = require("node:fs");
const path = require("node:path");

const messagesPath = path.join(__dirname, "messages.txt");
const messages = fs
  .readFileSync(messagesPath, "utf8")
  .split(/\r?\n/)
  .map((message) => message.trim())
  .filter(Boolean);

function classify(message) {
  const text = message.toLowerCase();

  if (/(очеред|холодн|пропал|не работает|жалоб)/.test(text)) {
    return {
      category: "жалоба",
      reply: "Спасибо за сообщение. Мы передадим информацию ответственным и постараемся помочь как можно скорее.",
    };
  }

  if (/(справк|где|как получить)/.test(text)) {
    return {
      category: "справка",
      reply: "Спасибо за вопрос. Уточните, пожалуйста, детали у сотрудников учебной части или на стойке информации.",
    };
  }

  return {
    category: "другое",
    reply: "Спасибо за обращение. Мы рассмотрим его и ответим при первой возможности.",
  };
}

messages.forEach((message, index) => {
  const result = classify(message);
  console.log(`${index + 1}. Обращение: ${message}`);
  console.log(`   Категория: ${result.category}`);
  console.log(`   Черновик ответа: ${result.reply}\n`);
});
