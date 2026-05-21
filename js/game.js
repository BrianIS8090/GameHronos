import { ChronoAudio } from './audio.js';
import {
  getSceneText, getAvailableChoices, getScene3Text, getScene3Choices,
  getEndingText, getZoneAnalysis, isFatalEnding,
  MEMORY_META, DEFAULT_MEMORIES
} from './text-data.js';
import { applyUnlocks } from './rules.js';

class ChronoMetro {
  constructor() {
    this.memories = { ...DEFAULT_MEMORIES };
    this.memoryMeta = MEMORY_META;
    this.state = {
      loop: 1,
      entropy: 0.0,
      currentScene: 1,
      pathHistory: [],
      timeRemaining: 180000,
      isGameOver: false,
      openedPaths: new Set()
    };
    this.audio = new ChronoAudio();
    this.timerInterval = null;
    this.typewriterTimeout = null;
    this.lastBeepSec = -1;
  }

  _getSceneText() {
    return getSceneText(this.state.currentScene, this.state.pathHistory, this.memories);
  }

  _getChoices() {
    return getAvailableChoices(this.state.currentScene, this.state.pathHistory, this.memories, this.state);
  }

  _getScene3Text() {
    const i = this.state.pathHistory[0];
    const j = this.state.pathHistory[1];
    return getScene3Text(i, j, this.memories);
  }

  _getScene3Choices() {
    const i = this.state.pathHistory[0];
    const j = this.state.pathHistory[1];
    return getScene3Choices(i, j, this.memories);
  }

  _getEndingText(i, j, k) {
    return getEndingText(i, j, k, this.memories, this.state);
  }

  init() {
    this.loadProgress();
    this.renderArchive();
    this.updateStats();
    this.startLoop();
  }

  loadProgress() {
    const savedMemories = localStorage.getItem('chrono_memories_v2');
    const savedOpenedPaths = localStorage.getItem('chrono_opened_paths_v2');
    const savedLoop = localStorage.getItem('chrono_loop_v2');
    if (savedMemories) { this.memories = JSON.parse(savedMemories); }
    if (savedOpenedPaths) { this.state.openedPaths = new Set(JSON.parse(savedOpenedPaths)); }
    if (savedLoop) { this.state.loop = parseInt(savedLoop, 10); }
    this.calculateEntropy();
  }

  saveProgress() {
    localStorage.setItem('chrono_memories_v2', JSON.stringify(this.memories));
    localStorage.setItem('chrono_opened_paths_v2', JSON.stringify(Array.from(this.state.openedPaths)));
    localStorage.setItem('chrono_loop_v2', this.state.loop.toString());
  }

  calculateEntropy() {
    this.state.entropy = Math.min((this.state.openedPaths.size / 27) * 100, 99.9);
  }

  startLoop() {
    this.state.currentScene = 1;
    this.state.pathHistory = [];
    this.state.timeRemaining = 180000;
    this.state.isGameOver = false;
    this.state.cabinCode = this._generateCabinCode();
    this.state.terroristNeutralized = false;

    this.updateStats();
    this.updateInteractiveZones();
    this.renderScene();

    this._resumeTimer();
  }

  // Возобновление таймера от текущего значения timeRemaining.
  // Используется и при startLoop, и при возврате из keypad cancel/back.
  _resumeTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const startTime = Date.now();
    const initialRemaining = this.state.timeRemaining;

    this.timerInterval = setInterval(() => {
      if (this.state.isGameOver) {
        clearInterval(this.timerInterval);
        return;
      }
      const elapsed = Date.now() - startTime;
      this.state.timeRemaining = Math.max(initialRemaining - elapsed, 0);

      this.updateTimerDisplay();

      if (this.state.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeout();
      }
    }, 33);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('chrono-timer');
    const totalMs = this.state.timeRemaining;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor(totalMs % 1000);

    const format = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    timerEl.textContent = format;

