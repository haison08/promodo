/**
 * PRODOMO FOCUS STUDIO - PRECISION TIMER ENGINE
 * Drift-free high-precision countdown, SVG progress sync,
 * session cycling, and desktop notification integration.
 */

class ProdomoTimerEngine {
  constructor() {
    this.storageKey = 'prodomo_settings_v1';
    
    // Default Durations in seconds
    this.durations = {
      'pomodoro': 25 * 60,
      'short-break': 5 * 60,
      'long-break': 15 * 60,
      'deep-work': 50 * 60
    };

    this.settings = {
      alarmSound: 'zen_gong', // 'zen_gong', 'crystal_chime', 'digital', 'bell'
      tickingSound: 'silent',  // 'silent', 'analog', 'wood'
      autoStartBreaks: false,
      autoStartPomos: false,
      longBreakInterval: 4,
      notificationsEnabled: false
    };

    this.currentMode = 'pomodoro'; // 'pomodoro', 'short-break', 'long-break', 'deep-work'
    this.timeLeft = this.durations['pomodoro'];
    this.totalDuration = this.durations['pomodoro'];
    this.isRunning = false;
    this.cycleCount = 1; // 1 to longBreakInterval

    this.timerInterval = null;
    this.expectedEndTime = null;
    this.circumference = 2 * Math.PI * 170; // r=170 -> ~1068.14

    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.durations) Object.assign(this.durations, parsed.durations);
        if (parsed.settings) Object.assign(this.settings, parsed.settings);
      }
    } catch (e) {
      console.error('Failed to load timer settings', e);
    }
    this.timeLeft = this.durations[this.currentMode];
    this.totalDuration = this.durations[this.currentMode];
  }

  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        durations: this.durations,
        settings: this.settings
      }));
    } catch (e) {
      console.error('Failed to save timer settings', e);
    }
  }

  init() {
    this.updateDisplay();
    this.renderCycleDots();
    this.requestNotificationPermission();
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      // Defer prompt until user interacts
    }
  }

  setMode(mode) {
    if (this.isRunning) {
      if (!confirm('Phiên làm việc đang chạy. Bạn có muốn đổi chế độ không?')) {
        return;
      }
      this.pause();
    }

    this.currentMode = mode;
    this.totalDuration = this.durations[mode] || 25 * 60;
    this.timeLeft = this.totalDuration;

    // Update active tab button style
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update state label
    const labelEl = document.getElementById('timerStateLabel');
    const zenStateLabel = document.getElementById('zenStateLabel');
    const modeNames = {
      'pomodoro': '🍅 PHIÊN TẬP TRUNG',
      'short-break': '☕ NGHỈ NGẮN',
      'long-break': '🌴 NGHỈ DÀI',
      'deep-work': '⚡ DEEP WORK SPRINT'
    };
    const titleText = modeNames[mode] || 'PHIÊN TẬP TRUNG';
    if (labelEl) labelEl.textContent = titleText;
    if (zenStateLabel) zenStateLabel.textContent = titleText;

    // Color theme of timer circle based on mode
    const progressCircle = document.getElementById('timerCircleProgress');
    if (progressCircle) {
      if (mode === 'short-break') {
        progressCircle.style.stroke = 'var(--break-short)';
        progressCircle.style.filter = 'drop-shadow(0 0 10px var(--break-short-glow))';
      } else if (mode === 'long-break') {
        progressCircle.style.stroke = 'var(--break-long)';
        progressCircle.style.filter = 'drop-shadow(0 0 10px var(--break-long-glow))';
      } else {
        progressCircle.style.stroke = 'var(--primary)';
        progressCircle.style.filter = 'drop-shadow(0 0 10px var(--primary-glow))';
      }
    }

    this.updateDisplay();
  }

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;

    if (window.ProdomoAudio) {
      window.ProdomoAudio.init();
      window.ProdomoAudio.setTicking(this.settings.tickingSound);
    }

    this.isRunning = true;
    this.expectedEndTime = Date.now() + this.timeLeft * 1000;

    const playBtn = document.getElementById('btnTimerPlay');
    if (playBtn) {
      playBtn.classList.add('running');
      playBtn.innerHTML = `<span>❚❚</span> <span>TẠM DỪNG</span>`;
    }

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 1000);

    this.updateDisplay();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this.timerInterval);

    const playBtn = document.getElementById('btnTimerPlay');
    if (playBtn) {
      playBtn.classList.remove('running');
      playBtn.innerHTML = `<span>▶</span> <span>BẮT ĐẦU</span>`;
    }

    this.updateDisplay();
  }

  reset() {
    this.pause();
    this.timeLeft = this.totalDuration;
    this.updateDisplay();
  }

  skip() {
    if (confirm('Bỏ qua phiên hiện tại và chuyển sang phiên tiếp theo?')) {
      this.completeSession(true);
    }
  }

  adjustTime(minutesDelta) {
    this.timeLeft = Math.max(60, this.timeLeft + minutesDelta * 60);
    this.totalDuration = Math.max(this.timeLeft, this.totalDuration);
    if (this.isRunning) {
      this.expectedEndTime = Date.now() + this.timeLeft * 1000;
    }
    this.updateDisplay();
  }

  tick() {
    const remaining = Math.round((this.expectedEndTime - Date.now()) / 1000);
    this.timeLeft = Math.max(0, remaining);

    if (window.ProdomoAudio) {
      window.ProdomoAudio.playTick();
    }

    this.updateDisplay();

    if (this.timeLeft <= 0) {
      this.completeSession(false);
    }
  }

  completeSession(skipped = false) {
    this.pause();

    const isWorkSession = this.currentMode === 'pomodoro' || this.currentMode === 'deep-work';
    const activeTask = window.ProdomoTasks ? window.ProdomoTasks.getActiveTask() : null;

    if (!skipped) {
      // Play Audio Alarm
      if (window.ProdomoAudio) {
        window.ProdomoAudio.playAlarm(this.settings.alarmSound);
      }

      // Celebratory animation
      if (window.ProdomoGarden && isWorkSession) {
        window.ProdomoGarden.spawnCelebrationParticles();
      }

      // Record Stats & Task Pomodoro
      const durationMins = Math.round(this.totalDuration / 60);
      if (window.ProdomoStats) {
        window.ProdomoStats.recordSession(durationMins, this.currentMode, activeTask);
      }

      if (window.ProdomoTasks && isWorkSession) {
        window.ProdomoTasks.incrementPomoCount();
      }

      // Web Notification
      this.sendDesktopNotification(isWorkSession);
    }

    // Determine Next Mode in Cycle
    if (isWorkSession) {
      if (this.cycleCount >= this.settings.longBreakInterval) {
        this.cycleCount = 1;
        this.setMode('long-break');
      } else {
        this.cycleCount++;
        this.setMode('short-break');
      }
    } else {
      // Break completed -> Return to Pomodoro
      this.setMode('pomodoro');
    }

    this.renderCycleDots();

    // Auto-start next session if configured
    const shouldAutoStart = isWorkSession ? this.settings.autoStartBreaks : this.settings.autoStartPomos;
    if (shouldAutoStart && !skipped) {
      setTimeout(() => this.start(), 1000);
    }
  }

  sendDesktopNotification(wasWork) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = wasWork ? '🍅 Phiên tập trung hoàn tất!' : '⚡ Hết giờ nghỉ! Sẵn sàng tập trung?';
      const body = wasWork 
        ? 'Tuyệt vời! Hãy dành một vài phút để thư giãn mắt và cơ thể.' 
        : 'Hãy quay trở lại với sự tập trung cao độ nhất!';
      
      try {
        new Notification(title, {
          body: body,
          icon: 'assets/logo.png'
        });
      } catch (e) {
        console.warn('Notification error', e);
      }
    }
  }

  updateDisplay() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Update Digital Display
    const displayEl = document.getElementById('timerDigitalDisplay');
    const zenDisplayEl = document.getElementById('zenTimerDisplay');
    if (displayEl) displayEl.textContent = timeFormatted;
    if (zenDisplayEl) zenDisplayEl.textContent = timeFormatted;

    // Update SVG Progress
    const progressCircle = document.getElementById('timerCircleProgress');
    if (progressCircle && this.totalDuration > 0) {
      const progressRatio = this.timeLeft / this.totalDuration;
      const offset = this.circumference * (1 - progressRatio);
      progressCircle.style.strokeDashoffset = offset;
    }

    // Update Document Title
    const modeEmoji = this.currentMode.includes('break') ? '☕' : '🍅';
    document.title = `(${timeFormatted}) ${modeEmoji} ProDomo Studio`;
  }

  renderCycleDots() {
    const dotsContainer = document.getElementById('timerCycleDots');
    const cycleText = document.getElementById('timerCycleText');
    if (!dotsContainer) return;

    let dotsHtml = '';
    const total = this.settings.longBreakInterval || 4;
    for (let i = 1; i <= total; i++) {
      let className = 'cycle-dot';
      if (i < this.cycleCount) className += ' completed';
      else if (i === this.cycleCount) className += ' current';
      dotsHtml += `<div class="${className}"></div>`;
    }
    dotsContainer.innerHTML = dotsHtml;

    if (cycleText) {
      cycleText.textContent = `${this.cycleCount}/${total} phiên`;
    }
  }
}

window.ProdomoTimer = new ProdomoTimerEngine();
