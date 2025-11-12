class AnalyticsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
    this.chart = null;
    this.isLoading = false;
  }

  render() {
    return `
      <div class="analytics-container">
        <div class="analytics-header">
          <h3>Analytics Dashboard</h3>
          <div class="analytics-controls">
            <select id="timePeriod" class="time-period-select">
              <option value="thisMonth">This Month</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <div id="customDateRange" style="display: none; margin-left: 10px;">
              <input type="date" id="startDate" style="margin-right: 5px;">
              <input type="date" id="endDate">
            </div>
            <button id="refreshAnalytics" class="refresh-btn">Refresh</button>
          </div>
        </div>
        <div class="chart-section">
          <div class="chart-header">
            <h4 id="chartTitle">Daily Earnings</h4>
            <div id="analyticsStatus" class="status"></div>
          </div>
          <div class="chart-container">
            <canvas id="earningsChart" width="900" height="180"></canvas>
            <div id="chartLoader" class="chart-loader" style="display: none;">Loading...</div>
          </div>
        </div>
        ${this.renderStatCards()}
      </div>
    `;
  }

  renderStatCards() {
    const cards = [
      { id: 'totalEarnings', label: 'Total Earnings', value: '$0.00', tooltip: 'Sum of all earnings in the selected period' },
      { id: 'expectedEarnings', label: 'Expected Earnings', value: '$0.00', tooltip: 'Projected monthly earnings based on current daily average' },
      { id: 'avgDaily', label: 'Avg Daily', value: '$0.00', tooltip: 'Average earnings per day in the period' },
      { id: 'bestPost', label: 'Best Post', value: 'None', tooltip: 'Highest earning post in the period' },
      { id: 'totalPosts', label: 'Total Posts', value: '0', tooltip: 'Number of posts that generated earnings' },
      { id: 'avgPerPost', label: 'Avg Per Post', value: '$0.00', tooltip: 'Average earnings per post (total ÷ posts)' },
      { id: 'activeDays', label: 'Active Days', value: '0', tooltip: 'Days with earnings vs total days in period' },
      { id: 'zeroDays', label: 'Zero Days', value: '0', tooltip: 'Number of days with no earnings' },
      { id: 'efficiency', label: 'Efficiency', value: '$0.00', tooltip: 'Average earnings per active day' },
      { id: 'highestDay', label: 'Highest Day', value: '$0.00', tooltip: 'Best single day earnings in the period' },
      { id: 'lowestDay', label: 'Lowest Day', value: '$0.00', tooltip: 'Lowest single day earnings in the period' },
      { id: 'earningStreak', label: 'Streak', value: '0 days', tooltip: 'Current consecutive days with earnings' },
      { id: 'percentChange', label: 'vs Previous', value: '+0%', tooltip: 'Percentage change compared to previous period' },
      { id: 'growthRate', label: 'Growth Rate', value: '0%', tooltip: 'Growth from first to last day of period' },
      { id: 'momentum', label: 'Momentum', value: 'Stable', tooltip: 'Trend direction: Rising, Falling, or Stable' },
      { id: 'consistency', label: 'Consistency', value: '0%', tooltip: 'How consistent daily earnings are (100% = perfectly consistent)' },
      { id: 'peakDay', label: 'Peak Day', value: 'Mon', tooltip: 'Day of the period with highest earnings' }
    ];

    return `
      <div class="stats-summary">
        ${cards.map(card => `
          <div class="stat-card" data-tooltip="${card.tooltip}">
            <span class="stat-label">${card.label}</span>
            <span id="${card.id}" class="stat-value">${card.value}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  init() {
    this.initCharts();
    this.bindEvents();
    this.loadData();
  }

  bindEvents() {
    document.getElementById("refreshAnalytics")?.addEventListener("click", () => this.loadData());
    
    const timePeriod = document.getElementById("timePeriod");
    timePeriod?.addEventListener("change", () => {
      const customRange = document.getElementById("customDateRange");
      if (timePeriod.value === "custom") {
        customRange.style.display = "block";
      } else {
        customRange.style.display = "none";
        this.loadData();
      }
    });

    ["startDate", "endDate"].forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => this.loadData());
    });

    this.initTooltips();
  }

  initTooltips() {
    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        const tooltip = e.currentTarget.getAttribute('data-tooltip');
        if (tooltip) {
          this.showTooltip(e.currentTarget, tooltip);
        }
      });
      
      card.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'stat-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed;
      background: #1f2937;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      max-width: 220px;
      z-index: 10000;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.1);
      line-height: 1.4;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 8;
    
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    if (top < 8) {
      top = rect.bottom + 8;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    
    this.currentTooltip = tooltip;
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  initCharts() {
    this.earningsChart = new LineChart("earningsChart", {
      primaryGradient: ["#14b8a6", "#8b5cf6"],
      averageLineColor: "#f59e0b",
      markerColors: { high: "#10b981", low: "#ef4444" },
      gridColor: "#f1f5f9",
      textColor: "#64748b",
      padding: 60,
    });
  }

  async loadData() {
    if (this.isLoading) return;

    try {
      this.setLoadingState(true);
      const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";
      const loadMethods = {
        thisMonth: () => this.loadPeriodData(this.getThisMonthRange()),
        week: () => this.loadWeeklyData(),
        month: () => this.loadPeriodData(this.getLastMonthRange()),
        custom: () => this.loadCustomRangeData()
      };

      await loadMethods[timePeriod]();
    } catch (error) {
      this.setLoadingState(false);
      this.showStatus("Failed to load analytics data", "error");
    }
  }

  getThisMonthRange() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = today.getDate() - 1;
    return { firstDay, daysInMonth };
  }

  getLastMonthRange() {
    return { firstDay: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), daysInMonth: 30 };
  }

  async loadPeriodData({ firstDay, daysInMonth }) {
    const dailyEarnings = await this.fetchDailyEarnings(firstDay, daysInMonth);
    this.renderResults(dailyEarnings);
    this.updateSummaryStats(dailyEarnings);
  }

  async loadWeeklyData() {
    const [currentWeek, previousWeek] = await Promise.all([
      this.fetchDailyEarnings(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 6),
      this.fetchWeekEarnings(13, 7)
    ]);
    
    this.renderResults(currentWeek);
    this.updateWeeklySummaryStats(currentWeek, previousWeek);
  }

  async loadCustomRangeData() {
    const startDate = document.getElementById("startDate")?.value;
    const endDate = document.getElementById("endDate")?.value;
    
    if (!startDate || !endDate) {
      this.setLoadingState(false);
      this.showStatus("Please select both start and end dates", "error");
      return;
    }

    const start = new Date(startDate);
    const daysDiff = Math.ceil((new Date(endDate) - start) / (1000 * 60 * 60 * 24));
    const dailyEarnings = await this.fetchDailyEarnings(start, daysDiff + 1);
    
    this.renderResults(dailyEarnings);
    this.updateSummaryStats(dailyEarnings);
  }

  async fetchDailyEarnings(startDate, days) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const username = this.getUsername();
    const dailyEarnings = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const [startAt, endAt] = [date.setHours(0, 0, 0, 0), date.setHours(23, 59, 59, 999)];

      const response = await this.sendMessage(tab.id, {
        action: "earnings",
        params: { username, first: 1000, after: "", startAt, endAt }
      });

      dailyEarnings.push({
        label: new Date(startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: this.calculateDayEarnings(response),
        posts: this.extractPostsFromResponse(response)
      });
    }

    return dailyEarnings;
  }

  async fetchWeekEarnings(startDaysAgo, endDaysAgo) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const username = this.getUsername();
    const earnings = [];

    for (let i = startDaysAgo; i >= endDaysAgo; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const [startAt, endAt] = [date.setHours(0, 0, 0, 0), date.setHours(23, 59, 59, 999)];

      const response = await this.sendMessage(tab.id, {
        action: "earnings",
        params: { username, first: 1000, after: "", startAt, endAt }
      });

      earnings.push(this.calculateDayEarnings(response));
    }

    return earnings;
  }

  sendMessage(tabId, message) {
    return new Promise(resolve => {
      chrome.tabs.sendMessage(tabId, message, resolve);
    });
  }

  renderResults(dailyEarnings) {
    this.setLoadingState(false);
    this.updateChartTitle();
    this.earningsChart.render(dailyEarnings);
    this.showStatus("Analytics loaded successfully", "success");
  }

  updateSummaryStats(dailyEarnings, previousPeriodEarnings = []) {
    const stats = this.calculateStats(dailyEarnings, previousPeriodEarnings);
    this.updateDOM(stats);
    this.applyColors(stats);
  }

  updateWeeklySummaryStats(dailyEarnings, previousWeekEarnings) {
    const stats = this.calculateStats(dailyEarnings, previousWeekEarnings, 7);
    this.updateDOM(stats);
    this.applyColors(stats);
  }

  calculateStats(dailyEarnings, previousPeriodEarnings = [], totalDays = null) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map(day => day.value));
    const minEarnings = Math.min(...dailyEarnings.map(day => day.value));
    const avgEarnings = totalEarnings / (totalDays || dailyEarnings.length);
    const activeDays = dailyEarnings.filter(day => day.value > 0).length;

    // Previous period comparison
    const previousTotal = previousPeriodEarnings.reduce((sum, earnings) => sum + earnings, 0);
    const percentChange = previousTotal > 0 ? ((totalEarnings - previousTotal) / previousTotal) * 100 : 0;

    // Growth and trends
    const firstDay = dailyEarnings[0]?.value || 0;
    const lastDay = dailyEarnings[dailyEarnings.length - 1]?.value || 0;
    const growthRate = firstDay > 0 ? ((lastDay - firstDay) / firstDay) * 100 : 0;

    // Consistency
    const variance = dailyEarnings.reduce((sum, day) => sum + Math.pow(day.value - avgEarnings, 2), 0) / dailyEarnings.length;
    const consistency = avgEarnings > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / avgEarnings) * 100) : 0;

    // Streak
    let streak = 0;
    for (let i = dailyEarnings.length - 1; i >= 0; i--) {
      if (dailyEarnings[i].value > 0) streak++;
      else break;
    }

    // Content metrics
    const allPosts = dailyEarnings.flatMap(day => day.posts || []);
    const bestPost = allPosts.reduce((best, post) => post.earnings > (best?.earnings || 0) ? post : best, null);
    const totalPosts = allPosts.length;
    const avgPerPost = totalPosts > 0 ? totalEarnings / totalPosts : 0;
    const zeroDays = (totalDays || dailyEarnings.length) - activeDays;
    const efficiency = activeDays > 0 ? totalEarnings / activeDays : 0;

    // Momentum
    const midPoint = Math.floor(dailyEarnings.length / 2);
    const firstHalf = dailyEarnings.slice(0, midPoint).reduce((sum, day) => sum + day.value, 0);
    const secondHalf = dailyEarnings.slice(midPoint).reduce((sum, day) => sum + day.value, 0);
    const momentum = secondHalf > firstHalf ? "Rising" : secondHalf < firstHalf ? "Falling" : "Stable";

    // Peak day
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const peakDayIndex = dailyEarnings.findIndex(day => day.value === maxEarnings);
    const peakDay = dayNames[peakDayIndex] || "N/A";

    // Expected earnings (for current month)
    const expectedEarnings = this.calculateExpectedEarnings(dailyEarnings);

    return {
      totalEarnings, expectedEarnings, avgEarnings, maxEarnings, minEarnings,
      activeDays, zeroDays, efficiency, streak, percentChange, growthRate,
      consistency, momentum, peakDay, bestPost, totalPosts, avgPerPost,
      totalDays: totalDays || dailyEarnings.length
    };
  }

  calculateExpectedEarnings(dailyEarnings) {
    if (dailyEarnings.length === 0) return 0;
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    return (totalEarnings / dailyEarnings.length) * daysInMonth;
  }

  updateDOM(stats) {
    const updates = {
      totalEarnings: `$${stats.totalEarnings.toFixed(2)}`,
      expectedEarnings: `$${stats.expectedEarnings.toFixed(2)}`,
      avgDaily: `$${stats.avgEarnings.toFixed(2)}`,
      highestDay: `$${stats.maxEarnings.toFixed(2)}`,
      lowestDay: `$${stats.minEarnings.toFixed(2)}`,
      percentChange: `${stats.percentChange >= 0 ? "+" : ""}${stats.percentChange.toFixed(1)}%`,
      activeDays: `${stats.activeDays}/${stats.totalDays}`,
      growthRate: `${stats.growthRate >= 0 ? "+" : ""}${stats.growthRate.toFixed(1)}%`,
      consistency: `${stats.consistency.toFixed(0)}%`,
      peakDay: stats.peakDay,
      earningStreak: `${stats.streak} days`,
      bestPost: stats.bestPost ? `$${stats.bestPost.earnings.toFixed(2)}` : "None",
      totalPosts: stats.totalPosts,
      avgPerPost: `$${stats.avgPerPost.toFixed(2)}`,
      zeroDays: stats.zeroDays,
      momentum: stats.momentum,
      efficiency: `$${stats.efficiency.toFixed(2)}`
    };

    Object.entries(updates).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  applyColors(stats) {
    const colorMap = {
      percentChange: stats.percentChange >= 0 ? "#22c55e" : "#ef4444",
      growthRate: stats.growthRate >= 0 ? "#22c55e" : "#ef4444",
      momentum: stats.momentum === "Rising" ? "#22c55e" : stats.momentum === "Falling" ? "#ef4444" : "#6b7280"
    };

    Object.entries(colorMap).forEach(([id, color]) => {
      const element = document.getElementById(id);
      if (element) element.style.color = color;
    });
  }

  updateChartTitle() {
    const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";
    const titles = {
      thisMonth: "Daily Earnings - This Month",
      week: "Daily Earnings - Last Week", 
      month: "Daily Earnings - Last Month",
      custom: this.getCustomRangeTitle()
    };
    
    document.getElementById("chartTitle").textContent = titles[timePeriod];
  }

  getCustomRangeTitle() {
    const startDate = document.getElementById("startDate")?.value;
    const endDate = document.getElementById("endDate")?.value;
    if (startDate && endDate) {
      return `Daily Earnings - ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    }
    return "Daily Earnings - Custom Range";
  }



  setLoadingState(loading) {
    this.isLoading = loading;
    const loader = document.getElementById("chartLoader");
    const refreshBtn = document.getElementById("refreshAnalytics");

    if (loader) loader.style.display = loading ? "block" : "none";
    if (refreshBtn) refreshBtn.disabled = loading;

    this.showStatus(loading ? "Loading analytics..." : "", loading ? "loading" : "");
  }

  showStatus(message, type = "") {
    const status = document.getElementById("analyticsStatus");
    if (status) {
      status.textContent = message;
      status.className = `status ${type}`;
    }
  }

  getUsername() {
    return localStorage.getItem("self_username") || localStorage.getItem("competitor_username") || "codebyumar";
  }

  calculateDayEarnings(response) {
    if (!response?.data?.[0]?.data?.userResult?.postsConnection?.edges) return 0;

    return response.data[0].data.userResult.postsConnection.edges.reduce((total, post) => {
      const earnings = post.node.earnings?.monthlyEarnings;
      return total + (earnings ? (earnings.units || 0) + (earnings.nanos || 0) / 1000000000 : 0);
    }, 0);
  }

  extractPostsFromResponse(response) {
    if (!response?.data?.[0]?.data?.userResult?.postsConnection?.edges) return [];
    
    return response.data[0].data.userResult.postsConnection.edges
      .map(post => {
        const earnings = post.node.earnings?.monthlyEarnings;
        const earningsValue = earnings ? (earnings.units || 0) + (earnings.nanos || 0) / 1000000000 : 0;
        return { title: post.node.title, earnings: earningsValue };
      })
      .filter(post => post.earnings > 0);
  }
}