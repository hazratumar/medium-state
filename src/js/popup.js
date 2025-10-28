class MediumStatsExtension {
  constructor() {
    this.isAdvancedVisible = false;
    this.tabs = {
      stats: new StatsTab(this),
      analytics: new AnalyticsTab(this),
      "bulk-actions": new BulkActionsTab(this),
      settings: new SettingsTab(this),
    };
    // Wait for DOM to be ready before initializing
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  getElements() {
    return {
      status: document.getElementById("status"),
      table: document.getElementById("table"),
      chart: document.getElementById("chart"),
      first: document.getElementById("first"),
      after: document.getElementById("after"),
      orderBy: document.getElementById("orderBy"),
      filter: document.getElementById("filter"),
    };
  }

  init() {
    this.elements = this.getElements();
    this.initTabs();
    // Make the API call immediately when popup opens
    this.checkMediumPage().then(() => {
      // Initialize first tab
      this.switchTab("settings");
    });
  }

  initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      button.addEventListener("click", () => this.switchTab(button.dataset.tab));
    });
  }

  switchTab(tabName) {
    document.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    const panel = document.getElementById(tabName);
    panel.classList.add("active");

    // Render tab content
    if (this.tabs[tabName]) {
      panel.innerHTML = this.tabs[tabName].render();
      this.tabs[tabName].init();

      // Refresh data when stats tab is selected
      if (tabName === "stats") {
        this.handleApiCall();
      }
    }
  }

  async checkMediumPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url.includes("medium.com")) {
        this.showStatus("Please navigate to Medium.com first", "error");
        if (this.elements.orderBy) {
          this.elements.orderBy.disabled = true;
        }
        return false;
      }

      // Extract username from URL
      const urlParts = tab.url.split("/");
      const mediumIndex = urlParts.findIndex((part) => part.includes("medium.com"));
      if (mediumIndex !== -1 && urlParts[mediumIndex + 1] && urlParts[mediumIndex + 1].startsWith("@")) {
        const username = urlParts[mediumIndex + 1].substring(1); // Remove @ symbol
        localStorage.setItem("competitor_username", username);
      }

      return true;
    } catch (error) {
      this.showStatus("Unable to check current page", "error");
      return false;
    }
  }

  getParams() {
    const selfUsername = localStorage.getItem("self_username");
    const competitorUsername = localStorage.getItem("competitor_username");

    // Determine which username to use
    const username = selfUsername && (!competitorUsername || competitorUsername === selfUsername) ? selfUsername : competitorUsername || "";

    // Parse numeric limit safely, with default fallback
    const limit = Number(localStorage.getItem("limit")) || 1000;

    // Return parameter object with clear defaults
    return {
      first: limit,
      after: "",
      orderBy: "latest-desc", // Default sort: latest posts
      filter: true,
      username,
    };
  }

  setLoadingState(loading) {
    // Disable sort control if present
    const orderBy = document.getElementById("orderBy");
    if (orderBy) orderBy.disabled = loading;

    // Show status (CSS will show spinner when type is 'loading')
    this.showStatus(loading ? "Fetching your Medium statistics..." : "", loading ? "loading" : "");

    // Show a skeleton loader in the table while loading
    const table = document.getElementById("table");
    if (table) {
      if (loading) {
        table.innerHTML = this.getSkeletonMarkup();
      } else {
        // Remove skeleton if still present; real data will replace it in renderTable
        if (table.querySelector && table.querySelector(".skeleton-row")) {
          table.innerHTML = "";
        }
      }
    }
  }

  getSkeletonMarkup() {
    const rows = Array.from({ length: 6 })
      .map(
        () => `
          <div class="skeleton-row">
            <div class="skeleton-cell small"></div>
            <div class="skeleton-cell title"></div>
            <div class="skeleton-cell small"></div>
            <div class="skeleton-cell small"></div>
            <div class="skeleton-cell small"></div>
          </div>`
      )
      .join("");

    return `<div class="skeleton-container">${rows}</div>`;
  }

  showStatus(message, type = "success") {
    const status = document.getElementById("status");
    if (status) {
      status.textContent = message;
      status.className = `status ${type}`;
      status.style.display = message ? "block" : "none";

      // Auto-hide success messages after 3 seconds
      if (type === "success" && message) {
        setTimeout(() => {
          status.style.display = "none";
        }, 3000);
      }
    }
  }

  formatEarnings(earnings) {
    if (!earnings?.total) return "$0.00";
    const value = (earnings.total.units || 0) + (earnings.total.nanos || 0) / 1000000000;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  }

  formatNumber(num) {
    return new Intl.NumberFormat("en-US").format(num || 0);
  }

  async loadChartData() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url.includes("medium.com")) return;

      chrome.tabs.sendMessage(
        tab.id,
        {
          action: "call",
          params: { first: 100, orderBy: "latest-desc", filter: true, username: localStorage.getItem("competitor_username") || "" },
        },
        (response) => {
          if (response?.data?.[0]?.data?.user?.postsConnection?.edges) {
            this.renderChart(response.data[0].data.user.postsConnection.edges);
          }
        }
      );
    } catch (error) {
      console.log("Chart data load failed");
    }
  }

  renderChart(posts) {
    const dailyEarnings = this.aggregateDailyEarnings(posts);
    if (dailyEarnings.length === 0) {
      const canvas = document.getElementById("chart");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px Inter";
      ctx.textAlign = "center";
      ctx.fillText("No earnings data available", canvas.width / 2, canvas.height / 2);
      return;
    }

    const canvas = document.getElementById("chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear and set background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const maxEarnings = Math.max(...dailyEarnings.map((d) => d.earnings), 1);
    const barWidth = chartWidth / dailyEarnings.length;

    // Draw grid lines
    ctx.strokeStyle = "#f3f4f6";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw bars with gradient
    dailyEarnings.forEach((day, i) => {
      const barHeight = Math.max((day.earnings / maxEarnings) * chartHeight, 2);
      const x = padding + i * barWidth;
      const y = height - padding - barHeight;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 4, y, barWidth - 8, barHeight);

      // Add rounded corners effect
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x + 4, y, barWidth - 8, Math.min(barHeight, 6), 3);
      ctx.fill();

      // Date labels
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px Inter";
      ctx.textAlign = "center";
      const shortDate = new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      ctx.fillText(shortDate, x + barWidth / 2, height - 8);

      // Value labels (only if bar is tall enough)
      if (barHeight > 20) {
        ctx.fillStyle = "#374151";
        ctx.font = "bold 10px Inter";
        ctx.fillText(`$${day.earnings.toFixed(2)}`, x + barWidth / 2, y - 8);
      }
    });

    canvas.style.display = "block";
  }

  aggregateDailyEarnings(posts) {
    const dailyMap = new Map();
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyMap.set(dateStr, { date: dateStr, earnings: 0 });
    }

    posts.forEach((post) => {
      const earnings = post.node.earnings;
      if (earnings?.total) {
        const value = (earnings.total.units || 0) + (earnings.total.nanos || 0) / 1000000000;
        const dateStr = today.toISOString().split("T")[0];
        if (dailyMap.has(dateStr)) {
          dailyMap.get(dateStr).earnings += value;
        }
      }
    });

    return Array.from(dailyMap.values());
  }

  handleResponse(response) {
    if (!response || response.error) {
      this.showStatus(response?.error || "Failed to fetch data", "error");
      return;
    }

    // Extract posts from the nested response structure
    const posts = response?.data[0]?.data?.user?.postsConnection?.edges;

    if (posts && posts.length > 0) {
      this.tabs.stats.renderTable(posts);
      this.renderChart(posts);
      this.showStatus("Data loaded successfully", "success");
    } else {
      this.showStatus("No data received", "error");
    }
  }

  async handleApiCall() {
    try {
      const params = this.getParams();

      if (!params.username) {
        this.showStatus("Please set your Self or Competitor username in Settings first", "error");
        return;
      }

      this.setLoadingState(true);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { action: "call", params }, (response) => {
        this.setLoadingState(false);
        this.handleResponse(response);
      });
    } catch (error) {
      this.setLoadingState(false);
      this.showStatus("Failed to communicate with content script", "error");
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new MediumStatsExtension());
} else {
  new MediumStatsExtension();
}
