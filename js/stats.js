/**
 * PRODOMO FOCUS STUDIO - ANALYTICS & STATS ENGINE
 * Tracks focus time, streaks, categories, sessions history,
 * and generates interactive heatmaps and metrics.
 */

class ProdomoStatsEngine {
  constructor() {
    this.storageKey = 'prodomo_sessions_v1';
    this.streakKey = 'prodomo_streak_v1';
    this.dailyGoalMinutes = 180; // 3 hours default daily focus goal
    this.sessions = [];
    this.streak = { current: 1, best: 3, lastDate: null };

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.sessions = JSON.parse(data);
      } else {
        // Pre-populate with realistic mock historical sessions for the past few days
        const now = Date.now();
        const dayMs = 86400000;
        this.sessions = [
          // Today
          { id: 's-1', timestamp: now - 3600000 * 2, duration: 25, mode: 'pomodoro', category: 'dev', taskTitle: 'Hoàn thiện kiến trúc hệ thống ProDomo' },
          { id: 's-2', timestamp: now - 3600000 * 1, duration: 25, mode: 'pomodoro', category: 'dev', taskTitle: 'Hoàn thiện kiến trúc hệ thống ProDomo' },
          { id: 's-3', timestamp: now - 3600000 * 0.5, duration: 25, mode: 'pomodoro', category: 'study', taskTitle: 'Nghiên cứu tài liệu Deep Work' },
          // Yesterday
          { id: 's-4', timestamp: now - dayMs - 3600000 * 4, duration: 25, mode: 'pomodoro', category: 'dev', taskTitle: 'Refactor audio components' },
          { id: 's-5', timestamp: now - dayMs - 3600000 * 3, duration: 25, mode: 'pomodoro', category: 'dev', taskTitle: 'Refactor audio components' },
          { id: 's-6', timestamp: now - dayMs - 3600000 * 2, duration: 50, mode: 'deep-work', category: 'work', taskTitle: 'Sprint planning' },
          { id: 's-7', timestamp: now - dayMs - 3600000 * 1, duration: 25, mode: 'pomodoro', category: 'study', taskTitle: 'Thuật toán tối ưu' },
          // 2 days ago
          { id: 's-8', timestamp: now - dayMs * 2 - 3600000 * 5, duration: 25, mode: 'pomodoro', category: 'dev', taskTitle: 'UI Mockups' },
          { id: 's-9', timestamp: now - dayMs * 2 - 3600000 * 4, duration: 25, mode: 'pomodoro', category: 'personal', taskTitle: 'Luyện tập hít thở' },
          { id: 's-10', timestamp: now - dayMs * 2 - 3600000 * 2, duration: 25, mode: 'pomodoro', category: 'creative', taskTitle: 'Thiết kế biểu tượng 3D' },
          // 3 days ago
          { id: 's-11', timestamp: now - dayMs * 3 - 3600000 * 3, duration: 50, mode: 'deep-work', category: 'dev', taskTitle: 'Database Schema' },
          { id: 's-12', timestamp: now - dayMs * 3 - 3600000 * 2, duration: 25, mode: 'pomodoro', category: 'study', taskTitle: 'Đọc sách Deep Work' }
        ];
        this.saveToStorage();
      }

