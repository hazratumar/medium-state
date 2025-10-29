class StatsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
    this.currentPosts = null;
  }

  render() {
    const params = this.extension.getParams();
    const username = params.username || "Not set";
    const selfUsername = localStorage.getItem("self_username");
    const isSelf = username === selfUsername;
    return `
      <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.15);">
        <div style="color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;">${isSelf ? "Your Statistics" : "Competitor Analysis"}</div>
        <div style="color: #ffffff; font-size: ${isSelf ? "20px" : "24px"}; font-weight: 700;">${isSelf ? "Personal Dashboard" : `@${username}`}</div>
      </div>
      <div class="controls">
        <div class="form-group">
          <label for="orderBy">Sort by</label>
          <select id="orderBy">
            <option value="latest-desc">Latest First</option>
            <option value="oldest-asc">Oldest First</option>
            <option value="views-desc">Most Viewed</option>
            <option value="views-asc">Least Viewed</option>
            <option value="reads-desc">Most Read</option>
            <option value="reads-asc">Least Read</option>
            <option value="rate-desc">Highest Read Rate</option>
            <option value="rate-asc">Lowest Read Rate</option>
            <option value="earnings-desc">Highest Earnings</option>
            <option value="earnings-asc">Lowest Earnings</option>
          </select>
        </div>
        <div class="form-group" style="flex: 0;">
          <button id="refreshStats" class="btn-primary" style="margin-top: 24px; padding: 10px 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>
      <div id="status" class="status"></div>
      <div id="table" class="table-container"></div>
    `;
  }

  init() {
    const orderBy = document.getElementById("orderBy");
    if (orderBy) {
      orderBy.addEventListener("change", () => {
        this.sortTable();
      });
    }

    const refreshBtn = document.getElementById("refreshStats");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.extension.handleApiCall();
      });
    }
  }

  generateReport(posts) {
    if (!posts || posts.length === 0) return null;

    const data = posts.map((post) => post.node);
    const totalViews = data.reduce((sum, p) => sum + (p.totalStats?.views || 0), 0);
    const totalReads = data.reduce((sum, p) => sum + (p.totalStats?.reads || 0), 0);
    const totalEarnings = data.reduce((sum, p) => {
      return sum + this.calculateEarnings(p);
    }, 0);
    const readRate = totalViews > 0 ? ((totalReads / totalViews) * 100).toFixed(1) : 0;

    return `
      <div class="report-summary">
        <div class="stat-card">
          <div class="stat-value">${this.extension.formatNumber(totalViews)}</div>
          <div class="stat-label">Total Views</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.extension.formatNumber(totalReads)}</div>
          <div class="stat-label">Total Reads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${readRate}%</div>
          <div class="stat-label">Read Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${totalEarnings.toFixed(2)}</div>
          <div class="stat-label">Total Earnings</div>
        </div>
      </div>`;
  }

  renderTable(posts) {
    if (!posts || posts.length === 0) {
      const table = document.getElementById("table");
      if (table) {
        table.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="margin-bottom: 16px; opacity: 0.5;">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3>No articles found</h3>
          <p>Try adjusting your filters or check if you have published articles on Medium.</p>
        </div>`;
      }
      return;
    }

    const reportSummary = this.generateReport(posts);
    const sortedPosts = posts;

    const rows = sortedPosts
      .map((post, index) => {
        const { title, totalStats, earnings } = post.node;
        const readRate = totalStats?.views > 0 ? ((totalStats.reads / totalStats.views) * 100).toFixed(1) : 0;
        return `
        <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
          <td class="number">${index + 1}</td>
          <td class="title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</td>
          <td class="number">${this.extension.formatNumber(totalStats?.views)}</td>
          <td class="number">${this.extension.formatNumber(totalStats?.reads)} <small style="color: #6b7280;">(${readRate}%)</small></td>
          <td class="number">${this.formatEarningsForDisplay(post.node)}</td>
        </tr>`;
      })
      .join("");

    let table = document.getElementById("table");
    if (!table) {
      const activePanel = document.querySelector(".tab-panel.active");
      if (activePanel) {
        activePanel.insertAdjacentHTML("beforeend", '<div id="table" class="table-container"></div>');
      }
      table = document.getElementById("table");
    }

    if (table) {
      table.innerHTML = `
      ${reportSummary}
      <div class="table-container">
        <table id="dataTable">
          <thead>
            <tr>
              <th>S/N</th>
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
    }

    this.currentPosts = posts;

    const style = document.createElement("style");
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

  sortTable() {
    if (!this.currentPosts) return;

    const orderBy = document.getElementById("orderBy");
    const sortValue = orderBy ? orderBy.value : "latest-desc";
    const [field, direction] = sortValue.split("-");
    const isAsc = direction === "asc";

    const sorted = [...this.currentPosts].sort((a, b) => {
      let aVal, bVal;

      if (field === "latest" || field === "oldest") {
        aVal = new Date(a.node.firstPublishedAt).getTime();
        bVal = new Date(b.node.firstPublishedAt).getTime();
      } else if (field === "earnings") {
        aVal = this.calculateEarnings(a.node);
        bVal = this.calculateEarnings(b.node);
      } else if (field === "rate") {
        aVal = a.node.totalStats?.views > 0 ? (a.node.totalStats.reads / a.node.totalStats.views) * 100 : 0;
        bVal = b.node.totalStats?.views > 0 ? (b.node.totalStats.reads / b.node.totalStats.views) * 100 : 0;
      } else {
        aVal = a.node.totalStats?.[field] || 0;
        bVal = b.node.totalStats?.[field] || 0;
      }

      return isAsc ? aVal - bVal : bVal - aVal;
    });

    this.updateTableRows(sorted);
  }

  calculateEarnings(post) {
    const params = this.extension.getParams();
    const selfUsername = localStorage.getItem("self_username");
    const isCompetitor = params.username !== selfUsername;
    
    if (isCompetitor) {
      const reads = post.totalStats?.reads || 0;
      const views = post.totalStats?.views || 0;
      const readRate = views > 0 ? (reads / views) * 100 : 0;
      return readRate < 100 ? reads / (100 - readRate) : 0;
    }
    
    const earnings = post.earnings;
    return (earnings?.total?.units || 0) + (earnings?.total?.nanos || 0) / 1000000000;
  }

  formatEarningsForDisplay(post) {
    const params = this.extension.getParams();
    const selfUsername = localStorage.getItem("self_username");
    const isCompetitor = params.username !== selfUsername;
    
    if (isCompetitor) {
      const calculatedEarnings = this.calculateEarnings(post);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(calculatedEarnings);
    }
    
    return this.extension.formatEarnings(post.earnings);
  }

  getEarningsValue(earnings) {
    return (earnings?.total?.units || 0) + (earnings?.total?.nanos || 0) / 1000000000;
  }

  updateTableRows(posts) {
    const tbody = document.querySelector("#dataTable tbody");
    if (!tbody) return;

    const rows = posts
      .map((post, idx) => {
        const { title, totalStats, earnings } = post.node;
        const readRate = totalStats?.views > 0 ? ((totalStats.reads / totalStats.views) * 100).toFixed(1) : 0;
        return `
        <tr>
          <td class="number">${idx + 1}</td>
          <td class="title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</td>
          <td class="number">${this.extension.formatNumber(totalStats?.views)}</td>
          <td class="number">${this.extension.formatNumber(totalStats?.reads)} <small style="color: #6b7280;">(${readRate}%)</small></td>
          <td class="number">${this.formatEarningsForDisplay(post.node)}</td>
        </tr>`;
      })
      .join("");

    tbody.innerHTML = rows;
  }
}
