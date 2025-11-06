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
            <span id="totalLabel" class="stat-label">Total Earnings</span>
            <span id="totalEarnings" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Per Post</span>
            <span id="avgDaily" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Top Post</span>
            <span id="bestDay" class="stat-value">$0.00</span>
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
    const daysInMonth = today.getDate();

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

    for (let i = 6; i >= 0; i--) {
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
    this.updateWeeklySummaryStats(dailyEarnings);
    this.showStatus("Weekly analytics loaded successfully", "success");
  }

  async loadMonthlyData() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const username = localStorage.getItem("self_username") || localStorage.getItem("competitor_username") || "codebyumar";
    const dailyEarnings = [];

    for (let i = 29; i >= 0; i--) {
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

  updateWeeklySummaryStats(dailyEarnings) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map((day) => day.value));
    const avgEarnings = totalEarnings / 7;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("bestDay").textContent = `$${maxEarnings.toFixed(2)}`;
  }

  updateMonthlySummaryStats(dailyEarnings) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map((day) => day.value));
    const avgEarnings = totalEarnings / 30;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("bestDay").textContent = `$${maxEarnings.toFixed(2)}`;
  }

  updateChartTitle() {
    const timePeriod = document.getElementById("timePeriod")?.value || "thisMonth";
    let title = "Daily Earnings - Last Week";
    if (timePeriod === "month") title = "Daily Earnings - Last Month";
    if (timePeriod === "thisMonth") title = "Daily Earnings - This Month";
    document.getElementById("chartTitle").textContent = title;
  }

  updateThisMonthSummaryStats(dailyEarnings) {
    const totalEarnings = dailyEarnings.reduce((sum, day) => sum + day.value, 0);
    const maxEarnings = Math.max(...dailyEarnings.map((day) => day.value));
    const avgEarnings = totalEarnings / dailyEarnings.length;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("bestDay").textContent = `$${maxEarnings.toFixed(2)}`;
  }

  updateSummaryStats(posts) {
    if (!posts || posts.length === 0) {
      document.getElementById("totalEarnings").textContent = "$0.00";
      document.getElementById("avgDaily").textContent = "$0.00";
      document.getElementById("bestDay").textContent = "$0.00";
      return;
    }

    // Calculate actual earnings from all posts
    let totalEarnings = 0;
    let maxEarnings = 0;
    let earningPosts = 0;

    posts.forEach((post) => {
      const earnings = post.node.earnings?.monthlyEarnings;
      if (earnings) {
        const value = (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
        totalEarnings += value;
        maxEarnings = Math.max(maxEarnings, value);
        earningPosts++;
      }
    });

    const avgEarnings = earningPosts > 0 ? totalEarnings / earningPosts : 0;

    document.getElementById("totalEarnings").textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById("avgDaily").textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById("bestDay").textContent = `$${maxEarnings.toFixed(2)}`;
  }
}