    if (totalMs < 30000 && secs !== this.lastBeepSec) {
      this.lastBeepSec = secs;
      this.audio.playTimerBeep();
      timerEl.style.textShadow = '0 0 15px #ff0055';
      setTimeout(() => {
        timerEl.style.textShadow = 'none';
      }, 200);
    }
  }

  handleTimeout() {
    this.state.isGameOver = true;
    this.triggerRestart(
      "ВРЕМЯ ИСТЕКЛО. Грозное тиканье под сиденьем сливается со свистом тормозов. Я не успел. Ослепительная багровая вспышка разрывает обшивку вагона. Моя плоть мгновенно обращается в пепел. Ударная волна сминает металл, погружая туннель в первозданный хаос..."
    );
  }

  updateStats() {
    document.getElementById('loop-counter').textContent = this.state.loop.toString().padStart(2, '0');
    this.calculateEntropy();
    document.getElementById('entropy-value').textContent = `${this.state.entropy.toFixed(1)}%`;
    document.getElementById('tests-count').textContent = `Пройдено уникальных путей: ${this.state.openedPaths.size}/27`;
  }

  updateInteractiveZones() {
    const zones = {
      bomb: { el: document.getElementById('zone-bomb'), key: 'bomb_found' },
      cabin: { el: document.getElementById('zone-cabin'), key: 'cabin_code' },
      shield: { el: document.getElementById('zone-shield'), key: 'generator_key' },
      terrorist: { el: document.getElementById('zone-terrorist'), key: 'terrorist_know' },
      soldier: { el: document.getElementById('zone-soldier'), key: 'soldier_trust' },
      hatch: { el: document.getElementById('zone-hatch'), key: 'brake_broken' },
      brake: { el: document.getElementById('zone-brake'), key: 'brake_broken' }
    };

    for (const [id, zone] of Object.entries(zones)) {
      if (zone.el) {
        zone.el.className.baseVal = "svg-interactive-zone " +
          (this.memories[zone.key] ? "zone-unlocked" : "zone-locked");
      }
    }
  }

  unlockMemory(key) {
    if (this.memories[key]) return;

    this.memories[key] = true;
    this.saveProgress();
    this.updateInteractiveZones();
    this.renderArchive();

    const banner = document.getElementById('alert-banner');
    const msg = document.getElementById('alert-message');
    const meta = this.memoryMeta[key];

    msg.innerHTML = `Записано квантовое воспоминание:<br><strong>«${meta.title}»</strong>`;
    banner.classList.add('active');
    this.audio.playGlitch();

    setTimeout(() => {
      banner.classList.remove('active');
    }, 3500);
  }

  analyzeZone(zoneId) {
    const result = getZoneAnalysis(zoneId, this.memories);
    if (!result) return;

    const modal = document.getElementById('modal-overlay');
    const header = document.getElementById('modal-header');
    const body = document.getElementById('modal-body');

    header.textContent = result.title;
    body.innerHTML = result.content;
    modal.classList.add('active');
    this.audio.playGlitch();
  }

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  renderScene() {
    const display = document.getElementById('story-display');
    const choicesDiv = document.getElementById('choices-display');

    display.innerHTML = "";
    choicesDiv.innerHTML = "";

    const textContent = this.state.currentScene === 3
      ? this._getScene3Text()
      : this._getSceneText();
    this.typewriterEffect(display, textContent);

    const choices = this._getChoices();

    choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = `choice-btn ${choice.replaced ? 'replaced' : ''}`;

      if (choice.disabled) {
        btn.classList.add('disabled');
        btn.disabled = true;
      }

      const idxSpan = document.createElement('span');
      idxSpan.className = 'choice-index';
      idxSpan.textContent = `0${index + 1}`;

      const textNode = document.createTextNode(choice.text);

      btn.appendChild(idxSpan);
      btn.appendChild(textNode);

      btn.onclick = () => {
        if (this.state.isGameOver || choice.disabled) return;
        this.handleChoice(index);
      };

      choicesDiv.appendChild(btn);
    });
  }

  typewriterEffect(element, text) {
    if (this.typewriterTimeout) clearTimeout(this.typewriterTimeout);
    element.innerHTML = "";

    let i = 0;
    const words = text.split(" ");

    const nextWord = () => {
      if (i < words.length) {
        let word = words[i];

        // Не глитчим токены, в которых есть HTML — иначе разломаем <strong>, <em>, <span>...
        // Текст приходит уже с разметкой, и подмена символов внутри тега сломает рендер.
        const hasHtml = word.includes('<') || word.includes('>') || word.includes('&');
        if (!hasHtml && Math.random() < 0.04 && word.length > 3) {
          const originalWord = word;
          word = `<span class="glitch-text">${word.replace(/[а-яА-Яe]/g, () => String.fromCharCode(33 + Math.floor(Math.random() * 30)))}</span>`;
          this.audio.playGlitch();
          setTimeout(() => {
            const el = element.querySelector('.glitch-text');
            if (el) {
              el.textContent = originalWord;
              el.className = "";
            }
          }, 120);
        }

        element.innerHTML += (i === 0 ? "" : " ") + word;
        this.audio.playTextClick();
        i++;

        let delay = 35;
        const lastChar = word.slice(-1);
        if (lastChar === '.' || lastChar === '!' || lastChar === '?') delay = 250;
        else if (lastChar === ',') delay = 100;

        this.typewriterTimeout = setTimeout(nextWord, delay);
      }
    };

    nextWord();
  }

  handleChoice(choiceIndex) {
    this.state.pathHistory.push(choiceIndex);

    if (this.state.currentScene === 1) {
      this.state.currentScene = 2;
      this.audio.playGlitch();
      this.renderScene();
    }
    else if (this.state.currentScene === 2) {
      this.state.currentScene = 3;
      this.audio.playGlitch();
      this.renderScene();
    }
    else if (this.state.currentScene === 3) {
      const i = this.state.pathHistory[0];
      const j = this.state.pathHistory[1];

      if (i === 2 && j === 2 && choiceIndex === 2) {
        this.startKeypadGame();
      } else {
        this.state.isGameOver = true;
        this.showEnding();
      }
    }
  }

  showEnding() {
    const i = this.state.pathHistory[0];
    const j = this.state.pathHistory[1];
    const k = this.state.pathHistory[2] !== undefined ? this.state.pathHistory[2] : 0;

    const isTerroristNeutralizedPath = (i === 1 && j === 1 && (k === 1 || k === 2) && this.memories.terrorist_know);
    if (isTerroristNeutralizedPath) {
      this.state.terroristNeutralized = true;
    }

    const pathKey = `${i}-${j}-${k}`;
    this.state.openedPaths.add(pathKey);

    const endingText = this._getEndingText(i, j, k);
    console.log(`[DEBUG] path: ${i}-${j}-${k}, terrorist_know: ${this.memories.terrorist_know}, endingText starts with: ${endingText.substring(0, 80)}`);

    this.checkUnlocks(i, j, k);
    this.saveProgress();

    if (this.timerInterval) clearInterval(this.timerInterval);

    const display = document.getElementById('story-display');
    const choicesDiv = document.getElementById('choices-display');

    display.innerHTML = "";
    choicesDiv.innerHTML = "";

    this.typewriterEffect(display, endingText);

    const isTrueFin = (i === 2 && j === 2 && k === 2 &&
      this.memories.cabin_code && this.memories.bomb_found &&
      this.memories.yellow_wire && this.memories.brake_broken &&
      this.memories.soldier_trust && this.memories.generator_key &&
      this.memories.terrorist_know);

    const isFatal = isFatalEnding(i, j, k, this.memories, this.state);

    const restartBtn = document.createElement('button');
    if (isTrueFin) {
      restartBtn.className = 'choice-btn replaced';
      restartBtn.innerHTML = '<span class="choice-index" style="color: var(--neon-green); border-color: var(--neon-green);">FIN</span> ПЕТЛЯ ВРЕМЕНИ РАЗОРВАНА. ВЫЙТИ НА СВЕЖИЙ ВОЗДУХ';
      restartBtn.onclick = () => {
        alert("Поздравляем! Вы разорвали петлю энтропии и спасли пассажиров состава. Хроно-стабилизация завершена успешно.");
        this.initiateChronoCollapse();
      };
    } else if (isFatal) {
      restartBtn.className = 'choice-btn';
      restartBtn.innerHTML = '<span class="choice-index" style="color: var(--neon-red); border-color: var(--neon-red);">RESTART</span> ИНИЦИИРОВАТЬ НОВЫЙ ВРЕМЕННОЙ ЦИКЛ';
      restartBtn.onclick = () => {
        this.triggerRestart("Инициализация квантового сдвига... Возврат к начальной хроно-точке.");
      };
    } else {
      restartBtn.className = 'choice-btn replaced';
      restartBtn.innerHTML = '<span class="choice-index" style="color: var(--neon-green); border-color: var(--neon-green);">CONTINUE</span> ВЕРНУТЬСЯ К ОСМОТРУ ВАГОНА';
      restartBtn.onclick = () => {
        this.state.currentScene = 1;
        this.state.pathHistory = [];
        this.state.isGameOver = false;
        this.audio.playGlitch();
        this._resumeTimer();
        this.renderScene();
      };
    }

    choicesDiv.appendChild(restartBtn);
    this.updateStats();
    this.renderArchive();
  }

  checkUnlocks(i, j, k) {
    // Делегируем единственному источнику правды по правилам разблокировки.
    // Snapshot памяти и стейта берётся ДО мутации, поэтому порядок условий не влияет.
    const { fired } = applyUnlocks([i, j, k], this.memories, this.state);
    fired.forEach((key) => this.unlockMemory(key));
  }

  _generateCabinCode() {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    return digits.slice(0, 3).map(String);
  }

  startKeypadGame() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.keypadState = {
      input: [],
      attempts: 0,
      maxAttempts: 9,
      code: this.state.cabinCode,
      history: []
    };

    this._renderKeypad();
  }

  _renderKeypad() {
    const choicesDiv = document.getElementById('choices-display');
    choicesDiv.innerHTML = '';
    document.getElementById('story-display').innerHTML = '';

    const overlay = document.createElement('div');
    overlay.className = 'keypad-overlay';
    overlay.id = 'keypad-overlay';

    const title = document.createElement('div');
    title.className = 'keypad-title';
    title.textContent = 'ПАНЕЛЬ КОДОВОГО ЗАМКА';
    overlay.appendChild(title);

    const info = document.createElement('div');
    info.className = 'keypad-info';
    const attemptsEl = document.createElement('span');
    attemptsEl.className = 'keypad-attempts';
    attemptsEl.id = 'keypad-attempts';
    attemptsEl.textContent = `ПОПЫТКА 1/${this.keypadState.maxAttempts}`;
    info.appendChild(attemptsEl);
    const matchesEl = document.createElement('span');
    matchesEl.className = 'keypad-matches none';
    matchesEl.id = 'keypad-matches';
    matchesEl.textContent = '';
    info.appendChild(matchesEl);
    overlay.appendChild(info);

    const displayRow = document.createElement('div');
    displayRow.className = 'keypad-display';
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div');
      slot.className = 'keypad-slot';
      slot.id = `keypad-slot-${i}`;
      displayRow.appendChild(slot);
    }
    overlay.appendChild(displayRow);

    const grid = document.createElement('div');
    grid.className = 'keypad-grid';
    const activeDigits = this.keypadState.code;

    for (let d = 1; d <= 9; d++) {
      const btn = document.createElement('button');
      btn.className = 'keypad-btn';
      btn.textContent = d.toString();
      btn.dataset.digit = d.toString();

      const isActive = activeDigits.includes(d.toString());

      if (!isActive) {
        btn.classList.add('broken');
        btn.onclick = () => this._keypadBroken(btn);
      } else {
        btn.onclick = () => this._keypadInput(d.toString(), btn);
      }

      grid.appendChild(btn);
    }
    overlay.appendChild(grid);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'keypad-actions';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'keypad-btn clear action';
    clearBtn.textContent = 'ОЧИСТИТЬ';
    clearBtn.onclick = () => this._keypadClear();
    actionsRow.appendChild(clearBtn);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'keypad-btn submit action';
    submitBtn.textContent = 'ПРОВЕРИТЬ';
    submitBtn.onclick = () => this._keypadSubmit();
    actionsRow.appendChild(submitBtn);

    overlay.appendChild(actionsRow);

    const historyDiv = document.createElement('div');
    historyDiv.className = 'keypad-history';
    historyDiv.id = 'keypad-history';
    overlay.appendChild(historyDiv);

    const backBtn = document.createElement('button');
    backBtn.className = 'keypad-btn back action';
    backBtn.style.marginTop = '8px';
    backBtn.style.width = '100%';
    backBtn.style.maxWidth = '240px';
    backBtn.textContent = 'ОТМЕНА';
    backBtn.onclick = () => this._keypadCancel();
    overlay.appendChild(backBtn);

    document.body.appendChild(overlay);
    this.audio.playGlitch();
  }

  _keypadInput(digit, btnEl) {
    if (this.keypadState.input.length >= 3) return;
    if (this.keypadState.input.includes(digit)) return;

    this.keypadState.input.push(digit);
    btnEl.classList.add('pressed');

    this._updateKeypadSlots();
    this.audio.playTextClick();
  }

  _keypadBroken(btnEl) {
    btnEl.classList.add('spark');
    setTimeout(() => btnEl.classList.remove('spark'), 400);
    this.audio.playGlitch();
  }

  _keypadClear() {
    this.keypadState.input = [];

    document.querySelectorAll('.keypad-btn.pressed').forEach(b => b.classList.remove('pressed'));
    this._updateKeypadSlots();
  }

  _keypadCancel() {
    this.keypadState = null;
    const overlay = document.getElementById('keypad-overlay');
    if (overlay) overlay.remove();

    // Откатываем pathHistory с [2,2,2] обратно до [2,2], иначе следующий выбор
    // на сцене 3 будет записан четвёртым элементом и showEnding всё равно
    // примет путь как 2-2-2 (k берётся из pathHistory[2]).
    if (this.state.pathHistory.length === 3 &&
        this.state.pathHistory[0] === 2 &&
        this.state.pathHistory[1] === 2 &&
        this.state.pathHistory[2] === 2) {
      this.state.pathHistory.pop();
    }

    this.state.currentScene = 3;
    this.state.isGameOver = false;
    this.audio.playGlitch();
    this._resumeTimer();
    this.renderScene();
  }

  _updateKeypadSlots() {
    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`keypad-slot-${i}`);
      if (!slot) continue;
      slot.textContent = this.keypadState.input[i] || '';
      slot.className = 'keypad-slot';
      if (this.keypadState.input[i]) {
        slot.classList.add('active');
      }
    }
  }

  _keypadSubmit() {
    if (this.keypadState.input.length < 3) return;

    this.keypadState.attempts++;
    let matches = 0;

    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`keypad-slot-${i}`);
      if (!slot) continue;
      if (this.keypadState.input[i] === this.keypadState.code[i]) {
        slot.className = 'keypad-slot correct';
        matches++;
      } else {
        slot.className = 'keypad-slot wrong';
      }
    }

    const matchesEl = document.getElementById('keypad-matches');
    if (matchesEl) {
      matchesEl.textContent = `${matches}/3 совпадений`;
      matchesEl.className = matches > 0 ? 'keypad-matches' : 'keypad-matches none';
    }

    this._addHistoryEntry(this.keypadState.input.join(''), matches);

    if (matches === 3) {
      setTimeout(() => this._keypadSuccess(), 800);
      return;
    }

    if (this.keypadState.attempts >= this.keypadState.maxAttempts) {
      setTimeout(() => this._keypadFail(), 1000);
      return;
    }

    const attemptsEl = document.getElementById('keypad-attempts');
    if (attemptsEl) {
      attemptsEl.textContent = `ПОПЫТКА ${this.keypadState.attempts + 1}/${this.keypadState.maxAttempts}`;
    }

    setTimeout(() => {
      this._keypadClear();
    }, 1200);
  }

  _addHistoryEntry(input, matches) {
    const historyDiv = document.getElementById('keypad-history');
    if (!historyDiv) return;

    const item = document.createElement('div');
    item.className = 'keypad-history-item';
    const codeSpan = document.createElement('span');
    codeSpan.style.color = 'var(--text-muted)';
    codeSpan.textContent = input;
    const matchSpan = document.createElement('span');
    matchSpan.style.color = matches > 0 ? 'var(--neon-green)' : 'var(--neon-red)';
    matchSpan.textContent = `${matches}/3`;
    item.appendChild(codeSpan);
    item.appendChild(matchSpan);
    historyDiv.insertBefore(item, historyDiv.firstChild);
  }

  _keypadSuccess() {
    this.keypadState = null;
    const overlay = document.getElementById('keypad-overlay');
    if (overlay) overlay.remove();

    this.state.isGameOver = true;
    this.showEnding();
  }

  _keypadFail() {
    this.keypadState = null;
    const overlay = document.getElementById('keypad-overlay');
    if (overlay) overlay.remove();

    const display = document.getElementById('story-display');
    display.innerHTML = '<div style="color: var(--neon-red); font-family: var(--font-orbitron); text-align: center; padding: 40px;">СИСТЕМА БЕЗОПАСНОСТИ ЗАБЛОКИРОВАЛА ПАНЕЛЬ<br><br><span style="font-size: 12px; color: var(--text-muted);">Электромагнитный замок заблокирован. Попробуйте другой путь.</span></div>';

    const choicesDiv = document.getElementById('choices-display');
    choicesDiv.innerHTML = '';

    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.innerHTML = '<span class="choice-index" style="color: var(--neon-red); border-color: var(--neon-red);">BACK</span> ВЕРНУТЬСЯ К ВЫБОРУ ДЕЙСТВИЙ';
    btn.onclick = () => {
      this.state.isGameOver = false;
      // pathHistory был [2,2,2] на момент входа в keypad — после провала откатываем
      // последний элемент, чтобы заново предложить выбор k.
      if (this.state.pathHistory.length === 3 &&
          this.state.pathHistory[0] === 2 &&
          this.state.pathHistory[1] === 2 &&
          this.state.pathHistory[2] === 2) {
        this.state.pathHistory.pop();
      }
      this.state.currentScene = 3;
      this.audio.playGlitch();
      this._resumeTimer();
      this.renderScene();
    };
    choicesDiv.appendChild(btn);
  }


  triggerRestart(reasonMessage) {
    this.audio.playExplosion();

    const flash = document.getElementById('glitch-flash');
    const container = document.querySelector('.app-container');

    flash.style.opacity = '1';
    container.classList.add('glitching');

    setTimeout(() => {
      flash.style.opacity = '0';
    }, 150);

    setTimeout(() => {
      flash.style.opacity = '0.8';
    }, 300);

    setTimeout(() => {
      flash.style.opacity = '0';
      container.classList.remove('glitching');

      this.state.loop++;
      this.startLoop();
    }, 1200);
  }

  initiateChronoCollapse() {
    if (confirm("Вы уверены, что хотите запустить ХРОНО-КОЛЛАПС? Все ваши воспоминания и собранные улики будут безвозвратно стерты!")) {
      localStorage.clear();
      this.memories = { ...DEFAULT_MEMORIES };
      this.state.loop = 1;
      this.state.openedPaths.clear();
      this.state.entropy = 0.0;
      this.saveProgress();
      this.audio.playGlitch();
      this.startLoop();
      this.renderArchive();
    }
  }

  renderArchive() {
    const display = document.getElementById('archive-display');
    display.innerHTML = "";

    const archiveItems = [
      { key: 'bomb_found', title: "01: СВУ под сиденьем №4" },
      { key: 'terrorist_know', title: "02: Личность террориста" },
      { key: 'generator_key', title: "03: Трехгранный ключ" },
      { key: 'brake_broken', title: "04: Саботаж тормозов" },
      { key: 'cabin_code', title: "05: Уязвимость замка кабины" },
      { key: 'soldier_trust', title: "06: Доверие Алексея" },
      { key: 'yellow_wire', title: "07: Желтый провод бомбы" }
    ];

    archiveItems.forEach(item => {
      const card = document.createElement('div');
      const isUnlocked = this.memories[item.key];

      if (isUnlocked) {
        card.className = "memory-card unlocked";
        card.innerHTML = `
          <div class="memory-title">${item.title}</div>
          <div class="memory-desc">${this.memoryMeta[item.key].desc}</div>
        `;
      } else {
        card.className = "memory-card locked";
        card.innerHTML = `
          <div class="memory-title" style="color: var(--text-muted);">${item.title.split(":")[0]}: [ДАННЫЕ ЗАБЛОКИРОВАНЫ]</div>
          <div class="memory-desc">Исследуйте временные линии, чтобы восстановить этот файл памяти.</div>
        `;
      }

      display.appendChild(card);
    });
  }

  toggleTestPanel() {
    const panel = document.getElementById('test-panel');
    if (panel.style.display === 'flex') {
      panel.style.display = 'none';
    } else {
      panel.style.display = 'flex';
    }
  }

  async runAllPathsTest() {
    const log = document.getElementById('test-log');
    const btn = document.getElementById('run-tests-btn');
    log.innerHTML = "<strong>Инициализация авто-теста 27 путей (×2 режима памяти)...</strong><br>";
    btn.disabled = true;
    btn.textContent = "Тестирование...";

    const backupMemories = JSON.stringify(this.memories);
    const backupPaths = JSON.stringify(Array.from(this.state.openedPaths));
    const backupLoop = this.state.loop;

    let passedCount = 0;
    let failedCount = 0;

    const testPass = async (withMemories) => {
      if (withMemories) {
        for (let key in this.memories) { this.memories[key] = true; }
      } else {
        for (let key in this.memories) { this.memories[key] = false; }
      }

      const label = document.createElement('div');
      label.style.color = withMemories ? 'var(--neon-green)' : 'var(--neon-cyan)';
      label.style.marginTop = '8px';
      label.textContent = withMemories ? '--- Все улики собраны ---' : '--- Без улик ---';
      log.appendChild(label);

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          for (let k = 0; k < 3; k++) {
            const pathStr = `${i}-${j}-${k}`;
            const text = this._getEndingText(i, j, k);

            const item = document.createElement('div');
            item.className = 'test-log-item';

            if (text && !text.includes("ОШИБКА ХРОНОЛОГИИ")) {
              item.className += ' success';
              item.innerHTML = `<span>${withMemories ? '+' : '-'}[${pathStr}]</span> <span>OK</span>`;
              passedCount++;
            } else {
              item.className += ' fail';
              item.innerHTML = `<span>${withMemories ? '+' : '-'}[${pathStr}]</span> <span>ОШИБКА</span>`;
              failedCount++;
            }
            log.appendChild(item);
            log.scrollTop = log.scrollHeight;

            await new Promise(r => setTimeout(r, 20));
          }
        }
      }
    };

    await testPass(false);
    await testPass(true);

    this.memories = JSON.parse(backupMemories);
    this.state.openedPaths = new Set(JSON.parse(backupPaths));
    this.state.loop = backupLoop;
    this.saveProgress();
    this.updateStats();
    this.renderArchive();

    const summary = document.createElement('div');
    summary.style.marginTop = '10px';
    summary.style.fontWeight = 'bold';
    summary.innerHTML = `<span style="color: var(--neon-green)">Успешно: ${passedCount}</span> / <span style="color: var(--neon-red)">Ошибок: ${failedCount}</span> <span style="color: var(--text-muted)">(из 54 проверок)</span>`;
    log.appendChild(summary);

    btn.disabled = false;
    btn.textContent = "Запустить тест 27 путей";
  }
}

const app = new ChronoMetro();
window.app = app;

document.getElementById('sync-btn').addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  app.audio.init();
  const overlay = document.getElementById('sync-overlay');
  overlay.style.pointerEvents = 'none';
  overlay.style.opacity = '0';
  setTimeout(() => { overlay.style.display = 'none'; }, 1000);
  app.init();
});
