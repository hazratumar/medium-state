class MediumStatsExtension {
  constructor() {
    this.elements = this.getElements();
    this.isAdvancedVisible = false;
    this.init();
  }

  getElements() {
    return {
      status: document.getElementById("status"),
      table: document.getElementById("table"),
      chart: document.getElementById("chart"),
      callButton: document.getElementById("call"),
      first: document.getElementById("first"),
      after: document.getElementById("after"),
      orderBy: document.getElementById("orderBy"),
      filter: document.getElementById("filter"),
    };
  }

  init() {
    this.elements.callButton.addEventListener("click", () => this.handleApiCall());
    this.checkMediumPage();
    this.loadChartData();
    this.handleApiCall();
  }

  async checkMediumPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.url.includes("medium.com")) {
        this.showStatus("Please navigate to Medium.com first", "error");
        this.elements.callButton.disabled = true;
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
    this.elements.callButton.textContent = loading ? "Loading..." : "Load Stats";
    this.elements.callButton.disabled = loading;
    if (loading) {
      this.showStatus("Fetching your Medium stats...", "loading");
    }
  }

  showStatus(message, type = "success") {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.style.display = message ? "block" : "none";
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
    if (dailyEarnings.length === 0) return;

    const canvas = this.elements.chart;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, width, height);

    const maxEarnings = Math.max(...dailyEarnings.map((d) => d.earnings));
    const barWidth = chartWidth / dailyEarnings.length;

    dailyEarnings.forEach((day, i) => {
      const barHeight = (day.earnings / maxEarnings) * chartHeight;
      const x = padding + i * barWidth;
      const y = height - padding - barHeight;

      ctx.fillStyle = "#007bff";
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

      ctx.fillStyle = "#333";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(day.date, x + barWidth / 2, height - 5);
      ctx.fillText(`$${day.earnings.toFixed(2)}`, x + barWidth / 2, y - 5);
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
          <h3>No posts found</h3>
          <p>Try adjusting your filters or check if you have published posts on Medium.</p>
        </div>`;
      return;
    }

    const reportSummary = this.generateReport(posts);
    const sortedPosts = [...posts].sort((a, b) => (b.node.totalStats?.views || 0) - (a.node.totalStats?.views || 0));

    const rows = sortedPosts
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

    this.elements.table.innerHTML = `
      ${reportSummary}
      <div class="table-controls">
        <select id="sortBy" onchange="window.extensionInstance.sortTable(this.value)">
          <option value="views">Sort by Views</option>
          <option value="reads">Sort by Reads</option>
          <option value="earnings">Sort by Earnings</option>
          <option value="title">Sort by Title</option>
        </select>
        <input type="text" id="searchTable" placeholder="Search posts..." 
               oninput="window.extensionInstance.filterTable(this.value)">
      </div>
      <table class="table" id="dataTable">
        <thead>
          <tr>
            <th>Title</th>
            <th>Views</th>
            <th>Reads</th>
            <th>Earnings</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;

    this.currentPosts = posts;
    window.extensionInstance = this;
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
