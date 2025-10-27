class AnalyticsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
  }

  render() {
    return `
      <div class="chart-container">
        <h3>Daily Earnings Trend</h3>
        <canvas id="chart" width="460" height="180"></canvas>
      </div>
      <div id="analytics-summary" class="analytics-summary"></div>
    `;
  }

  init() {
    this.extension.loadChartData();
  }
}