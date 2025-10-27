class MediumStatsExtension {
  constructor() {
    this.elements = this.getElements();
    this.isAdvancedVisible = false;
    this.tabs = {
      stats: new StatsTab(this),
      analytics: new AnalyticsTab(this),
      settings: new SettingsTab(this)
    };
    this.init();
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
    this.initTabs();
    this.checkMediumPage();
    // Initialize first tab
    this.switchTab('stats');
    this.handleApiCall();
  }

  initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button.dataset.tab));
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    const panel = document.getElementById(tabName);
    panel.classList.add('active');
    
    // Render tab content
    if (this.tabs[tabName]) {
      panel.innerHTML = this.tabs[tabName].render();
      this.tabs[tabName].init();
    }
  }

  async checkMediumPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url.includes("medium.com")) {
        this.showStatus("Please navigate to Medium.com first", "error");
        this.elements.orderBy.disabled = true;
      }
    } catch (error) {
      this.showStatus("Unable to check current page", "error");
    }
  }

  getParams() {
    return {
      first: Math.min(parseInt(this.elements.first.value) || 50, 1000),
      after: this.elements.after.value.trim(),
      orderBy: this.elements.orderBy.value,
      filter: this.elements.filter.value === "true",
    };
  }

  setLoadingState(loading) {
    this.elements.orderBy.disabled = loading;
    if (loading) {
      this.showStatus("Fetching your Medium statistics...", "loading");
    }
  }

  showStatus(message, type = "success") {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.style.display = message ? "block" : "none";
    
    // Auto-hide success messages after 3 seconds
    if (type === "success" && message) {
      setTimeout(() => {
        this.elements.status.style.display = "none";
      }, 3000);
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
          params: { first: 100, orderBy: "latest-desc", filter: true },
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
      const canvas = this.elements.chart;
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

    const canvas = this.elements.chart;
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
      const shortDate = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  generateReport(posts) {
    if (!posts || posts.length === 0) return null;

    const data = posts.map((post) => post.node);
    const totalViews = data.reduce((sum, p) => sum + (p.totalStats?.views || 0), 0);
    const totalReads = data.reduce((sum, p) => sum + (p.totalStats?.reads || 0), 0);
    const totalEarnings = data.reduce((sum, p) => {
      const earnings = p.earnings;
      return sum + ((earnings?.total?.units || 0) + (earnings?.total?.nanos || 0) / 1000000000);
    }, 0);
    const readRate = totalViews > 0 ? ((totalReads / totalViews) * 100).toFixed(1) : 0;

    return `
      <div class="report-summary">
        <div class="stat-card">
          <div class="stat-value">${this.formatNumber(totalViews)}</div>
          <div class="stat-label">Total Views</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.formatNumber(totalReads)}</div>
          <div class="stat-label">Total Reads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${totalEarnings.toFixed(2)}</div>
          <div class="stat-label">Total Earnings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${readRate}%</div>
          <div class="stat-label">Read Rate</div>
        </div>
      </div>`;
  }

  renderTable(posts) {
    if (!posts || posts.length === 0) {
      this.elements.table.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin-bottom: 16px; opacity: 0.5;">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3>No articles found</h3>
          <p>Try adjusting your filters or check if you have published articles on Medium.</p>
        </div>`;
      return;
    }

    const reportSummary = this.generateReport(posts);
    const sortedPosts = [...posts].sort((a, b) => (b.node.totalStats?.views || 0) - (a.node.totalStats?.views || 0));

    const rows = sortedPosts
      .map((post, index) => {
        const { title, totalStats, earnings } = post.node;
        const readRate = totalStats?.views > 0 ? ((totalStats.reads / totalStats.views) * 100).toFixed(1) : 0;
        return `
        <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
          <td class="title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</td>
          <td class="number">${this.formatNumber(totalStats?.views)}</td>
          <td class="number">${this.formatNumber(totalStats?.reads)} <small style="color: #6b7280;">(${readRate}%)</small></td>
          <td class="number">${this.formatEarnings(earnings)}</td>
        </tr>`;
      })
      .join("");

    this.elements.table.innerHTML = `
      ${reportSummary}
      <div class="table-controls">
        <select id="sortBy" onchange="window.extensionInstance.sortTable(this.value)">
          <option value="views">Sort by Views</option>
          <option value="reads">Sort by Reads</option>
          <option value="earnings">Sort by Earnings</option>
          <option value="title">Sort by Title</option>
        </select>
        <input type="text" id="searchTable" placeholder="🔍 Search articles..." 
               oninput="window.extensionInstance.filterTable(this.value)">
      </div>
      <div class="table-container">
        <table id="dataTable">
          <thead>
            <tr>
              <th>Article Title</th>
              <th>Views</th>
              <th>Reads (Rate)</th>
              <th>Earnings</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`;

    this.currentPosts = posts;
    window.extensionInstance = this;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  sortTable(sortBy) {
    if (!this.currentPosts) return;

    const sorted = [...this.currentPosts].sort((a, b) => {
      const aVal =
        sortBy === "title" ? a.node.title : sortBy === "earnings" ? this.getEarningsValue(a.node.earnings) : a.node.totalStats?.[sortBy] || 0;
      const bVal =
        sortBy === "title" ? b.node.title : sortBy === "earnings" ? this.getEarningsValue(b.node.earnings) : b.node.totalStats?.[sortBy] || 0;

      return sortBy === "title" ? aVal.localeCompare(bVal) : bVal - aVal;
    });

    this.updateTableRows(sorted);
  }

  filterTable(searchText) {
    if (!this.currentPosts) return;

    const filtered = this.currentPosts.filter((post) => post.node.title.toLowerCase().includes(searchText.toLowerCase()));

    this.updateTableRows(filtered);
  }

  getEarningsValue(earnings) {
    return (earnings?.total?.units || 0) + (earnings?.total?.nanos || 0) / 1000000000;
  }

  updateTableRows(posts) {
    const tbody = document.querySelector("#dataTable tbody");
    if (!tbody) return;

    const rows = posts
      .map((post) => {
        const { title, totalStats, earnings } = post.node;
        return `
        <tr>
          <td class="title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</td>
          <td class="number">${this.formatNumber(totalStats?.views)}</td>
          <td class="number">${this.formatNumber(totalStats?.reads)}</td>
          <td class="number">${this.formatEarnings(earnings)}</td>
        </tr>`;
      })
      .join("");

    tbody.innerHTML = rows;
  }

  handleResponse(response) {
    if (chrome.runtime.lastError) {
      this.showStatus(`Error: ${chrome.runtime.lastError.message}`, "error");
      return;
    }

    if (!response) {
      this.showStatus("Failed to fetch data. Please try again.", "error");
      return;
    }

    if (response.error) {
      this.showStatus(`API Error: ${response.error}`, "error");
      return;
    }

    if (response.data?.[0]?.data?.user?.postsConnection?.edges) {
      const posts = response.data[0].data.user.postsConnection.edges;
      this.showStatus(`Loaded ${posts.length} posts successfully`, "success");
      this.renderTable(posts);
    } else {
      this.showStatus("No data received. Make sure you're logged into Medium.", "error");
    }
  }

  async handleApiCall() {
    try {
      const params = this.getParams();
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
