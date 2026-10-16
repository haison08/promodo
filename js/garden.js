/**
 * PRODOMO FOCUS STUDIO - ZEN FOCUS GARDEN ENGINE
 * Renders an animated virtual plant on Canvas that grows
 * as users complete pomodoro sessions.
 */

class ProdomoZenGarden {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.stage = 1; // 1 to 5
    this.animationId = null;
    this.time = 0;
    this.particles = [];
  }

  init(canvasId = 'gardenCanvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.updateGrowthStage();
    this.startAnimation();

    window.addEventListener('prodomo:stats_updated', () => {
      this.updateGrowthStage();
    });
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  updateGrowthStage() {
    const today = window.ProdomoStats ? window.ProdomoStats.getTodayStats() : { sessionsCount: 0 };
    const count = today.sessionsCount;

    if (count >= 10) this.stage = 5;
    else if (count >= 6) this.stage = 4;
    else if (count >= 3) this.stage = 3;
    else if (count >= 1) this.stage = 2;
    else this.stage = 1;

    const levelPill = document.getElementById('gardenLevelBadge');
    const statusText = document.getElementById('gardenStatusText');

    const stageNames = [
      '',
      'Hạt Mầm Pha Lê',
      'Chồi Non Tươi Tốt',
      'Nhánh Cây Sinh Trưởng',
      'Hoa Bonsai Tỏa Sáng',
      'Đại Thụ Giác Ngộ'
    ];

    if (levelPill) levelPill.textContent = `Cấp ${this.stage} • ${stageNames[this.stage]}`;
    if (statusText) {
      if (this.stage === 5) {
        statusText.textContent = '🌟 Tuyệt đỉnh! Bạn đã hoàn thành đại thụ giác ngộ hôm nay.';
      } else {
        const nextTarget = [0, 1, 3, 6, 10][this.stage];
        const remaining = Math.max(0, nextTarget - count);
        statusText.textContent = `Cần thêm ${remaining} phiên Pomodoro để cây lớn lên giai đoạn tiếp theo.`;
      }
    }
  }

  spawnCelebrationParticles() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: w / 2,
        y: h * 0.7,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6 - 2,
        size: Math.random() * 4 + 2,
        color: ['#ff3366', '#00e5ff', '#10b981', '#fbbf24', '#fff'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 1
      });
    }
  }

  startAnimation() {
    const render = () => {
      this.time += 0.03;
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const baseY = h * 0.88;

    // Base glowing soil orb / pediment
    const gradient = ctx.createRadialGradient(centerX, baseY, 5, centerX, baseY, 60);
    gradient.addColorStop(0, 'rgba(255, 51, 102, 0.35)');
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, baseY, 55, 0, Math.PI * 2);
    ctx.fill();

    // Subtle mound
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.ellipse(centerX, baseY, 45, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const sway = Math.sin(this.time) * (0.03 * this.stage);

    // Draw Plant based on stage
    if (this.stage === 1) {
      // Glowing Seed
      const pulse = Math.sin(this.time * 2) * 2;
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(centerX, baseY - 8 + pulse, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.stage === 2) {
      // Small Sprout
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, baseY);
      ctx.quadraticCurveTo(centerX + sway * 15, baseY - 20, centerX + sway * 30, baseY - 35);
      ctx.stroke();

      // Two cute leaves
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.ellipse(centerX + sway * 30 - 8, baseY - 35, 8, 4, -0.4, 0, Math.PI * 2);
      ctx.ellipse(centerX + sway * 30 + 8, baseY - 35, 8, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.stage === 3) {
      // Growing Bush / Stem
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, baseY);
      ctx.quadraticCurveTo(centerX + sway * 25, baseY - 30, centerX + sway * 40, baseY - 55);
      ctx.stroke();

      // Branches
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX + sway * 20, baseY - 25);
      ctx.lineTo(centerX - 16, baseY - 40);
      ctx.moveTo(centerX + sway * 30, baseY - 40);
      ctx.lineTo(centerX + 18, baseY - 50);
      ctx.stroke();

      // Leaves
      ctx.fillStyle = '#10b981';
      [
        { x: centerX + sway * 40, y: baseY - 55, r: 9 },
        { x: centerX - 16, y: baseY - 40, r: 7 },
        { x: centerX + 18, y: baseY - 50, r: 7 }
      ].forEach(leaf => {
        ctx.beginPath();
        ctx.arc(leaf.x, leaf.y, leaf.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (this.stage >= 4) {
      // Magnificent Bonsai / Flower Tree
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      // Trunk
      ctx.beginPath();
      ctx.moveTo(centerX, baseY);
      ctx.bezierCurveTo(centerX - 10, baseY - 25, centerX + 15 + sway * 20, baseY - 45, centerX + sway * 30, baseY - 65);
      ctx.stroke();

      // Branches
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX + sway * 15, baseY - 35);
      ctx.lineTo(centerX - 24, baseY - 52);
      ctx.moveTo(centerX + sway * 25, baseY - 50);
      ctx.lineTo(centerX + 26, baseY - 62);
      ctx.stroke();

      // Blossom Foliage Clouds
      const leafColor = this.stage === 5 ? '#fbbf24' : '#ff3366';
      const leafGlow = this.stage === 5 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(255, 51, 102, 0.5)';

      ctx.fillStyle = leafColor;
      ctx.shadowColor = leafGlow;
      ctx.shadowBlur = 15;

      const clusters = [
        { x: centerX + sway * 30, y: baseY - 70, r: 16 },
        { x: centerX - 24, y: baseY - 55, r: 12 },
        { x: centerX + 26, y: baseY - 65, r: 13 },
        { x: centerX + 6, y: baseY - 82, r: 14 }
      ];

      clusters.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    // Render active particles (falling leaves/sparks)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.alpha -= 0.015;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

window.ProdomoGarden = new ProdomoZenGarden();
