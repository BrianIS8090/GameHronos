import { getEndingText, DEFAULT_MEMORIES } from './text-data.js';

let passed = 0;
let failed = 0;
const failures = [];

function runTests(withMemories) {
  const memories = { ...DEFAULT_MEMORIES };
  if (withMemories) {
    for (let key in memories) {
      memories[key] = true;
    }
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        const pathStr = `${i}-${j}-${k}`;
        const text = getEndingText(i, j, k, memories);

        if (text && !text.includes("ОШИБКА ХРОНОЛОГИИ")) {
          passed++;
        } else {
          failed++;
          failures.push({ path: pathStr, withMemories, text });
        }
      }
    }
  }
}

runTests(false);
runTests(true);

console.log(`=== БАЗОВЫЙ SMOKE-ТЕСТ (27 путей × 2 режима памяти) ===`);
console.log(`Успешно: ${passed}`);
console.log(`Ошибок: ${failed}`);

if (failed > 0) {
  console.error("Ошибки обнаружены в следующих путях:");
  failures.forEach(f => {
    console.error(`- Путь [${f.path}] (Все улики: ${f.withMemories}): ${f.text.substring(0, 100)}...`);
  });
  process.exit(1);
}
console.log("Все 54 проверки пройдены.\n");

// Подключаем расширенный аудитор. Если он что-то найдёт — выходим с ненулевым кодом.
console.log("=== РАСШИРЕННЫЙ АУДИТ ЛОГИКИ ===");
const audit = await import('./test-audit.mjs');
// test-audit.mjs сам печатает отчёт и вызывает process.exit, поэтому до сюда обычно не доходит.
