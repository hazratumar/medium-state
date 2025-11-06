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
            </select>
            <button id="refreshAnalytics" class="refresh-btn">Refresh</button>
          </div>
        </div>
        <div class="chart-section">
          <div class="chart-header">
            <h4 id="chartTitle">Top Earning Posts - Last Week</h4>
            <div id="analyticsStatus" class="status"></div>
          </div>
          <div class="chart-container">
            <canvas id="earningsChart" width="900" height="180"></canvas>
            <div id="chartLoader" class="chart-loader" style="display: none;">Loading...</div>
          </div>
        </div>
        <div class="stats-summary">
          <div class="stat-card">
            <span class="stat-label">Total Earnings</span>
            <span id="totalEarnings" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Daily</span>
            <span id="avgDaily" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Highest Day</span>
            <span id="highestDay" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Lowest Day</span>
            <span id="lowestDay" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">vs Previous</span>
            <span id="percentChange" class="stat-value">+0%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Active Days</span>
            <span id="activeDays" class="stat-value">0</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Growth Rate</span>
            <span id="growthRate" class="stat-value">0%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Consistency</span>
            <span id="consistency" class="stat-value">0%</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Peak Day</span>
            <span id="peakDay" class="stat-value">Mon</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Streak</span>
            <span id="earningStreak" class="stat-value">0 days</span>
          </div>
        </div>
      </div>
    `;
  }

  init() {
    this.initCharts();
    this.bindEvents();
    this.loadData();
  }

  bindEvents() {
    const refreshBtn = document.getElementById("refreshAnalytics");
    const timePeriod = document.getElementById("timePeriod");

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.loadData());
    }

    if (timePeriod) {
      timePeriod.addEventListener("change", () => this.loadData());
    }
  }

  initCharts() {
    this.earningsChart = new BarChart("earningsChart", {
      barColor: "#667eea",
      padding: 40,
    });
  }

  updateCanvasWidth() {
    const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";
    const canvas = document.getElementById("earningsChart");
    if (canvas) {
      canvas.width = timePeriod === "month" || timePeriod === "thisMonth" ? 1200 : 600;
    }
  }

  async loadThisMonthData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const username = localStorage.getItem("self_username") || localStorage.getItem("competitor_username") || "codebyumar";
    const dailyEarnings = [];

    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = today.getDate() - 1; // Exclude today

    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() + i);
      const startAt = date.setHours(0, 0, 0, 0);
      const endAt = date.setHours(23, 59, 59, 999);

      const params = {
        username,
        first: 1000,
        after: "",
        startAt,
        endAt,
      };

      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "earnings", params }, (response) => {
          const dayEarnings = this.calculateDayEarnings(response);
          dailyEarnings.push({
            label: new Date(startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: dayEarnings,
          });
          resolve();
        });
      });
    }

    this.setLoadingState(false);
    this.updateChartTitle();
    this.updateCanvasWidth();
    this.earningsChart.render(dailyEarnings);
    this.updateThisMonthSummaryStats(dailyEarnings);
    this.showStatus("This month analytics loaded successfully", "success");
  }

  async loadData() {
    if (this.isLoading) return;

    try {
      this.setLoadingState(true);
      const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";

      if (timePeriod === "thisMonth") {
        await this.loadThisMonthData();
      } else if (timePeriod === "week") {
        await this.loadWeeklyData();
      } else {
        await this.loadMonthlyData();
      }
    } catch (error) {
      this.setLoadingState(false);
      this.showStatus("Failed to load analytics data", "error");
    }
  }

  async loadWeeklyData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const username = localStorage.getItem("self_username") || localStorage.getItem("competitor_username") || "codebyumar";
    const dailyEarnings = [];
    const previousWeekEarnings = [];

    // Load current week (exclude today)
    for (let i = 6; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startAt = date.setHours(0, 0, 0, 0);
      const endAt = date.setHours(23, 59, 59, 999);

      const params = { username, first: 1000, after: "", startAt, endAt };

      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "earnings", params }, (response) => {
          const dayEarnings = this.calculateDayEarnings(response);
          dailyEarnings.push({
            label: new Date(startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: dayEarnings,
            date: new Date(startAt),
          });
          resolve();
        });
      });
    }

    // Load previous week for comparison
    for (let i = 13; i >= 7; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startAt = date.setHours(0, 0, 0, 0);
      const endAt = date.setHours(23, 59, 59, 999);

      const params = { username, first: 1000, after: "", startAt, endAt };

      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "earnings", params }, (response) => {
          const dayEarnings = this.calculateDayEarnings(response);
          previousWeekEarnings.push(dayEarnings);
          resolve();
        });
      });
    }

    this.setLoadingState(false);
    this.updateChartTitle();
    this.updateCanvasWidth();
    this.earningsChart.render(dailyEarnings);
    this.updateWeeklySummaryStats(dailyEarnings, previousWeekEarnings);
    this.showStatus("Weekly analytics loaded successfully", "success");
  }

  async loadMonthlyData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const username = localStorage.getItem("self_username") || localStorage.getItem("competitor_username") || "codebyumar";
    const dailyEarnings = [];

    for (let i = 29; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startAt = date.setHours(0, 0, 0, 0);
      const endAt = date.setHours(23, 59, 59, 999);

      const params = {
        username,
        first: 1000,
        after: "",
        startAt,
        endAt,
      };

      await new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "earnings", params }, (response) => {
          const dayEarnings = this.calculateDayEarnings(response);
          dailyEarnings.push({
            label: new Date(startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: dayEarnings,
          });
          resolve();
        });
      });
    }

    this.setLoadingState(false);
    this.updateChartTitle();
    this.updateCanvasWidth();
    this.earningsChart.render(dailyEarnings);
    this.updateMonthlySummaryStats(dailyEarnings);
    this.showStatus("Monthly analytics loaded successfully", "success");
  }

  getApiParams() {
    const username = localStorage.getItem("self_username") || localStorage.getItem("competitor_username") || "codebyumar";
    const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";
    const now = Date.now();

    let startAt;
    if (timePeriod === "month") {
      startAt = now - 30 * 24 * 60 * 60 * 1000; // 30 days ago
    } else {
      startAt = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    }

    return {
      username,
      first: 1000,
      after: "",
      startAt,
      endAt: now,
    };
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

  handleResponse(response) {
    if (!response || response.error) {
      this.showStatus(response?.error || "Failed to fetch data", "error");
      this.renderCharts();
      return;
    }

    const posts = response?.data?.[0]?.data?.userResult?.postsConnection?.edges;
    if (posts && posts.length > 0) {
      this.updateChartTitle();
      this.renderCharts(posts);
      this.updateSummaryStats(posts);
      this.showStatus("Analytics loaded successfully", "success");
    } else {
      this.renderCharts();
      this.showStatus("No earnings data available", "info");
    }
  }

  renderCharts(posts) {
    const earningsData = this.getEarningsData(posts);
    this.earningsChart.render(earningsData);
  }

  getEarningsData(posts) {
    if (!posts || posts.length === 0) {
      return this.getDummyData();
    }

    // Get top 7 earning posts for visualization
    const topPosts = posts
      .filter((post) => post.node.earnings?.monthlyEarnings)
      .sort((a, b) => {
        const aValue = (a.node.earnings.monthlyEarnings.units || 0) + (a.node.earnings.monthlyEarnings.nanos || 0) / 1000000000;
        const bValue = (b.node.earnings.monthlyEarnings.units || 0) + (b.node.earnings.monthlyEarnings.nanos || 0) / 1000000000;
        return bValue - aValue;
      })
      .slice(0, 7);

    return topPosts.map((post) => {
      const earnings = post.node.earnings.monthlyEarnings;
      const value = (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
      return {
        label: post.node.title.substring(0, 10) + "...",
        value,
      };
    });
  }

  getDummyData() {
    const today = new Date();
    const dummyEarnings = [5.2, 8.7, 12.3, 15.8, 9.4, 18.6, 22.1];
    return dummyEarnings.map((value, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
      };
    });
  }

  calculateDayEarnings(response) {
    if (!response?.data?.[0]?.data?.userResult?.postsConnection?.edges) return 0;

    const posts = response.data[0].data.userResult.postsConnection.edges;
    let totalEarnings = 0;

    posts.forEach((post) => {
      const earnings = post.node.earnings?.monthlyEarnings;
      if (earnings) {
        totalEarnings += (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
      }
    });

    return totalEarnings;
  }

  updateWeeklySummaryStats(dailyEarnings, previousWeekEarnings = []) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map((day) => day.value));
    const minEarnings = Math.min(...dailyEarnings.map((day) => day.value));
    const avgEarnings = totalEarnings / 7;
    const activeDays = dailyEarnings.filter((day) => day.value > 0).length;

    // Calculate percentage change vs previous week
    const previousTotal = previousWeekEarnings.reduce((sum, earnings) => sum + earnings, 0);
    const percentChange = previousTotal > 0 ? ((totalEarnings - previousTotal) / previousTotal) * 100 : 0;

    // Calculate growth rate (first vs last day)
    const firstDay = dailyEarnings[0]?.value || 0;
    const lastDay = dailyEarnings[dailyEarnings.length - 1]?.value || 0;
    const growthRate = firstDay > 0 ? ((lastDay - firstDay) / firstDay) * 100 : 0;

    // Calculate consistency (standard deviation)
    const variance = dailyEarnings.reduce((sum, day) => sum + Math.pow(day.value - avgEarnings, 2), 0) / 7;
    const consistency = avgEarnings > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / avgEarnings) * 100) : 0;

    // Find peak earning day of week
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const peakDayIndex = dailyEarnings.findIndex((day) => day.value === maxEarnings);
    const peakDay = dayNames[peakDayIndex] || "N/A";

    // Calculate earning streak
    let streak = 0;
    for (let i = dailyEarnings.length - 1; i >= 0; i--) {
      if (dailyEarnings[i].value > 0) streak++;
      else break;
    }

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("highestDay").textContent = `$${maxEarnings.toFixed(2)}`;
    document.getElementById("lowestDay").textContent = `$${minEarnings.toFixed(2)}`;
    document.getElementById("percentChange").textContent = `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
    document.getElementById("activeDays").textContent = `${activeDays}/7`;
    document.getElementById("growthRate").textContent = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%`;
    document.getElementById("consistency").textContent = `${consistency.toFixed(0)}%`;
    document.getElementById("peakDay").textContent = peakDay;
    document.getElementById("earningStreak").textContent = `${streak} days`;

    // Update colors
    const changeElement = document.getElementById("percentChange");
    const growthElement = document.getElementById("growthRate");
    if (changeElement) changeElement.style.color = percentChange >= 0 ? "#22c55e" : "#ef4444";
    if (growthElement) growthElement.style.color = growthRate >= 0 ? "#22c55e" : "#ef4444";
  }

  updateMonthlySummaryStats(dailyEarnings) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map((day) => day.value));
    const minEarnings = Math.min(...dailyEarnings.map((day) => day.value));
    const avgEarnings = totalEarnings / 30;
    const activeDays = dailyEarnings.filter((day) => day.value > 0).length;

    // Calculate growth rate (first vs last week)
    const firstWeek = dailyEarnings.slice(0, 7).reduce((sum, day) => sum + day.value, 0);
    const lastWeek = dailyEarnings.slice(-7).reduce((sum, day) => sum + day.value, 0);
    const percentChange = firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0;

    // Calculate growth rate (first vs last day)
    const firstDay = dailyEarnings[0]?.value || 0;
    const lastDay = dailyEarnings[dailyEarnings.length - 1]?.value || 0;
    const growthRate = firstDay > 0 ? ((lastDay - firstDay) / firstDay) * 100 : 0;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("highestDay").textContent = `$${maxEarnings.toFixed(2)}`;
    document.getElementById("lowestDay").textContent = `$${minEarnings.toFixed(2)}`;
    document.getElementById("percentChange").textContent = `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
    document.getElementById("activeDays").textContent = `${activeDays}/30`;
    document.getElementById("growthRate").textContent = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%`;

    // Update colors
    const changeElement = document.getElementById("percentChange");
    const growthElement = document.getElementById("growthRate");
    if (changeElement) changeElement.style.color = percentChange >= 0 ? "#22c55e" : "#ef4444";
    if (growthElement) growthElement.style.color = growthRate >= 0 ? "#22c55e" : "#ef4444";
  }

  updateChartTitle() {
    const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";
    let title = "Daily Earnings - Last Week";
    if (timePeriod === "thisMonth") title = "Daily Earnings - This Month";
    if (timePeriod === "month") title = "Daily Earnings - Last Month";
    document.getElementById("chartTitle").textContent = title;
  }

  updateThisMonthSummaryStats(dailyEarnings) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map((day) => day.value));
    const minEarnings = Math.min(...dailyEarnings.map((day) => day.value));
    const avgEarnings = totalEarnings / dailyEarnings.length;
    const activeDays = dailyEarnings.filter((day) => day.value > 0).length;

    // Calculate growth rate (first vs last week of current month)
    const firstWeek = dailyEarnings.slice(0, Math.min(7, dailyEarnings.length)).reduce((sum, day) => sum + day.value, 0);
    const lastWeek = dailyEarnings.slice(-Math.min(7, dailyEarnings.length)).reduce((sum, day) => sum + day.value, 0);
    const percentChange = firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0;

    // Calculate growth rate (first vs last day)
    const firstDay = dailyEarnings[0]?.value || 0;
    const lastDay = dailyEarnings[dailyEarnings.length - 1]?.value || 0;
    const growthRate = firstDay > 0 ? ((lastDay - firstDay) / firstDay) * 100 : 0;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("highestDay").textContent = `$${maxEarnings.toFixed(2)}`;
    document.getElementById("lowestDay").textContent = `$${minEarnings.toFixed(2)}`;
    document.getElementById("percentChange").textContent = `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
    document.getElementById("activeDays").textContent = `${activeDays}/${dailyEarnings.length}`;
    document.getElementById("growthRate").textContent = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%`;

    // Update colors
    const changeElement = document.getElementById("percentChange");
    const growthElement = document.getElementById("growthRate");
    if (changeElement) changeElement.style.color = percentChange >= 0 ? "#22c55e" : "#ef4444";
    if (growthElement) growthElement.style.color = growthRate >= 0 ? "#22c55e" : "#ef4444";
  }

  updateSummaryStats(posts) {
    if (!posts || posts.length === 0) {
      document.getElementById("totalEarnings").textContent = "$0.00";
      document.getElementById("avgDaily").textContent = "$0.00";
      document.getElementById("highestDay").textContent = "$0.00";
      document.getElementById("lowestDay").textContent = "$0.00";
      document.getElementById("percentChange").textContent = "+0%";
      document.getElementById("activeDays").textContent = "0";
      document.getElementById("growthRate").textContent = "+0%";
      return;
    }

    // Calculate actual earnings from all posts
    let totalEarnings = 0;
    let maxEarnings = 0;
    let minEarnings = Infinity;
    let earningPosts = 0;

    posts.forEach((post) => {
      const earnings = post.node.earnings?.monthlyEarnings;
      if (earnings) {
        const value = (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
        totalEarnings += value;
        maxEarnings = Math.max(maxEarnings, value);
        minEarnings = Math.min(minEarnings, value);
        earningPosts++;
      }
    });

    const avgEarnings = earningPosts > 0 ? totalEarnings / earningPosts : 0;
    minEarnings = minEarnings === Infinity ? 0 : minEarnings;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("highestDay").textContent = `$${maxEarnings.toFixed(2)}`;
    document.getElementById("lowestDay").textContent = `$${minEarnings.toFixed(2)}`;
    document.getElementById("percentChange").textContent = "+0%";
    document.getElementById("activeDays").textContent = `${earningPosts}`;
    document.getElementById("growthRate").textContent = "+0%";
  }
}
