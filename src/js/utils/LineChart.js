class LineChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.options = {
      padding: 60,
      gridColor: "#f1f5f9",
      textColor: "#64748b",
      backgroundColor: "#ffffff",
      primaryGradient: ["#14b8a6", "#8b5cf6"],
      averageLineColor: "#f59e0b",
      markerColors: { high: "#10b981", low: "#ef4444" },
      ...options,
    };
    this.data = [];
    this.tooltip = null;
    this.initTooltip();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas.parentElement);
  }

  render(data) {
    if (!this.canvas || !data.length) return;
    this.data = data;
    this.updateCanvasSize();
    this.clear();
    this.drawChart();
  }

  updateCanvasSize() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = Math.min(400, rect.width * 0.4) * dpr;
    this.canvas.style.width = rect.width + "px";
    this.canvas.style.height = Math.min(400, rect.width * 0.4) + "px";
    
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = Math.min(400, rect.width * 0.4);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
  }

  drawChart() {
    const { padding } = this.options;
    const chartWidth = this.displayWidth - padding * 2;
    const chartHeight = this.displayHeight - padding * 2;
    
    const maxValue = Math.max(...this.data.map(d => d.value), 1);
    const minValue = Math.min(...this.data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    this.drawGrid(chartWidth, chartHeight, padding, maxValue, minValue);
    this.drawAreaFill(chartWidth, chartHeight, padding, range, minValue);
    this.drawAverageLine(chartWidth, chartHeight, padding, range, minValue);
    this.drawMainLine(chartWidth, chartHeight, padding, range, minValue);
    this.drawMarkers(chartWidth, chartHeight, padding, range, minValue, maxValue);
    this.drawLabels(chartWidth, padding);
    this.drawSummary(maxValue, minValue);
  }

  drawGrid(chartWidth, chartHeight, padding, maxValue, minValue) {
    this.ctx.strokeStyle = this.options.gridColor;
    this.ctx.lineWidth = 1;
    this.ctx.font = "12px Inter, sans-serif";
    this.ctx.fillStyle = this.options.textColor;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      const value = maxValue - (maxValue - minValue) * (i / 5);
      
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(padding + chartWidth, y);
      this.ctx.stroke();
      
      this.ctx.textAlign = "right";
      this.ctx.fillText(`$${value.toFixed(2)}`, padding - 10, y + 4);
    }
  }

  drawAreaFill(chartWidth, chartHeight, padding, range, minValue) {
    if (this.data.length < 2) return;

    const points = this.calculateSmoothPoints(chartWidth, chartHeight, padding, range, minValue);
    
    // Create gradient
    const gradient = this.ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, this.options.primaryGradient[0] + "40");
    gradient.addColorStop(1, this.options.primaryGradient[1] + "10");
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, padding + chartHeight);
    
    points.forEach(point => this.ctx.lineTo(point.x, point.y));
    
    this.ctx.lineTo(points[points.length - 1].x, padding + chartHeight);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawMainLine(chartWidth, chartHeight, padding, range, minValue) {
    if (this.data.length < 2) return;

    const points = this.calculateSmoothPoints(chartWidth, chartHeight, padding, range, minValue);
    
    // Create line gradient
    const gradient = this.ctx.createLinearGradient(0, 0, chartWidth, 0);
    gradient.addColorStop(0, this.options.primaryGradient[0]);
    gradient.addColorStop(1, this.options.primaryGradient[1]);
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 3;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 3;
      const cp2y = points[i].y;
      
      this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
    }
    
    this.ctx.stroke();
  }

  drawAverageLine(chartWidth, chartHeight, padding, range, minValue) {
    const average = this.calculate7DayAverage();
    if (average.length < 2) return;

    const points = average.map((value, i) => ({
      x: padding + (i / (average.length - 1)) * chartWidth,
      y: padding + chartHeight - ((value - minValue) / range) * chartHeight
    }));

    this.ctx.strokeStyle = this.options.averageLineColor;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => this.ctx.lineTo(point.x, point.y));
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawMarkers(chartWidth, chartHeight, padding, range, minValue, maxValue) {
    const points = this.calculateSmoothPoints(chartWidth, chartHeight, padding, range, minValue);
    
    // Find highest and lowest points
    const highIndex = this.data.findIndex(d => d.value === maxValue);
    const lowIndex = this.data.findIndex(d => d.value === minValue);
    
    // Draw all points
    points.forEach((point, i) => {
      this.ctx.fillStyle = "#ffffff";
      this.ctx.strokeStyle = i === highIndex ? this.options.markerColors.high : 
                           i === lowIndex ? this.options.markerColors.low : 
                           this.options.primaryGradient[0];
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, i === highIndex || i === lowIndex ? 6 : 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    });
  }

  drawLabels(chartWidth, padding) {
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.font = "11px Inter, sans-serif";
    this.ctx.textAlign = "center";

    const step = Math.max(1, Math.floor(this.data.length / 8));
    
    this.data.forEach((item, i) => {
      if (i % step === 0 || i === this.data.length - 1) {
        const x = padding + (i / (this.data.length - 1)) * chartWidth;
        this.ctx.fillText(item.label, x, this.displayHeight - 10);
      }
    });
  }

  drawSummary(maxValue, minValue) {
    const total = this.data.reduce((sum, d) => sum + d.value, 0);
    const average = total / this.data.length;
    
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.font = "bold 14px Inter, sans-serif";
    this.ctx.textAlign = "left";
    
    const summaryY = 25;
    this.ctx.fillText(`Total: $${total.toFixed(2)}`, 20, summaryY);
    this.ctx.fillText(`Avg: $${average.toFixed(2)}`, 150, summaryY);
    this.ctx.fillText(`High: $${maxValue.toFixed(2)}`, 250, summaryY);
    this.ctx.fillText(`Low: $${minValue.toFixed(2)}`, 350, summaryY);
  }

  calculateSmoothPoints(chartWidth, chartHeight, padding, range, minValue) {
    return this.data.map((item, i) => ({
      x: padding + (i / (this.data.length - 1)) * chartWidth,
      y: padding + chartHeight - ((item.value - minValue) / range) * chartHeight,
      data: item
    }));
  }

  calculate7DayAverage() {
    if (this.data.length < 7) return [];
    
    const averages = [];
    for (let i = 6; i < this.data.length; i++) {
      const sum = this.data.slice(i - 6, i + 1).reduce((acc, d) => acc + d.value, 0);
      averages.push(sum / 7);
    }
    return averages;
  }

  initTooltip() {
    this.tooltip = document.createElement("div");
    this.tooltip.style.cssText = `
      position: absolute;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(this.tooltip);
  }

  bindEvents() {
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    this.canvas.addEventListener("mouseleave", () => this.hideTooltip());
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const { padding } = this.options;
    const chartWidth = this.displayWidth - padding * 2;
    
    if (x >= padding && x <= padding + chartWidth && y >= padding) {
      const dataIndex = Math.round(((x - padding) / chartWidth) * (this.data.length - 1));
      
      if (dataIndex >= 0 && dataIndex < this.data.length) {
        this.showTooltip(e.clientX, e.clientY, this.data[dataIndex]);
      }
    } else {
      this.hideTooltip();
    }
  }

  showTooltip(x, y, data) {
    this.tooltip.innerHTML = `
      <div><strong>${data.label}</strong></div>
      <div>Earnings: $${data.value.toFixed(2)}</div>
      ${data.posts ? `<div>Posts: ${data.posts.length}</div>` : ''}
    `;
    
    this.tooltip.style.display = "block";
    this.tooltip.style.left = (x + 10) + "px";
    this.tooltip.style.top = (y - 10) + "px";
  }

  hideTooltip() {
    this.tooltip.style.display = "none";
  }

  handleResize() {
    if (this.data.length > 0) {
      this.render(this.data);
    }
  }

  destroy() {
    this.resizeObserver.disconnect();
    if (this.tooltip) {
      document.body.removeChild(this.tooltip);
    }
  }
}