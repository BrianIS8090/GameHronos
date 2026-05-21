import {
  getSceneText, getAvailableChoices, getScene3Text, getScene3Choices,
  getEndingText, isFatalEnding, DEFAULT_MEMORIES
} from './text-data.js';
import { applyUnlocks } from './rules.js';

// Используем РЕАЛЬНУЮ функцию applyUnlocks — без копии.
// Это закрывает MEDIUM-3 из аудита: тесты больше не могут «расходиться» с runtime.
function checkUnlocks(i, j, k, memories, state = {}) {
  return applyUnlocks([i, j, k], memories, state);
}

// Реплика логики state.terroristNeutralized из game.js:showEnding
function computeTerroristNeutralized(i, j, k, memories) {
  return (i === 1 && j === 1 && (k === 1 || k === 2) && memories.terrorist_know);
}

const ALL_KEYS = ['bomb_found', 'terrorist_know', 'generator_key', 'brake_broken', 'cabin_code', 'soldier_trust', 'yellow_wire'];

function emptyMemories() {
  return { ...DEFAULT_MEMORIES };
}

function withMemories(keys) {
  const m = emptyMemories();
  keys.forEach(k => m[k] = true);
  return m;
}

const findings = [];
function report(severity, code, msg, extra = {}) {
  findings.push({ severity, code, msg, ...extra });
}

// ============================================================
// АУДИТ 1: Достижимость пути i=1 после terrorist_know
// ============================================================
function auditBranchBlocking() {
  const m = withMemories(['terrorist_know']);
  const choices1 = getAvailableChoices(1, [], m, {});
  const i1 = choices1[1];
  if (!i1.text.toLowerCase().includes('капюшон')) {
    report('LOW', 'BB-1', 'После terrorist_know кнопка i=1 не указывает на капюшон', { actual: i1.text });
  }
  // С terroristNeutralized=true кнопка должна быть disabled
  const choices1b = getAvailableChoices(1, [], m, { terroristNeutralized: true });
  if (!choices1b[1].disabled) {
    report('HIGH', 'BB-2', 'После terroristNeutralized кнопка i=1 не disabled', { actual: choices1b[1] });
  }
}

