/**
 * PRODOMO FOCUS STUDIO - MAIN APPLICATION CONTROLLER
 * Coordinates UI, themes, bilingual localization, audio mixer sliders,
 * modal dialogs, and keyboard shortcuts.
 */

const ProdomoApp = {
  currentLang: 'vi',
  currentTheme: 'cyber-crimson',

  // Bilingual Dictionaries
  translations: {
    vi: {
      appName: 'ProDomo',
      tagline: 'Deep Work & Pomodoro Focus Studio',
      workSession: '🍅 PHIÊN TẬP TRUNG',
      shortBreak: '☕ NGHỈ NGẮN',
      longBreak: '🌴 NGHỈ DÀI',
      deepSprint: '⚡ DEEP WORK SPRINT',
      startBtn: 'BẮT ĐẦU',
      pauseBtn: 'TẠM DỪNG',
      activeTaskLabel: 'Đang tập trung vào:',
      noTaskSelected: 'Chưa chọn nhiệm vụ nào',
      tasksTitle: 'Kế Hoạch Công Việc',
      soundTitle: 'Không Gian Âm Thanh',
      dailyGoalTitle: 'Mục Tiêu Hôm Nay',
      zenGardenTitle: 'Vườn Thiền Tập Trung',
      addTaskPlaceholder: 'Thêm nhiệm vụ mới cần hoàn thành...',
      exportBtn: 'Sao lưu dữ liệu',
      settingsTitle: 'Cài Đặt Hệ Thống',
      analyticsTitle: 'Thống Kê Năng Suất'
    },
    en: {
      appName: 'ProDomo',
      tagline: 'Deep Work & Pomodoro Focus Studio',
      workSession: '🍅 FOCUS SESSION',
      shortBreak: '☕ SHORT BREAK',
      longBreak: '🌴 LONG BREAK',
      deepSprint: '⚡ DEEP WORK SPRINT',
      startBtn: 'START',
      pauseBtn: 'PAUSE',
      activeTaskLabel: 'Currently focusing on:',
      noTaskSelected: 'No active task selected',
      tasksTitle: 'Task Commander',
      soundTitle: 'Ambient Soundscapes',
      dailyGoalTitle: 'Daily Focus Goal',
      zenGardenTitle: 'Zen Focus Garden',
      addTaskPlaceholder: 'Add a new focus task...',
      exportBtn: 'Export Backup',
      settingsTitle: 'System Settings',
      analyticsTitle: 'Productivity Analytics'
    }
  },

  quotes: [
    "“Tập trung sâu là siêu năng lực của thế kỷ 21.” — Cal Newport",
    "“Bí quyết để tiến lên phía trước là bắt đầu ngay bây giờ.” — Mark Twain",
    "“Một phiên tập trung trọn vẹn giá trị hơn cả ngày làm việc phân tâm.”",
    "“Đơn giản hóa mọi thứ và chỉ tập trung vào một nhiệm vụ duy nhất.”",
    "“Hãy để âm thanh đưa bạn vào trạng thái dòng chảy vô tận (Flow State).”"
  ],

  init() {
    this.loadPreferences();
    this.bindEvents();
    this.setupAudioSliders();
    this.setupModals();
    this.rotateQuote();

    // Initialize subsystems
    if (window.ProdomoTasks) window.ProdomoTasks.render();
    if (window.ProdomoTimer) window.ProdomoTimer.init();
    if (window.ProdomoStats) window.ProdomoStats.render();
    if (window.ProdomoGarden) window.ProdomoGarden.init('gardenCanvas');
  },

  loadPreferences() {
    const savedTheme = localStorage.getItem('prodomo_theme') || 'cyber-crimson';
    this.setTheme(savedTheme);

    const savedLang = localStorage.getItem('prodomo_lang') || 'vi';
    this.setLanguage(savedLang);
  },

  setTheme(themeName) {
    this.currentTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('prodomo_theme', themeName);

    // Update active state in theme modal
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.theme === themeName);
    });
  },

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('prodomo_lang', lang);
    const langBtn = document.getElementById('btnLangToggle');
    if (langBtn) {
      langBtn.textContent = lang === 'vi' ? 'VI' : 'EN';
    }
  },

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'vi' ? 'en' : 'vi');
  },

  rotateQuote() {
    const quoteEl = document.getElementById('focusQuoteText');
    if (!quoteEl) return;
    const randomQuote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    quoteEl.textContent = randomQuote;
  },

  // Setup Ambient Audio Multi-track Sliders & Presets
  setupAudioSliders() {
    const tracks = ['rain', 'waves', 'fire', 'cafe', 'forest', 'gamma', 'alpha'];

    tracks.forEach(trackName => {
      const slider = document.getElementById(`vol_${trackName}`);
      const toggle = document.getElementById(`toggle_${trackName}`);
      const valLabel = document.getElementById(`val_${trackName}`);
      const trackItem = document.getElementById(`trackItem_${trackName}`);

      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (valLabel) valLabel.textContent = `${Math.round(val * 100)}%`;

          if (window.ProdomoAudio) {
            window.ProdomoAudio.setTrackVolume(trackName, val);
            if (val > 0 && !window.ProdomoAudio.activeTracks[trackName]) {
              this.startTrackByName(trackName, val);
            }
          }
          if (trackItem) {
            trackItem.classList.toggle('playing', val > 0);
          }
        });
      }

      if (toggle) {
        toggle.addEventListener('click', () => {
          const isPlaying = window.ProdomoAudio && window.ProdomoAudio.activeTracks[trackName];
          if (isPlaying) {
            window.ProdomoAudio.stopTrack(trackName);
            if (slider) slider.value = 0;
            if (valLabel) valLabel.textContent = '0%';
            if (trackItem) trackItem.classList.remove('playing');
          } else {
            const defaultVol = 0.5;
            if (slider) slider.value = defaultVol;
            if (valLabel) valLabel.textContent = `${defaultVol * 100}%`;
            this.startTrackByName(trackName, defaultVol);
            if (trackItem) trackItem.classList.add('playing');
          }
        });
      }
    });

    // Master Mute Button
    const masterMuteBtn = document.getElementById('btnMasterMute');
    if (masterMuteBtn) {
      masterMuteBtn.addEventListener('click', () => {
        if (window.ProdomoAudio) {
          const muted = window.ProdomoAudio.toggleMute();
          masterMuteBtn.textContent = muted ? '🔇 Đã tắt âm' : '🔊 Tắt tất cả';
          masterMuteBtn.classList.toggle('active', muted);
        }
      });
    }

    // Preset buttons
    document.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (window.ProdomoAudio) {
          window.ProdomoAudio.applyPreset(preset);
          this.syncAudioSlidersWithEngine();
        }
        document.querySelectorAll('.preset-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  },

  startTrackByName(name, volume) {
    if (!window.ProdomoAudio) return;
    if (name === 'rain') window.ProdomoAudio.startRain(volume);
    else if (name === 'waves') window.ProdomoAudio.startWaves(volume);
    else if (name === 'fire') window.ProdomoAudio.startFire(volume);
    else if (name === 'cafe') window.ProdomoAudio.startCafe(volume);
    else if (name === 'forest') window.ProdomoAudio.startForest(volume);
    else if (name === 'gamma') window.ProdomoAudio.startGamma(volume);
    else if (name === 'alpha') window.ProdomoAudio.startAlpha(volume);
  },

  syncAudioSlidersWithEngine() {
    const tracks = ['rain', 'waves', 'fire', 'cafe', 'forest', 'gamma', 'alpha'];
    tracks.forEach(trackName => {
      const active = window.ProdomoAudio && window.ProdomoAudio.activeTracks[trackName];
      const slider = document.getElementById(`vol_${trackName}`);
      const valLabel = document.getElementById(`val_${trackName}`);
      const trackItem = document.getElementById(`trackItem_${trackName}`);

      if (active && active.gain) {
        const val = active.gain.gain.value;
        if (slider) slider.value = val;
        if (valLabel) valLabel.textContent = `${Math.round(val * 100)}%`;
        if (trackItem) trackItem.classList.add('playing');
      } else {
        if (slider) slider.value = 0;
        if (valLabel) valLabel.textContent = '0%';
        if (trackItem) trackItem.classList.remove('playing');
      }
    });
  },

  // Modal Dialog Handlers
  setupModals() {
    const bindModal = (openBtnId, modalId) => {
      const openBtn = document.getElementById(openBtnId);
      const modal = document.getElementById(modalId);
      if (!openBtn || !modal) return;

      openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        if (modalId === 'analyticsModal' && window.ProdomoStats) {
          window.ProdomoStats.render();
        }
      });

      const closeBtn = modal.querySelector('.modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
      }

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    };

    bindModal('btnOpenAnalytics', 'analyticsModal');
    bindModal('btnOpenSettings', 'settingsModal');
    bindModal('btnOpenThemes', 'themeModal');

    // Theme Picker Clicks
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.dataset.theme;
        this.setTheme(theme);
      });
    });

    // Settings Save & Sound Test
    const saveSettingsBtn = document.getElementById('btnSaveSettings');
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        this.saveFormSettings();
        document.getElementById('settingsModal').classList.remove('active');
      });
    }

    const testSoundBtn = document.getElementById('btnTestAlarmSound');
    if (testSoundBtn) {
      testSoundBtn.addEventListener('click', () => {
        const soundSelect = document.getElementById('settingAlarmSound');
        if (window.ProdomoAudio && soundSelect) {
          window.ProdomoAudio.playAlarm(soundSelect.value);
        }
      });
    }
  },

  saveFormSettings() {
    if (!window.ProdomoTimer) return;

    const pomoMin = parseInt(document.getElementById('settingPomoDuration').value, 10) || 25;
    const shortMin = parseInt(document.getElementById('settingShortDuration').value, 10) || 5;
    const longMin = parseInt(document.getElementById('settingLongDuration').value, 10) || 15;
    const cycleInterval = parseInt(document.getElementById('settingLongInterval').value, 10) || 4;
    const alarmSound = document.getElementById('settingAlarmSound').value;
    const tickingSound = document.getElementById('settingTickingSound').value;
    const autoBreak = document.getElementById('settingAutoBreak').checked;
    const autoPomo = document.getElementById('settingAutoPomo').checked;

    window.ProdomoTimer.durations['pomodoro'] = pomoMin * 60;
    window.ProdomoTimer.durations['short-break'] = shortMin * 60;
    window.ProdomoTimer.durations['long-break'] = longMin * 60;

    window.ProdomoTimer.settings.alarmSound = alarmSound;
    window.ProdomoTimer.settings.tickingSound = tickingSound;
    window.ProdomoTimer.settings.autoStartBreaks = autoBreak;
    window.ProdomoTimer.settings.autoStartPomos = autoPomo;
    window.ProdomoTimer.settings.longBreakInterval = cycleInterval;

    window.ProdomoTimer.saveSettings();
    window.ProdomoTimer.setMode(window.ProdomoTimer.currentMode);
  },

  // Toggle Zen Fullscreen Mode
  toggleZenMode() {
    const zenOverlay = document.getElementById('zenOverlay');
    if (!zenOverlay) return;

    const isActive = zenOverlay.classList.toggle('active');
    if (isActive) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      const activeTask = window.ProdomoTasks ? window.ProdomoTasks.getActiveTask() : null;
      const zenTaskTitle = document.getElementById('zenTaskTitle');
      if (zenTaskTitle) {
        zenTaskTitle.textContent = activeTask ? activeTask.title : 'Phiên Tập Trung Chuyên Sâu';
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  },

  bindEvents() {
    // Mode Switchers
    document.querySelectorAll('.mode-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (window.ProdomoTimer) window.ProdomoTimer.setMode(mode);
      });
    });

    // Timer Controls
    const playBtn = document.getElementById('btnTimerPlay');
    const resetBtn = document.getElementById('btnTimerReset');
    const skipBtn = document.getElementById('btnTimerSkip');
    const plus5Btn = document.getElementById('btnPlus5Min');
    const plus1Btn = document.getElementById('btnPlus1Min');

    if (playBtn) playBtn.addEventListener('click', () => window.ProdomoTimer.toggle());
    if (resetBtn) resetBtn.addEventListener('click', () => window.ProdomoTimer.reset());
    if (skipBtn) skipBtn.addEventListener('click', () => window.ProdomoTimer.skip());
    if (plus5Btn) plus5Btn.addEventListener('click', () => window.ProdomoTimer.adjustTime(5));
    if (plus1Btn) plus1Btn.addEventListener('click', () => window.ProdomoTimer.adjustTime(1));

    // Zen Mode Buttons
    const zenBtn = document.getElementById('btnZenMode');
    const zenExitBtn = document.getElementById('zenExitBtn');
    if (zenBtn) zenBtn.addEventListener('click', () => this.toggleZenMode());
    if (zenExitBtn) zenExitBtn.addEventListener('click', () => this.toggleZenMode());

    // Language Toggle Button
    const langBtn = document.getElementById('btnLangToggle');
    if (langBtn) langBtn.addEventListener('click', () => this.toggleLanguage());

    // Task Filter Tags
    document.querySelectorAll('.task-filter-tags .tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.task-filter-tags .tag-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.ProdomoTasks) window.ProdomoTasks.setFilter(btn.dataset.filter);
      });
    });

    // Add Task Form Submission
    const addTaskBtn = document.getElementById('btnAddTask');
    const taskInput = document.getElementById('taskTitleInput');
    const taskCategory = document.getElementById('taskCategorySelect');
    const taskPriority = document.getElementById('taskPrioritySelect');
    const taskEstimate = document.getElementById('taskEstimateInput');

    const handleAddTask = () => {
      if (!taskInput || !taskInput.value.trim()) return;
      const title = taskInput.value.trim();
      const cat = taskCategory ? taskCategory.value : 'work';
      const prio = taskPriority ? taskPriority.value : 'medium';
      const est = taskEstimate ? parseInt(taskEstimate.value, 10) : 2;

      window.ProdomoTasks.addTask(title, cat, prio, est);
      taskInput.value = '';
    };

    if (addTaskBtn) addTaskBtn.addEventListener('click', handleAddTask);
    if (taskInput) {
      taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTask();
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore if focus is in an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        window.ProdomoTimer.toggle();
      } else if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        window.ProdomoTimer.skip();
      } else if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        window.ProdomoTimer.reset();
      } else if (e.altKey && e.code === 'KeyZ') {
        e.preventDefault();
        this.toggleZenMode();
      } else if (e.code === 'Escape') {
        const zenOverlay = document.getElementById('zenOverlay');
        if (zenOverlay && zenOverlay.classList.contains('active')) {
          this.toggleZenMode();
        }
      }
    });

    // Data Export
    const exportBtn = document.getElementById('btnExportData');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.ProdomoStats) window.ProdomoStats.exportData();
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProdomoApp.init();
});
