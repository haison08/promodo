/**
 * PRODOMO FOCUS STUDIO - TASK MANAGER ENGINE
 * Manages tasks, categories, priorities, subtasks, pomodoro estimations,
 * and synchronizes with the active timer session.
 */

class ProdomoTaskManager {
  constructor() {
    this.tasks = [];
    this.activeTaskId = null;
    this.currentFilter = 'all'; // 'all', 'active', 'completed', or category name
    this.searchQuery = '';
    this.storageKey = 'prodomo_tasks_v1';
    
    this.categories = {
      work: { name: 'Công việc', icon: '💼', color: '#3b82f6' },
      study: { name: 'Học tập', icon: '📚', color: '#10b981' },
      dev: { name: 'Lập trình', icon: '💻', color: '#8b5cf6' },
      creative: { name: 'Sáng tạo', icon: '🎨', color: '#f59e0b' },
      personal: { name: 'Đời sống', icon: '🧘', color: '#ec4899' }
    };

    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.tasks = JSON.parse(data);
      } else {
        // High quality default starter tasks
        this.tasks = [
          {
            id: 'task-1',
            title: 'Hoàn thiện kiến trúc hệ thống ProDomo',
            category: 'dev',
            priority: 'high',
            estimatedPomos: 4,
            completedPomos: 1,
            completed: false,
            createdAt: Date.now(),
            subtasks: [
              { id: 'sub-1', title: 'Thiết kế giao diện đếm giờ SVG', done: true },
              { id: 'sub-2', title: 'Tích hợp bộ âm thanh procedural Web Audio', done: false },
              { id: 'sub-3', title: 'Xây dựng biểu đồ thống kê năng suất', done: false }
            ]
          },
          {
            id: 'task-2',
            title: 'Nghiên cứu tài liệu Deep Work & Pomodoro Mastery',
            category: 'study',
            priority: 'medium',
            estimatedPomos: 2,
            completedPomos: 0,
            completed: false,
            createdAt: Date.now() - 3600000,
            subtasks: []
          },
          {
            id: 'task-3',
            title: 'Luyện tập hít thở và thư giãn 15 phút',
            category: 'personal',
            priority: 'low',
            estimatedPomos: 1,
            completedPomos: 1,
            completed: true,
            createdAt: Date.now() - 7200000,
            subtasks: []
          }
        ];
        this.saveToStorage();
      }

      // Check if an active task exists
      const savedActiveId = localStorage.getItem('prodomo_active_task_id');
      if (savedActiveId && this.tasks.some(t => t.id === savedActiveId && !t.completed)) {
        this.activeTaskId = savedActiveId;
      } else {
        const firstIncomplete = this.tasks.find(t => !t.completed);
        this.activeTaskId = firstIncomplete ? firstIncomplete.id : null;
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
      this.tasks = [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
      if (this.activeTaskId) {
        localStorage.setItem('prodomo_active_task_id', this.activeTaskId);
      } else {
        localStorage.removeItem('prodomo_active_task_id');
      }
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }

  notifyListeners() {
    window.dispatchEvent(new CustomEvent('prodomo:tasks_updated', {
      detail: { tasks: this.tasks, activeTask: this.getActiveTask() }
    }));
  }

  getActiveTask() {
    return this.tasks.find(t => t.id === this.activeTaskId) || null;
  }

  setActiveTask(id) {
    if (this.tasks.some(t => t.id === id)) {
      this.activeTaskId = id;
      this.saveToStorage();
      this.render();
    }
  }

  addTask(title, category = 'work', priority = 'medium', estimatedPomos = 2) {
    if (!title || !title.trim()) return null;

    const newTask = {
      id: 'task-' + Date.now(),
      title: title.trim(),
      category: category || 'work',
      priority: priority || 'medium',
      estimatedPomos: parseInt(estimatedPomos, 10) || 1,
      completedPomos: 0,
      completed: false,
      createdAt: Date.now(),
      subtasks: []
    };

    this.tasks.unshift(newTask);
    if (!this.activeTaskId) {
      this.activeTaskId = newTask.id;
    }
    this.saveToStorage();
    this.render();
    return newTask;
  }

  toggleTaskCompleted(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;

    if (task.completed && this.activeTaskId === id) {
      const nextPending = this.tasks.find(t => !t.completed && t.id !== id);
      this.activeTaskId = nextPending ? nextPending.id : null;
    }

    this.saveToStorage();
    this.render();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      const nextPending = this.tasks.find(t => !t.completed);
      this.activeTaskId = nextPending ? nextPending.id : null;
    }
    this.saveToStorage();
    this.render();
  }

  incrementPomoCount(id = null) {
    const targetId = id || this.activeTaskId;
    if (!targetId) return;

    const task = this.tasks.find(t => t.id === targetId);
    if (task) {
      task.completedPomos = (task.completedPomos || 0) + 1;
      this.saveToStorage();
      this.render();
    }
  }