      const streakData = localStorage.getItem(this.streakKey);
      if (streakData) {
        this.streak = JSON.parse(streakData);
      }
    } catch (e) {
      console.error('Failed to load stats', e);
      this.sessions = [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
      localStorage.setItem(this.streakKey, JSON.stringify(this.streak));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save stats', e);
    }
  }

  notifyListeners() {
    window.dispatchEvent(new CustomEvent('prodomo:stats_updated', {
      detail: { stats: this.getTodayStats() }
    }));
  }

  recordSession(durationMinutes, mode = 'pomodoro', task = null) {
    const session = {
      id: 'sess-' + Date.now(),
      timestamp: Date.now(),
      duration: durationMinutes,
      mode: mode,
      category: task ? task.category : 'work',
      taskId: task ? task.id : null,
      taskTitle: task ? task.title : 'Phiên tập trung tự do'
    };

    this.sessions.unshift(session);
    this.updateStreak();
    this.saveToStorage();
    this.render();
  }

  updateStreak() {
    const todayStr = new Date().toDateString();
    if (this.streak.lastDate === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (this.streak.lastDate === yesterdayStr) {
      this.streak.current += 1;
    } else if (this.streak.lastDate !== todayStr) {
      this.streak.current = 1;
    }

    if (this.streak.current > this.streak.best) {
      this.streak.best = this.streak.current;
    }

    this.streak.lastDate = todayStr;
  }

  getTodayStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTime = todayStart.getTime();

    const todaySessions = this.sessions.filter(s => s.timestamp >= startTime && (s.mode === 'pomodoro' || s.mode === 'deep-work'));
    const totalMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const totalPomodoros = todaySessions.length;

    return {
      minutes: totalMinutes,
      sessionsCount: totalPomodoros,
      goalPercentage: Math.min(100, Math.round((totalMinutes / this.dailyGoalMinutes) * 100)),
      hoursFormatted: (totalMinutes / 60).toFixed(1)
    };
  }

  // 30-Day Heatmap Data
  get30DayHeatmapData() {
    const days = [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = this.sessions.filter(s => 
        s.timestamp >= dayStart.getTime() && 
        s.timestamp <= dayEnd.getTime() && 
        (s.mode === 'pomodoro' || s.mode === 'deep-work')
      );

      const mins = daySessions.reduce((sum, s) => sum + s.duration, 0);
      let level = 0;
      if (mins >= 150) level = 4;
      else if (mins >= 100) level = 3;
      else if (mins >= 50) level = 2;
      else if (mins > 0) level = 1;

      days.push({
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        minutes: mins,
        level: level
      });
    }

    return days;
  }

  // Category Distribution
  getCategoryBreakdown() {
    const catMinutes = {};
    const focusSessions = this.sessions.filter(s => s.mode === 'pomodoro' || s.mode === 'deep-work');
    const total = focusSessions.reduce((sum, s) => sum + s.duration, 0) || 1;

    focusSessions.forEach(s => {
      const cat = s.category || 'work';
      catMinutes[cat] = (catMinutes[cat] || 0) + s.duration;
    });

    const result = [];
    for (const [cat, mins] of Object.entries(catMinutes)) {
      result.push({
        category: cat,
        minutes: mins,
        percentage: Math.round((mins / total) * 100)
      });
    }
    return result;
  }

  render() {
    const today = this.getTodayStats();

    // Top navbar stats
    const streakEl = document.getElementById('navStreakCount');
    const todayPomoEl = document.getElementById('navTodayPomos');
    const todayTimeEl = document.getElementById('navTodayTime');

    if (streakEl) streakEl.textContent = `${this.streak.current} ngày`;
    if (todayPomoEl) todayPomoEl.textContent = `${today.sessionsCount} phiên`;
    if (todayTimeEl) todayTimeEl.textContent = `${today.hoursFormatted} giờ`;

    // Right Column Mini Daily Goal
    const goalPctEl = document.getElementById('goalPercentage');
    const goalMinsEl = document.getElementById('goalMinutesDone');
    if (goalPctEl) goalPctEl.textContent = `${today.goalPercentage}%`;
    if (goalMinsEl) goalMinsEl.textContent = `${today.minutes} / ${this.dailyGoalMinutes} phút`;

    // Render Heatmap in Modal
    const heatmapGrid = document.getElementById('analyticsHeatmapGrid');
    if (heatmapGrid) {
      const days = this.get30DayHeatmapData();
      heatmapGrid.innerHTML = days.map(d => `
        <div class="heatmap-cell" data-level="${d.level}" title="${d.dateStr}: ${d.minutes} phút tập trung"></div>
      `).join('');
    }

    // Render Category Distribution in Modal
    const catListEl = document.getElementById('analyticsCategoryList');
    if (catListEl) {
      const cats = this.getCategoryBreakdown();
      const catMap = (window.ProdomoTasks && window.ProdomoTasks.categories) || {};
      
      catListEl.innerHTML = cats.map(c => {
        const meta = catMap[c.category] || { name: c.category, icon: '📌', color: '#888' };
        return `
          <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
              <span>${meta.icon} ${meta.name}</span>
              <span style="font-family:var(--font-mono); font-weight:700;">${c.minutes} phút (${c.percentage}%)</span>
            </div>
            <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
              <div style="width:${c.percentage}%; height:100%; background:${meta.color}; border-radius:3px;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  exportData() {
    const data = {
      sessions: this.sessions,
      streak: this.streak,
      tasks: (window.ProdomoTasks && window.ProdomoTasks.tasks) || [],
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prodomo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

window.ProdomoStats = new ProdomoStatsEngine();
