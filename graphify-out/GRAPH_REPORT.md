# Graph Report - Antigravity  (2026-05-21)

## Corpus Check
- 5 files · ~23,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 97 nodes · 158 edges · 6 communities (4 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]

## God Nodes (most connected - your core abstractions)
1. `ChronoMetro` - 41 edges
2. `ChronoAudio` - 10 edges
3. `Хроно-Метро: Петля Энтропии — Карта взаимодействий` - 9 edges
4. `getEndingText()` - 6 edges
5. `getAvailableChoices()` - 4 edges
6. `getScene3Choices()` - 4 edges
7. `isFatalEnding()` - 4 edges
8. `2. Дерево выборов — все 27 путей` - 4 edges
9. `7. Перекрёстные ссылки методов` - 4 edges
10. `getSceneText()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `runTests()` --calls--> `getEndingText()`  [EXTRACTED]
  js/test-runner.mjs → js/text-data.js

## Communities (6 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (23): 1. Общая блок-схема потока, 3. Карта влияния воспоминаний, 4. Таблица разблокировок улик, 5. Оптимальный порядок сбора улик, 6. Архитектура модулей, 7. Перекрёстные ссылки методов, code:mermaid (flowchart TD), code:mermaid (flowchart LR) (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (14): app, overlay, failures, runTests(), DEFAULT_MEMORIES, FATAL_ENDINGS, getAvailableChoices(), getEndingText() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.40
Nodes (5): 2. Дерево выборов — все 27 путей, code:mermaid (flowchart LR), Ветки Сцены 1, Полная таблица 27 концовок, Статистика

## Knowledge Gaps
- **20 isolated node(s):** `app`, `overlay`, `failures`, `FATAL_ENDINGS`, `code:mermaid (flowchart TD)` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ChronoMetro` connect `Community 1` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.354) - this node is a cross-community bridge._
- **Why does `ChronoAudio` connect `Community 4` to `Community 3`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Хроно-Метро: Петля Энтропии — Карта взаимодействий` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `app`, `overlay`, `failures` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._