// ============================================================
// АУДИТ 2: Согласованность checkUnlocks и текста концовки
// ============================================================
function auditUnlockTextConsistency() {
  // Для каждого пути с любым состоянием улик проверяем, что выдаваемые
  // улики упомянуты в тексте концовки (или текст явно намекает на стелс).
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        // Перебираем подмножество ключевых памятей, влияющих на текст
        for (const baseMem of [
          emptyMemories(),
          withMemories(['bomb_found']),
          withMemories(['terrorist_know']),
          withMemories(['generator_key']),
          withMemories(['bomb_found', 'terrorist_know', 'generator_key']),
          withMemories(['bomb_found', 'terrorist_know', 'generator_key', 'soldier_trust']),
          withMemories(ALL_KEYS),
        ]) {
          const state = { terroristNeutralized: false };
          const text = getEndingText(i, j, k, baseMem, state);
          const { fired } = checkUnlocks(i, j, k, baseMem);

          if (!text || text.includes('ОШИБКА ХРОНОЛОГИИ')) {
            report('CRITICAL', 'TX-MISS', `Нет текста концовки`, { path: `${i}-${j}-${k}`, memHash: keysOf(baseMem) });
            continue;
          }

          // Эвристика: если выдаётся brake_broken, в тексте должно быть слово "тормоз" или "шланг" или "магистрал"
          if (fired.includes('brake_broken')) {
            if (!/(тормоз|шланг|магистрал|саботаж|стоп-кран)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `brake_broken выдан, но в тексте нет упоминания тормозов`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
          if (fired.includes('terrorist_know')) {
            if (!/(капюшон|террорист|пульт|детонатор)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `terrorist_know выдан, но в тексте нет упоминания террориста`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
          if (fired.includes('bomb_found')) {
            if (!/(бомб|рюкзак|свУ|СВУ|тикан|таймер)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `bomb_found выдан, но в тексте нет упоминания бомбы`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
          if (fired.includes('generator_key')) {
            if (!/(ключ|монтер|монтёр|щит|трёхгран|трехгран)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `generator_key выдан, но в тексте нет упоминания ключа`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
          if (fired.includes('cabin_code')) {
            if (!/(панел|код|кноп|кабин)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `cabin_code выдан, но в тексте нет упоминания панели`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
          if (fired.includes('soldier_trust')) {
            if (!/(военн|Алексе|майор|ССО|камуфляж)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `soldier_trust выдан, но в тексте нет упоминания военного`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
          if (fired.includes('yellow_wire')) {
            if (!/(жёлт|желт|провод)/i.test(text)) {
              report('HIGH', 'UNLOCK-DESC', `yellow_wire выдан, но в тексте нет упоминания провода`, {
                path: `${i}-${j}-${k}`, memHash: keysOf(baseMem), text: text.substring(0, 100)
              });
            }
          }
        }
      }
    }
  }
}

// ============================================================
// АУДИТ 3: Достижимость улик из старта игры
// ============================================================
function auditAchievability() {
  // Стартуем без улик, можно ли получить каждую улику хоть каким-то путём?
  for (const key of ALL_KEYS) {
    let found = false;
    const states = [];
    // Перебираем все 27 путей с разной памятью
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          for (const baseMem of allMemorySubsets()) {
            const { fired } = checkUnlocks(i, j, k, baseMem);
            if (fired.includes(key)) {
              found = true;
              states.push({ path: `${i}-${j}-${k}`, prereq: keysOf(baseMem) });
            }
          }
        }
      }
    }
    if (!found) {
      report('CRITICAL', 'REACH', `Улика ${key} никаким путём не выдаётся!`, {});
    }
  }
}

// ============================================================
// АУДИТ 4: Симуляция оптимального прохождения
// ============================================================
function auditOptimalRun() {
  // Воспроизводим, что игрок реально может пройти 8 циклов и собрать все улики
  let mem = emptyMemories();
  const log = [];

  const plan = [
    { path: [0, 1, 1], comment: 'bomb_found через 0-1-1' },
    { path: [1, 0, 2], comment: 'terrorist_know через 1-0-2' },
    { path: [2, 1, 0], comment: 'generator_key через 2-1-0 (стелс)' },
    { path: [2, 1, 2], comment: 'brake_broken через 2-1-2 (нужен generator_key)' },
    { path: [2, 0, 1], comment: 'cabin_code через 2-0-1 (стелс)' },
    { path: [1, 2, 2], comment: 'soldier_trust через 1-2-2 (нужен terrorist_know)' },
    { path: [0, 2, 2], comment: 'yellow_wire через 0-2-2 (нужен soldier_trust)' },
  ];

  for (const step of plan) {
    const [i, j, k] = step.path;

    // Проверка достижимости: после terrorist_know кнопка i=1 — это уже схватка.
    // Это не блокирует, но текст и j/k меняют смысл.
    const choices1 = getAvailableChoices(1, [], mem, { terroristNeutralized: false });
    if (choices1[i].disabled) {
      report('CRITICAL', 'OPT-BLOCK', `Шаг "${step.comment}" заблокирован — кнопка i=${i} disabled`, { mem: keysOf(mem) });
      continue;
    }

    const { memories: newMem, fired } = checkUnlocks(i, j, k, mem);
    log.push({ step: step.comment, path: `${i}-${j}-${k}`, fired });
    mem = newMem;
  }

  // Финальная проверка: все 7 улик собраны?
  const missing = ALL_KEYS.filter(k => !mem[k]);
  if (missing.length > 0) {
    report('CRITICAL', 'OPT-INCOMPLETE', `Оптимальный план не собрал все улики`, { missing, log });
  }

  // Имитация финального цикла 2-2-2
  if (missing.length === 0) {
    const finalText = getEndingText(2, 2, 2, mem, { terroristNeutralized: false });
    if (!finalText.includes('ИСТИННЫЙ РАССВЕТ')) {
      report('CRITICAL', 'OPT-NO-WIN', `Победный путь 2-2-2 не даёт ИСТИННЫЙ РАССВЕТ`, { text: finalText.substring(0, 200) });
    }
  }
}

// ============================================================
// АУДИТ 5: Спец-проверки текста (опечатки, согласованность)
// ============================================================
function auditTextQuality() {
  // Известные опечатки/неудачные формулировки
  const knownTypos = [
    { regex: /безсказно/, name: 'безсказно (правильно: беззвучно)' },
    { regex: /\bтампур/i, name: 'тампур (правильно: тамбур)' },
  ];

  // Проверяем сцены 1 и 2 со всеми комбинациями
  for (let i = 0; i < 3; i++) {
    const t1 = getSceneText(1, [], withMemories(ALL_KEYS));
    const t2 = getSceneText(2, [i], withMemories(ALL_KEYS));
    for (const typo of knownTypos) {
      if (typo.regex.test(t1) || typo.regex.test(t2)) {
        report('LOW', 'TYPO', `Найдена опечатка: ${typo.name}`, { i });
      }
    }
  }

  // Проверка концовок
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
    for (const mem of [emptyMemories(), withMemories(ALL_KEYS)]) {
      const t = getEndingText(i, j, k, mem, {});
      for (const typo of knownTypos) {
        if (typo.regex.test(t)) {
          report('LOW', 'TYPO', `Опечатка в концовке: ${typo.name}`, { path: `${i}-${j}-${k}` });
        }
      }
    }
  }
}

// ============================================================
// АУДИТ 6: Спец-случай 0-2-2 (yellow_wire vs ПАРУСИНА)
// ============================================================
function auditYellowWireCase() {
  // Случай: terroristNeutralized=true (игрок стелсом нейтрализовал в текущей сессии),
  // но soldier_trust=false.
  const mem = withMemories(['bomb_found', 'terrorist_know']);
  const state = { terroristNeutralized: true };
  const text = getEndingText(0, 2, 2, mem, state);
  const { fired } = checkUnlocks(0, 2, 2, mem, state);

  // Какой текст выпал? Не "ПАРУСИНА И ОГОНЬ" (потому что terroristNeutralized) → "ЖЕЛТАЯ НИТЬ"
  if (text.includes('ЖЕЛТАЯ НИТЬ')) {
    // А улика выдана?
    if (!fired.includes('yellow_wire')) {
      report('HIGH', 'YW-MISS', `Концовка ЖЕЛТАЯ НИТЬ выпала (terroristNeutralized), но yellow_wire не выдан`, {});
    }
  }
}

// ============================================================
// АУДИТ 7: 1-2-0 при terrorist_know — рассогласование текста и улики
// ============================================================
function auditBrakeBrokenMisfire() {
  // С terrorist_know путь 1-2-0 — это "ПРЯМАЯ АТАКА" на террориста (прыжок),
  // никакого стоп-крана. Но checkUnlocks выдаёт brake_broken.
  const mem = withMemories(['terrorist_know']);
  const text = getEndingText(1, 2, 0, mem, {});
  const { fired } = checkUnlocks(1, 2, 0, mem);

  if (text.includes('ПРЯМАЯ АТАКА') && fired.includes('brake_broken')) {
    report('HIGH', 'BRK-MISFIRE', `1-2-0 при terrorist_know: текст про прыжок на террориста, но выдаётся brake_broken`, {
      textStart: text.substring(0, 80)
    });
  }
}

// ============================================================
// АУДИТ 8: Доступность terrorist_know через i=1 в первый раз
// ============================================================
function auditTerroristKnowDiscovery() {
  // С чистой памятью игрок выбирает i=1 (Осмотр), j=0 (Бизнесмен), k=2 (Отойти и осмотреться)
  const mem = emptyMemories();
  const choices1 = getAvailableChoices(1, [], mem, {});
  if (choices1[1].text.includes('капюшон')) {
    report('CRITICAL', 'DISC-1', 'Без улик кнопка i=1 уже про капюшон!', { actual: choices1[1].text });
  }
  const t2 = getSceneText(2, [1], mem);
  if (!t2.includes('капюшон')) {
    report('MEDIUM', 'DISC-2', 'Сцена 2 i=1 без terrorist_know не упоминает капюшон', { t2 });
  }
}

// ============================================================
// АУДИТ 9: Истинная концовка — все провальные сообщения формируются
// ============================================================
function auditTrueEndingFailModes() {
  // Для каждого недостающего ключа из ALL_KEYS — должна быть отдельная подсказка
  for (const missingKey of ALL_KEYS) {
    const mem = withMemories(ALL_KEYS.filter(k => k !== missingKey));
    const text = getEndingText(2, 2, 2, mem, { terroristNeutralized: false });
    if (text.includes('ИСТИННЫЙ РАССВЕТ')) {
      report('CRITICAL', 'WIN-LEAK', `Победа выпала, хотя нет улики ${missingKey}!`, {});
    }
    if (!text.includes('ПРОВАЛ')) {
      report('HIGH', 'NO-FAIL', `2-2-2 без ${missingKey} не показывает экран провала`, { textStart: text.substring(0, 100) });
    }
  }
}

// ============================================================
// АУДИТ 10: Соответствие FATAL_ENDINGS реальной фатальности
// ============================================================
function auditFatalSet() {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
    const memEmpty = emptyMemories();
    const memFull = withMemories(ALL_KEYS);
    const isFatalEmpty = isFatalEnding(i, j, k, memEmpty, {});
    const isFatalFull = isFatalEnding(i, j, k, memFull, { terroristNeutralized: true });
    // Истинная концовка 2-2-2 с полной памятью — не фатальная
    if (i === 2 && j === 2 && k === 2 && memFull && isFatalFull) {
      report('MEDIUM', 'FATAL-WIN', `2-2-2 с полной памятью считается фатальной`, {});
    }
  }
}

// ============================================================
// Helpers
// ============================================================
function keysOf(mem) {
  return ALL_KEYS.filter(k => mem[k]);
}

function* allMemorySubsets() {
  const n = ALL_KEYS.length;
  for (let mask = 0; mask < (1 << n); mask++) {
    const m = emptyMemories();
    for (let b = 0; b < n; b++) {
      if (mask & (1 << b)) m[ALL_KEYS[b]] = true;
    }
    yield m;
  }
}

// ============================================================
// АУДИТ 11: Хроно-резонансы — каждой улике своя строка в сцене 1
// ============================================================
function auditChronoResonance() {
  for (const key of ALL_KEYS) {
    const mem = withMemories([key]);
    const t1 = getSceneText(1, [], mem);
    if (!t1.includes('Хроно-резонанс')) {
      report('MEDIUM', 'NO-RESONANCE', `Улика ${key} не добавляет хроно-резонанс в сцене 1`, {});
    }
  }
  // Когда улик нет — хроно-резонанса быть не должно
  const t0 = getSceneText(1, [], emptyMemories());
  if (t0.includes('Хроно-резонанс')) {
    report('HIGH', 'EXTRA-RESONANCE', `Хроно-резонанс появляется при пустой памяти`, {});
  }
}

// ============================================================
// АУДИТ 12: Стелс-сессия — 1-1-1 → CONTINUE → 0-2-2 разблокирует yellow_wire
// ============================================================
function auditStealthSession() {
  // Сценарий: игрок имеет bomb_found + terrorist_know, идёт стелсом 1-1-1.
  // terroristNeutralized=true. Затем CONTINUE → 0-2-2.
  // Без soldier_trust yellow_wire должна выдаться.
  const memBefore = withMemories(['bomb_found', 'terrorist_know']);
  const state = { terroristNeutralized: false };

  // Шаг 1: 1-1-1 устанавливает terroristNeutralized
  if (computeTerroristNeutralized(1, 1, 1, memBefore)) {
    state.terroristNeutralized = true;
  } else {
    report('HIGH', 'STEALTH-NO-NEUTRALIZE', `1-1-1 с terrorist_know не нейтрализует террориста`, {});
    return;
  }

  // Стелс-концовка 1-1-1 не выдаёт улик
  const text1 = getEndingText(1, 1, 1, memBefore, state);
  if (!text1.includes('ТИХИЙ СТЕЛС')) {
    report('HIGH', 'STEALTH-NOT-STEALTH', `1-1-1 при terrorist_know не маркирован как стелс`, { text: text1.substring(0, 80) });
  }

  // Шаг 2: CONTINUE, идём на 0-2-2
  const { fired: fired2 } = checkUnlocks(0, 2, 2, memBefore, state);
  if (!fired2.includes('yellow_wire')) {
    report('CRITICAL', 'STEALTH-NO-YW', `После стелс-сессии 1-1-1 → 0-2-2 yellow_wire не выдан`, { state });
  }

  // Текст должен быть ЖЁЛТАЯ НИТЬ, не ПАРУСИНА
  const text2 = getEndingText(0, 2, 2, memBefore, state);
  if (text2.includes('ПАРУСИНА')) {
    report('CRITICAL', 'STEALTH-WRONG-END', `После стелс-сессии 1-1-1 → 0-2-2 текст «ПАРУСИНА И ОГОНЬ»`, { textStart: text2.substring(0, 80) });
  }
}

// ============================================================
// АУДИТ 13: Все 6 fail-веток 2-2-2 имеют отдельный текст и подсказку
// ============================================================
function auditTrueEndingFailMessages() {
  const cases = [
    { missing: ['bomb_found'], expect: 'ТАЙНА МЕДНЫХ ЖИЛ' },
    { missing: ['yellow_wire'], expect: 'НЕИЗВЕСТНЫЙ ПРОВОД' },
    { missing: ['terrorist_know'], expect: 'НЕИЗВЕСТНЫЙ ФАКТОР' },
    { missing: ['soldier_trust'], expect: 'ДИСТАНЦИОННЫЙ СДВИГ' },
    { missing: ['generator_key'], expect: 'БЕЗИНСТРУМЕНТАЛЬНЫЙ СБОЙ' },
    { missing: ['brake_broken'], expect: 'СКОРОСТЬ КАТАСТРОФЫ' },
    { missing: ['cabin_code'], expect: 'СЛУЧАЙНЫЙ ВЗЛОМ' },
  ];

  for (const c of cases) {
    const mem = withMemories(ALL_KEYS.filter(k => !c.missing.includes(k)));
    const text = getEndingText(2, 2, 2, mem, { terroristNeutralized: false });
    if (!text.includes(c.expect)) {
      report('HIGH', 'FAIL-WRONG', `Провал 2-2-2 без ${c.missing.join(', ')} не содержит «${c.expect}»`, { textStart: text.substring(0, 120) });
    }
    if (!text.includes('Подсказка')) {
      report('MEDIUM', 'NO-HINT', `Провал 2-2-2 без ${c.missing.join(', ')} не имеет подсказки`, {});
    }
  }
}

// ============================================================
// АУДИТ 14: HTML-целостность — у каждой концовки есть <strong> и </em>
// ============================================================
function auditHtmlSanity() {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) {
    for (const mem of [emptyMemories(), withMemories(ALL_KEYS)]) {
      const text = getEndingText(i, j, k, mem, { terroristNeutralized: true });
      if (!text.includes('<strong>')) {
        report('MEDIUM', 'HTML-NO-STRONG', `Концовка без <strong>`, { path: `${i}-${j}-${k}`, full: text.length > 100 ? 'full' : 'short' });
      }
      // Проверка баланса HTML-тегов
      const openStrong = (text.match(/<strong>/g) || []).length;
      const closeStrong = (text.match(/<\/strong>/g) || []).length;
      if (openStrong !== closeStrong) {
        report('HIGH', 'HTML-IMBALANCE', `Несбалансированные <strong>`, { path: `${i}-${j}-${k}`, open: openStrong, close: closeStrong });
      }
      const openEm = (text.match(/<em>/g) || []).length;
      const closeEm = (text.match(/<\/em>/g) || []).length;
      if (openEm !== closeEm) {
        report('HIGH', 'HTML-IMBALANCE-EM', `Несбалансированные <em>`, { path: `${i}-${j}-${k}`, open: openEm, close: closeEm });
      }
    }
  }
}

// ============================================================
// АУДИТ 15: Альтернативные пути к каждой улике достижимы из чистого старта
// ============================================================
function auditAlternativeReachability() {
  // Для каждой улики — какой кратчайший путь её даёт без других улик
  const tests = [
    { key: 'bomb_found', path: [0, 1, 1], prereq: [] },
    { key: 'terrorist_know', path: [1, 0, 2], prereq: [] },
    { key: 'generator_key', path: [2, 1, 0], prereq: [] },
    { key: 'brake_broken', path: [1, 2, 0], prereq: [] },          // без terrorist_know!
    { key: 'cabin_code', path: [2, 0, 1], prereq: [] },
    { key: 'soldier_trust', path: [1, 2, 1], prereq: [] },         // без terrorist_know!
    { key: 'yellow_wire', path: [0, 2, 2], prereq: ['terrorist_know', 'soldier_trust'] },
  ];

  for (const t of tests) {
    const mem = withMemories(t.prereq);
    const { fired } = checkUnlocks(t.path[0], t.path[1], t.path[2], mem, {});
    if (!fired.includes(t.key)) {
      report('CRITICAL', 'ALT-UNREACH', `Альт-путь ${t.path.join('-')} не выдаёт ${t.key}`, { prereq: t.prereq });
    }
  }
}

// ============================================================
// АУДИТ 16: 1-2-0 из чистого состояния даёт обе улики
// (regression-тест по HIGH-1 из аудита 21.05.2026)
// ============================================================
function auditChainedUnlock120() {
  const { fired } = checkUnlocks(1, 2, 0, emptyMemories(), {});
  if (!fired.includes('terrorist_know')) {
    report('CRITICAL', 'CHAIN-NO-TK', `1-2-0 из чистого состояния не выдаёт terrorist_know`, { fired });
  }
  if (!fired.includes('brake_broken')) {
    report('CRITICAL', 'CHAIN-NO-BB', `1-2-0 из чистого состояния не выдаёт brake_broken — баг порядка мутации`, { fired });
  }

  // А с terrorist_know уже выданным brake_broken не должен выдаваться через 1-2-0
  // (концовка ПРЯМАЯ АТАКА — игрок прыгает на террориста, стоп-кран не задействован).
  const { fired: fired2 } = checkUnlocks(1, 2, 0, withMemories(['terrorist_know']), {});
  if (fired2.includes('brake_broken')) {
    report('HIGH', 'CHAIN-LEAK', `1-2-0 при terrorist_know не должен выдавать brake_broken (концовка про прыжок)`, { fired: fired2 });
  }
}

// ============================================================
// АУДИТ 17: yellow_wire требует контроля над террористом
// ============================================================
function auditYellowWireGate() {
  // только soldier_trust без terrorist_know — недостаточно
  const r1 = checkUnlocks(0, 2, 2, withMemories(['soldier_trust']), {});
  if (r1.fired.includes('yellow_wire')) {
    report('HIGH', 'YW-LEAK', `0-2-2 с одним soldier_trust выдал yellow_wire`, { fired: r1.fired });
  }
  // terrorist_know без soldier_trust и без terroristNeutralized — недостаточно
  const r2 = checkUnlocks(0, 2, 2, withMemories(['terrorist_know']), {});
  if (r2.fired.includes('yellow_wire')) {
    report('HIGH', 'YW-LEAK', `0-2-2 только с terrorist_know выдал yellow_wire`, { fired: r2.fired });
  }
  // Полный набор условий — должно сработать
  const r3 = checkUnlocks(0, 2, 2, withMemories(['terrorist_know', 'soldier_trust']), {});
  if (!r3.fired.includes('yellow_wire')) {
    report('CRITICAL', 'YW-BLOCK', `0-2-2 с terrorist_know+soldier_trust не выдал yellow_wire`, { fired: r3.fired });
  }
  // terroristNeutralized — должно сработать даже без soldier_trust
  const r4 = checkUnlocks(0, 2, 2, withMemories(['terrorist_know']), { terroristNeutralized: true });
  if (!r4.fired.includes('yellow_wire')) {
    report('CRITICAL', 'YW-BLOCK-STEALTH', `0-2-2 при terroristNeutralized не выдал yellow_wire`, { fired: r4.fired });
  }
}

// ============================================================
// АУДИТ 18: каскадная выдача bomb_found на ветке 0-2-x
// ============================================================
function auditCascadeBombFound() {
  for (const k of [0, 1, 2]) {
    const { fired } = checkUnlocks(0, 2, k, emptyMemories(), {});
    if (!fired.includes('bomb_found')) {
      report('HIGH', 'NO-CASCADE', `0-2-${k} (вскрытие рюкзака) не выдаёт bomb_found`, { fired });
    }
  }
  // Финальная подсказка при yellow_wire без bomb_found больше не должна возникать,
  // потому что каскад делает bomb_found неизбежной при выдаче yellow_wire.
  // Проверим, что симуляция «победный сбор всех улик» проходит без логических разрывов.
  let mem = emptyMemories();
  let state = { terroristNeutralized: false };
  // bomb_found
  let r = checkUnlocks(0, 1, 1, mem, state); mem = r.memories;
  // terrorist_know
  r = checkUnlocks(1, 0, 2, mem, state); mem = r.memories;
  // generator_key
  r = checkUnlocks(2, 1, 0, mem, state); mem = r.memories;
  // brake_broken (через ключ)
  r = checkUnlocks(2, 1, 2, mem, state); mem = r.memories;
  // cabin_code
  r = checkUnlocks(2, 0, 1, mem, state); mem = r.memories;
  // soldier_trust
  r = checkUnlocks(1, 2, 2, mem, state); mem = r.memories;
  // yellow_wire
  r = checkUnlocks(0, 2, 2, mem, state); mem = r.memories;

  const missing = ALL_KEYS.filter(k => !mem[k]);
  if (missing.length > 0) {
    report('CRITICAL', 'CHAIN-WALK', `Сценарий 7 циклов не собирает все улики`, { missing });
  }
}

// ============================================================
// АУДИТ 19: 1-2-0 — текст и улика согласованы при пустой памяти
// ============================================================
function auditEarly120Text() {
  const mem = emptyMemories();
  const text = getEndingText(1, 2, 0, mem, {});
  const { fired } = checkUnlocks(1, 2, 0, mem, {});

  // Если выдан brake_broken, текст должен явно упомянуть саботаж/тормоза.
  if (fired.includes('brake_broken') && !/тормоз|саботаж|шланг|магистрал/i.test(text)) {
    report('HIGH', 'TX-NOMATCH', `1-2-0 при пустой памяти выдаёт brake_broken, но текст без слова «тормоз/саботаж»`, { textStart: text.substring(0, 80) });
  }
}

// ============================================================
// MAIN
// ============================================================
auditBranchBlocking();
auditUnlockTextConsistency();
auditAchievability();
auditOptimalRun();
auditTextQuality();
auditYellowWireCase();
auditBrakeBrokenMisfire();
auditTerroristKnowDiscovery();
auditTrueEndingFailModes();
auditFatalSet();
auditChronoResonance();
auditStealthSession();
auditTrueEndingFailMessages();
auditHtmlSanity();
auditAlternativeReachability();
auditChainedUnlock120();
auditYellowWireGate();
auditCascadeBombFound();
auditEarly120Text();

const bySev = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => bySev[f.severity]++);

console.log('=== АУДИТ ХРОНО-МЕТРО ===');
console.log(`Critical: ${bySev.CRITICAL}, High: ${bySev.HIGH}, Medium: ${bySev.MEDIUM}, Low: ${bySev.LOW}`);
console.log('');

const grouped = {};
findings.forEach(f => {
  grouped[f.code] = grouped[f.code] || [];
  grouped[f.code].push(f);
});

for (const [code, items] of Object.entries(grouped)) {
  console.log(`[${items[0].severity}] ${code} (${items.length} шт.)`);
  console.log(`  ${items[0].msg}`);
  items.slice(0, 5).forEach(item => {
    const extras = Object.entries(item).filter(([k]) => !['severity', 'code', 'msg'].includes(k));
    if (extras.length) console.log(`    ${extras.map(([k, v]) => `${k}=${JSON.stringify(v).substring(0, 120)}`).join(', ')}`);
  });
  if (items.length > 5) console.log(`    ...и ещё ${items.length - 5}`);
  console.log('');
}

process.exit(bySev.CRITICAL > 0 ? 2 : 0);
