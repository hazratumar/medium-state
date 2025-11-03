class BarChart {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.options = {
      padding: 40,
      barColor: '#667eea',
      gridColor: '#f3f4f6',
      textColor: '#6b7280',
      backgroundColor: '#ffffff',
      ...options
    };
  }

  render(data) {
    if (!this.canvas || !data.length) return;
    
    const { width, height } = this.canvas;
    const { padding } = this.options;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    this.clear();
    this.drawBackground();
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
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

      const gradient = this.ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, this.options.barColor);
      gradient.addColorStop(1, this.options.barColor + '80');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x + 4, y, barWidth - 8, barHeight);

      if (barHeight > 20) {
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = 'bold 10px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.value.toFixed(2), x + barWidth / 2, y - 8);
      }
    });
  }

  drawLabels(data, barWidth, padding, height) {
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.font = '10px Inter';
    this.ctx.textAlign = 'center';
    
    data.forEach((item, i) => {
      const x = padding + i * barWidth;
      this.ctx.fillText(item.label, x + barWidth / 2, height - 8);
    });
  }
}