  addSubtask(taskId, subtaskTitle) {
    if (!subtaskTitle || !subtaskTitle.trim()) return;
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: 'sub-' + Date.now(),
      title: subtaskTitle.trim(),
      done: false
    });

    this.saveToStorage();
    this.render();
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (sub) {
      sub.done = !sub.done;
      this.saveToStorage();
      this.render();
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    this.render();
  }

  getFilteredTasks() {
    return this.tasks.filter(task => {
      // Search text match
      if (this.searchQuery && !task.title.toLowerCase().includes(this.searchQuery.toLowerCase())) {
        return false;
      }

      // Filter category or status
      if (this.currentFilter === 'all') return true;
      if (this.currentFilter === 'active') return !task.completed;
      if (this.currentFilter === 'completed') return task.completed;
      if (this.currentFilter === 'high') return task.priority === 'high';

      // Category match
      return task.category === this.currentFilter;
    });
  }

  render() {
    const container = document.getElementById('tasksList');
    const badgeCount = document.getElementById('tasksBadgeCount');
    const activeTaskBanner = document.getElementById('activeTaskDisplay');
    const activeTaskNameEl = document.getElementById('activeTaskName');

    if (!container) return;

    const filtered = this.getFilteredTasks();
    const activeTask = this.getActiveTask();

    // Update count in header
    if (badgeCount) {
      const pendingCount = this.tasks.filter(t => !t.completed).length;
      badgeCount.textContent = `${pendingCount} việc`;
    }

    // Update center active task banner
    if (activeTaskNameEl) {
      if (activeTask) {
        activeTaskNameEl.textContent = activeTask.title;
        if (activeTaskBanner) activeTaskBanner.style.display = 'inline-flex';
      } else {
        activeTaskNameEl.textContent = 'Chưa chọn nhiệm vụ nào';
      }
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">📝</div>
          <p>Không tìm thấy nhiệm vụ nào.</p>
          <span style="font-size:0.75rem; color:var(--text-dim)">Thêm nhiệm vụ mới để bắt đầu phiên tập trung!</span>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(task => {
      const isSelected = task.id === this.activeTaskId;
      const cat = this.categories[task.category] || { name: task.category, icon: '📌', color: '#94a3b8' };
      const priorityClass = `priority-${task.priority || 'medium'}`;
      const priorityLabel = task.priority === 'high' ? 'Cao' : task.priority === 'low' ? 'Thấp' : 'Vừa';
      
      const subtaskCount = task.subtasks ? task.subtasks.length : 0;
      const subtasksDone = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;

      return `
        <div class="task-card ${task.completed ? 'completed' : ''} ${isSelected ? 'active-focus' : ''}" data-task-id="${task.id}">
          <div class="task-main-row">
            <div class="task-checkbox" onclick="window.ProdomoTasks.toggleTaskCompleted('${task.id}')" title="Đánh dấu hoàn thành">
              ${task.completed ? '✓' : ''}
            </div>
            <div class="task-title-text" onclick="window.ProdomoTasks.setActiveTask('${task.id}')" title="Chọn làm tiêu điểm tập trung">
              ${this.escapeHtml(task.title)}
            </div>
            <div class="task-actions">
              <button class="task-btn-action" onclick="window.ProdomoTasks.promptAddSubtask('${task.id}')" title="Thêm việc phụ">
                ＋
              </button>
              <button class="task-btn-action delete" onclick="window.ProdomoTasks.deleteTask('${task.id}')" title="Xóa nhiệm vụ">
                ✕
              </button>
            </div>
          </div>

          <div class="task-meta-row">
            <div class="task-tags-group">
              <span class="tag-badge" style="background:${cat.color}22; color:${cat.color}; border: 1px solid ${cat.color}44;">
                ${cat.icon} ${cat.name}
              </span>
              <span class="priority-badge ${priorityClass}">
                ${priorityLabel}
              </span>
              ${subtaskCount > 0 ? `
                <span style="color:var(--text-dim); font-size:0.7rem;">
                  ✓ ${subtasksDone}/${subtaskCount}
                </span>
              ` : ''}
            </div>
            
            <div class="pomo-count-tracker" title="Số phiên cà chua: Đã xong / Dự kiến">
              <span class="icon">🍅</span>
              <span>${task.completedPomos || 0} / ${task.estimatedPomos || 1}</span>
            </div>
          </div>

          ${task.subtasks && task.subtasks.length > 0 ? `
            <div class="task-subtasks-wrapper">
              ${task.subtasks.map(sub => `
                <div class="subtask-item ${sub.done ? 'done' : ''}" onclick="window.ProdomoTasks.toggleSubtask('${task.id}', '${sub.id}')">
                  <span style="font-size:0.75rem; cursor:pointer;">${sub.done ? '☑' : '☐'}</span>
                  <span>${this.escapeHtml(sub.title)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  promptAddSubtask(taskId) {
    const title = prompt('Nhập tên việc phụ (sub-task):');
    if (title) {
      this.addSubtask(taskId, title);
    }
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.ProdomoTasks = new ProdomoTaskManager();
