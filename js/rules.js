// Единственный источник правды по разблокировке улик и достижимости истинной концовки.
// Эта функция чистая: принимает снимок памяти и стейта ДО выбора, возвращает новый снимок.
// Game.js применяет результат через unlockMemory(), тесты вызывают напрямую.
// Никаких мутаций this.memories посреди условий — порядок правил больше не влияет на выдачу.

export function applyUnlocks(path, memoriesBefore, stateBefore = {}) {
  const [i, j, k] = path;
  const next = { ...memoriesBefore };
  const fired = [];

  const unlock = (key) => {
    if (!next[key]) {
      next[key] = true;
      fired.push(key);
    }
  };

  // Снимок состояния до — всегда читаем из memoriesBefore, не из next.
  // Это исключает рассинхрон, когда первое правило записало улику,
  // а следующее увидело уже изменённое значение и пропустило свой случай.
  const hadTerroristKnow = !!memoriesBefore.terrorist_know;
  const hadGeneratorKey = !!memoriesBefore.generator_key;
  const hadSoldierTrust = !!memoriesBefore.soldier_trust;
  const hadBombFound = !!memoriesBefore.bomb_found;
  const terroristNeutralized = !!stateBefore.terroristNeutralized;

  // 1. bomb_found — найти и опознать рюкзак.
  //    Базовые пути: 0-1-1, 0-1-2.
  //    Каскад: любое сознательное вскрытие рюкзака на ветке 0-2 тоже открывает базовую улику,
  //    иначе игрок может получить yellow_wire, не имея bomb_found, и финальная подсказка
  //    некорректно говорит «я даже не подозреваю о бомбе».
  if (i === 0 && j === 1 && (k === 1 || k === 2)) unlock('bomb_found');
  if (i === 0 && j === 2) unlock('bomb_found');

  // 2. terrorist_know — установить личность парня в капюшоне.
  if ((i === 1 && j === 0 && k === 2) || (i === 1 && j === 2 && k === 0)) unlock('terrorist_know');

  // 3. generator_key — забрать ключ у спящего монтёра.
  if (i === 2 && j === 1 && (k === 0 || k === 1)) unlock('generator_key');

  // 4. brake_broken — обнаружить саботаж тормозного шланга.
  //    Через стоп-кран (1-2-0) — только если игрок ещё не знал террориста:
  //    с terrorist_know ветка i=1 j=2 k=0 превращается в «прыжок на террориста»,
  //    и стоп-кран в этой сцене вообще не задействован.
  //    Через люк (2-1-2) — только если ключ уже добыт.
  if ((i === 1 && j === 2 && k === 0 && !hadTerroristKnow) ||
      (i === 2 && j === 1 && k === 2 && hadGeneratorKey)) {
    unlock('brake_broken');
  }

  // 5. cabin_code — узнать про уязвимость кодовой панели.
  if ((i === 2 && j === 0 && k === 1) || (i === 2 && j === 2 && k === 1)) unlock('cabin_code');

  // 6. soldier_trust — узнать имя Алексея.
  //    Через девушку (1-2-1) — только если игрок ещё не знал террориста.
  //    Через сцену схватки (1-2-2) — только с terrorist_know, и только если доверия ещё нет.
  if ((i === 1 && j === 2 && k === 1 && !hadTerroristKnow) ||
      (i === 1 && j === 2 && k === 2 && hadTerroristKnow && !hadSoldierTrust)) {
    unlock('soldier_trust');
  }

  // 7. yellow_wire — обезвредить бомбу жёлтым проводом.
  //    Требует подтверждённого контроля над террористом:
  //    либо мы знаем террориста И заручились доверием Алексея (он может схватить нужного человека),
  //    либо террорист уже скручен прямо сейчас в этой сессии (стелс через 1-1-1 / 1-1-2).
  //    Одного soldier_trust без terrorist_know недостаточно: Алексею некого хватать.
  const terroristControlled = (hadTerroristKnow && hadSoldierTrust) || terroristNeutralized;
  if (i === 0 && j === 2 && k === 2 && terroristControlled) unlock('yellow_wire');

  return { memories: next, fired };
}

// Утилита для UI: проверка одного из 7 fail-исходов истинной концовки.
// Возвращает либо ключ, которого не хватает, либо null если всё на месте.
export function missingForTrueEnding(memories) {
  if (!memories.bomb_found) return 'bomb_found';
  if (!memories.yellow_wire) return 'yellow_wire';
  if (!memories.terrorist_know) return 'terrorist_know';
  if (!memories.soldier_trust) return 'soldier_trust';
  if (!memories.generator_key) return 'generator_key';
  if (!memories.brake_broken) return 'brake_broken';
  if (!memories.cabin_code) return 'cabin_code';
  return null;
}
