class BarChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.options = {
      padding: 40,
      barColor: "#667eea",
      gridColor: "#f3f4f6",
      textColor: "#6b7280",
      backgroundColor: "#ffffff",
      ...options,
    };
    this.data = [];
    this.barRects = [];
    this.modal = null;
    this.initModal();
    this.bindEvents();
  }

  render(data) {
    if (!this.canvas || !data.length) return;

    this.data = data;
    this.barRects = [];

    const { width, height } = this.canvas;
    const { padding } = this.options;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    this.clear();
    this.drawBackground();

    const maxValue = Math.max(...data.map((d) => d.value), 1);
    const barWidth = chartWidth / data.length;

    this.drawGrid(chartHeight, padding);
    this.drawBars(data, barWidth, chartHeight, maxValue, padding);
    this.drawLabels(data, barWidth, padding, height);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground() {
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(chartHeight, padding) {
    this.ctx.strokeStyle = this.options.gridColor;
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(this.canvas.width - padding, y);
      this.ctx.stroke();
    }
  }

  drawBars(data, barWidth, chartHeight, maxValue, padding) {
    data.forEach((item, i) => {
      const barHeight = Math.max((item.value / maxValue) * chartHeight, 2);
      const x = padding + i * barWidth;
      const y = this.canvas.height - padding - barHeight;

      // Store bar rectangle for tooltip detection
      this.barRects.push({
        x: x + 4,
        y: y,
        width: barWidth - 8,
        height: barHeight,
        data: item,
      });

      const gradient = this.ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, this.options.barColor);
      gradient.addColorStop(1, this.options.barColor + "80");

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x + 4, y, barWidth - 8, barHeight);

      if (barHeight > 20) {
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = "bold 10px Inter";
        this.ctx.textAlign = "center";
        this.ctx.fillText(item.value.toFixed(2), x + barWidth / 2, y - 8);
      }
    });
  }

  drawLabels(data, barWidth, padding, height) {
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.font = "10px Inter";
    this.ctx.textAlign = "center";

    const showEveryNth = data.length > 15 ? Math.ceil(data.length / 10) : 1;

    data.forEach((item, i) => {
      if (i % showEveryNth === 0 || i === data.length - 1) {
        const x = padding + i * barWidth;
        this.ctx.fillText(item.label, x + barWidth / 2, height - 8);
      }
    });
  }

  initModal() {
    this.modal = document.createElement("div");
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
    `;
    
    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;
    
    this.modal.appendChild(modalContent);
    document.body.appendChild(this.modal);
  }

  bindEvents() {
    this.canvas.addEventListener("click", (e) => this.handleClick(e));
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.hideModal();
    });
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedBar = this.barRects.find((bar) => x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height);

    if (clickedBar) {
      this.showModal(clickedBar.data);
    }
  }

  showModal(data) {
    let content = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">${data.label} - Posts & Earnings</h3>
        <button id="closeModal" style="background: #f44336; color: white; border: none; border-radius: 4px; padding: 8px; cursor: pointer; width: 50px; height: 32px; display: flex; align-items: center; justify-content: center;">Close</button>
      </div>
      <div style="margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
        <strong>Total Earnings: $${data.value.toFixed(2)}</strong>
      </div>`;

    if (data.posts && data.posts.length > 0) {
      content += `<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="text-align: left; padding: 12px 8px; color: #495057;">S.No</th>
            <th style="text-align: left; padding: 12px 8px; color: #495057;">Post Title</th>
            <th style="text-align: right; padding: 12px 8px; color: #495057;">Earnings</th>
          </tr>
        </thead>
        <tbody>`;

      data.posts.forEach((post, index) => {
        const earnings = post.earnings || 0;
        const bgColor = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
        content += `<tr style="background: ${bgColor};">
          <td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6;">${index + 1}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #dee2e6;">${post.title}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #dee2e6; font-weight: 600;">$${earnings.toFixed(2)}</td>
        </tr>`;
      });

      content += "</tbody></table>";
    } else {
      content += "<p style='text-align: center; color: #666; margin: 20px 0;'>No posts found for this day.</p>";
    }

    this.modal.firstChild.innerHTML = content;
    this.modal.style.display = "flex";
    
    // Bind close button event
    const closeBtn = this.modal.querySelector('#closeModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideModal());
    }
  }

  hideModal() {
    this.modal.style.display = "none";
  }
}
