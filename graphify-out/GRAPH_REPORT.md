# Graph Report - GameHronos  (2026-05-21)

## Corpus Check
- 11 files · ~36,753 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 290 nodes · 447 edges · 13 communities (12 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e9be1cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `ChronoMetro` - 42 edges
2. `report()` - 20 edges
3. `Технический аудит интерактивной истории «Хроно-Метро»` - 19 edges
4. `getEndingText()` - 17 edges
5. `withMemories()` - 16 edges
6. `checkUnlocks()` - 13 edges
7. `emptyMemories()` - 12 edges
8. `ChronoAudio` - 11 edges
9. `Хроно-Метро — Полная карта состояний` - 11 edges
10. `Хроно-Метро: Петля Энтропии — Карта взаимодействий` - 9 edges

## Surprising Connections (you probably didn't know these)
- `runTests()` --calls--> `getEndingText()`  [EXTRACTED]
  js/test-runner.mjs → js/text-data.js
- `checkUnlocks()` --calls--> `applyUnlocks()`  [EXTRACTED]
  js/test-audit.mjs → js/rules.js
- `auditTextQuality()` --calls--> `getSceneText()`  [EXTRACTED]
  js/test-audit.mjs → js/text-data.js
- `auditTerroristKnowDiscovery()` --calls--> `getSceneText()`  [EXTRACTED]
  js/test-audit.mjs → js/text-data.js
- `auditChronoResonance()` --calls--> `getSceneText()`  [EXTRACTED]
  js/test-audit.mjs → js/text-data.js

## Communities (13 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (47): Хроно-Метро: Петля Энтропии — Карта взаимодействий, 1. Общая блок-схема потока, Статистика, Ветки Сцены 1, 1. Общая блок-схема потока, Детализация влияния по сценам, Полная таблица 27 концовок, 2. Дерево выборов — все 27 путей (+39 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (35): ALL_KEYS, auditAchievability(), auditAlternativeReachability(), auditBrakeBrokenMisfire(), auditBranchBlocking(), auditCascadeBombFound(), auditChainedUnlock120(), auditChronoResonance() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (33): Технический аудит интерактивной истории «Хроно-Метро», 1. Краткое резюме, 2. Методика проверки, 3. Общая карта текущей логики, 3.1. Обязательные улики для истинного финала, 3.2. Подтверждённый путь до истинной концовки, 4. Таблица проверки 27 путей, 5. Найденные проблемы (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (11): ChronoAudio, app, overlay, failures, runTests(), DEFAULT_MEMORIES, FATAL_ENDINGS, getScene3Choices() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (19): Хроно-Метро — Полная карта состояний, 1. Глоссарий состояний, 10. Keypad: откат и таймер, 2. Карта выборов сцены 1 (i), 3. Карта сцены 2 (j) — зависит от i и улик, 4. Сцена 3 — выборы и тексты (k), 5. Полная таблица 27 концовок (фактическая), 6. applyUnlocks — единственный источник правды (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (19): Хроно-Метро — Результаты аудита, Сценарии, которые теперь покрыты тестами, Дополнительные нюансы (не баги, но требуют внимания), Найденные дыры, code:js (if ((i === 1 && j === 2 && k === 0) || ...) {), code:js (if ((i === 1 && j === 2 && k === 0 && !this.memories.terrori), code:js (if (i === 0 && j === 2 && k === 2 && this.memories.soldier_t), code:js (if (i === 0 && j === 2 && k === 2 && (this.memories.soldier_) (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (11): Хроно-Метро: Петля Энтропии, Архитектура решений, Что игроку нужно знать (без спойлеров), Мобильная версия, Геймплей, Структура файлов, Как запустить, Тестирование (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (12): Что происходит, Почему комплектный аудит это не ловит, Влияние на игру, Рекомендованный фикс, code:text (terrorist_know + brake_broken), code:js (if ((i === 1 && j === 2 && k === 0 && !memories.terrorist_kn), code:js (checkUnlocks(i, j, k) {), code:text (КОНЦОВКА №16: СОРВАННЫЙ ТОРМОЗ (САБОТАЖ + ТЕРРОРИСТ ОБНАРУЖЕ) (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (11): Что происходит, Воспроизведение, Дополнительный эффект, Ожидаемое поведение, Рекомендованный фикс, code:js (this.state.pathHistory.push(choiceIndex);), code:js (_keypadCancel() {), code:js (const k = this.state.pathHistory[2] !== undefined ? this.sta) (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (10): Что происходит, Влияние, Рекомендованные варианты фикса, code:js (if (i === 0 && j === 1 && (k === 1 || k === 2)) {), code:text (yellow_wire=true), code:js (if (!(memories.bomb_found && memories.yellow_wire)) {), code:text (... под сиденьем №4 в салоне тикает бомба, а я даже не подоз), code:js (if (i === 0 && j === 2 && k === 2 && terroristControlled) {) (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (9): Что происходит, Почему это ломает логику, Ожидаемое поведение, Рекомендованный фикс, code:js (if (i === 0 && j === 2 && k === 2 &&), code:js (if (memories.soldier_trust) {), code:js (const terroristControlled =), code:js (const terroristControlled =) (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (9): Что происходит, Влияние, Рекомендованный фикс текста, code:js ({ text: "Аккуратно осмотреть тормозную магистраль в люке" }), code:text (В глубине люка слышен едва заметный свист воздуха. Среди пер), code:text (Нащупать источник утечки и попытаться временно перекрыть маг), code:text (Снаружи повреждение не видно: шланги уходят глубже под пол, ), code:text (Я уже знаю, что один из шлангов надрезан, но с этой позиции ) (+1 more)

## Knowledge Gaps
- **112 isolated node(s):** `FATAL_ENDINGS`, `app`, `overlay`, `ALL_KEYS`, `findings` (+107 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Технический аудит интерактивной истории «Хроно-Метро»` connect `Community 3` to `Community 8`, `Community 9`, `Community 10`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `ChronoMetro` connect `Community 1` to `Community 4`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `FATAL_ENDINGS`, `app`, `overlay` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._