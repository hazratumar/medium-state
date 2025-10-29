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
      <div id="analysis-card" style="margin-bottom: 24px; padding: 24px; background: #f8f9fa; border: 1px solid #e1e4e8; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); transition: all 0.3s ease;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0, 0, 0, 0.08)'; this.style.borderColor='#d1d5db';" onmouseout="this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.04)'; this.style.borderColor='#e1e4e8';">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e1e4e8;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 600; flex-shrink: 0;">${username
            .charAt(0)
            .toUpperCase()}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 4px; letter-spacing: -0.02em;">@${username}</div>
            <div style="color: #6b7280; font-size: 13px; font-weight: 500;">${isSelf ? "Your Statistics" : "Competitor Analysis"}</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" style="flex-shrink: 0;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <div>
              <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Member Since</div>
              <div id="member-since" style="color: #1f2937; font-size: 14px; font-weight: 600;">—</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" style="flex-shrink: 0;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div>
              <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Total Stories</div>
              <div id="total-stories" style="color: #1f2937; font-size: 14px; font-weight: 600;">—</div>
            </div>
          </div>
        </div>
        <div id="report-summary-container"></div>
      </div>
      <div class="controls" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
        <div class="form-group" style="flex:1; min-width:220px;">
          <select id="orderBy" style="width:100%; padding:8px;">
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
        <div class="form-group" style="display:flex; gap:8px; align-items:center; flex:0;">
          <button id="refreshStats" class="btn-primary" style="padding: 10px 18px; display:inline-flex; align-items:center; gap:6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
          <button id="exportCsv" class="btn-secondary" style="padding: 10px 14px; display:inline-flex; align-items:center; gap:6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            CSV
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
        this.refreshTable();
      });
    }

    const exportBtn = document.getElementById("exportCsv");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportCsv();
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

    const monthsActive = this.calculateMonthsActive(data);
    const avgMonthlyEarnings = monthsActive > 0 ? totalEarnings / monthsActive : 0;

    const dates = data.map((p) => new Date(p.firstPublishedAt)).sort((a, b) => a - b);
    const memberSince = dates.length > 0 ? dates[0].toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
    const totalStories = posts.length;

    setTimeout(() => {
      const memberSinceEl = document.getElementById("member-since");
      const totalStoriesEl = document.getElementById("total-stories");
      if (memberSinceEl) memberSinceEl.textContent = memberSince;
      if (totalStoriesEl) totalStoriesEl.textContent = totalStories;
    }, 0);

    return `
      <div class="report-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 16px;">
        <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Views</div>
          <div style="color: #1f2937; font-size: 18px; font-weight: 700;">${this.extension.formatNumber(totalViews)}</div>
        </div>
        <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Reads</div>
          <div style="color: #1f2937; font-size: 18px; font-weight: 700;">${this.extension.formatNumber(totalReads)}</div>
        </div>
        <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Read Rate</div>
          <div style="color: #1f2937; font-size: 18px; font-weight: 700;">${readRate}%</div>
        </div>
        <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Earnings</div>
          <div style="color: #1f2937; font-size: 18px; font-weight: 700;">$${totalEarnings.toFixed(2)}</div>
        </div>
        <div style="background: white; padding: 14px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="color: #9ca3af; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Monthly</div>
          <div style="color: #1f2937; font-size: 18px; font-weight: 700;">$${avgMonthlyEarnings.toFixed(2)}</div>
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
      const reportContainer = document.getElementById("report-summary-container");
      if (reportContainer) {
        reportContainer.innerHTML = "";
      }
      return;
    }

    const reportSummary = this.generateReport(posts);
    const reportContainer = document.getElementById("report-summary-container");
    if (reportContainer) {
      reportContainer.innerHTML = reportSummary;
    }
    const sortedPosts = posts;

    const rows = sortedPosts
      .map((post, index) => {
        const { title, totalStats, earnings } = post.node;
        const readRate = totalStats?.views > 0 ? ((totalStats.reads / totalStats.views) * 100).toFixed(1) : 0;
        return `
        <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
          <td class="number">${index + 1}</td>
          <td class="title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</td>
          <td class="copy"><button class="copy-title-btn" data-title="${this.escapeHtml(title)}" aria-label="Copy title">Copy</button></td>
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
      <div class="table-container">
        <table id="dataTable">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Article Title</th>
              <th>Copy</th>
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
      .copy-title-btn { padding: 6px 8px; font-size: 12px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; }
      .copy-title-btn:active { transform: translateY(1px); }
    `;
    document.head.appendChild(style);

    // attach copy handlers for the new column
    this.attachCopyHandlers();
  }

  attachCopyHandlers() {
    const buttons = document.querySelectorAll(".copy-title-btn");
    if (!buttons || !buttons.length) return;
    buttons.forEach((btn) => {
      // avoid adding duplicate listeners
      if (btn._copyHandlerAttached) return;
      const handler = async (e) => {
        const title = btn.getAttribute("data-title") || "";
        try {
          await navigator.clipboard.writeText(title);
          const original = btn.textContent;
          btn.textContent = "Copied";
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
          }, 1500);
        } catch (err) {
          // fallback: select and copy
          const textarea = document.createElement("textarea");
          textarea.value = title;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand("copy");
          } catch (e) {
            /* ignore */
          }
          textarea.remove();
        }
      };
      btn.addEventListener("click", handler);
      btn._copyHandlerAttached = true;
    });
  }

  // Refresh only the visible table using currentPosts
  refreshTable() {
    if (!this.currentPosts) return;
    // re-render the table using the current posts (keeps current sorting if updateTableRows was used)
    this.renderTable(this.currentPosts);
  }

  // Export the visible table rows to CSV
  exportCsv() {
    const table = document.getElementById("dataTable");
    if (!table) return;
    // Use the shared CSVExporter if it's available
    if (window.CSVExporter && typeof window.CSVExporter.exportTable === "function") {
      window.CSVExporter.exportTable(table, "medium_stats.csv");
      return;
    }

    // Fallback: build CSV directly and handle both table formats (with or without separate Copy column)
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const csvRows = [];
    csvRows.push(["S/N", "Article Title", "Views", "Reads", "Read Rate", "Earnings"].map((h) => `"${h}"`).join(","));

    rows.forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll("td"));
      if (!cells.length) return;

      // detect if there's a separate copy column (presence of copy button)
      const hasCopyColumn = cells.some((td) => td.querySelector && td.querySelector(".copy-title-btn"));

      // derive indices based on layout
      // layout without copy column: [0]=sn, [1]=title, [2]=views, [3]=reads, [4]=earnings
      // layout with copy column:    [0]=sn, [1]=title, [2]=copy,  [3]=views, [4]=reads, [5]=earnings
      const idx = (name) => {
        if (!hasCopyColumn) {
          return { sn: 0, title: 1, views: 2, reads: 3, earnings: 4 }[name];
        }
        return { sn: 0, title: 1, views: 3, reads: 4, earnings: 5 }[name];
      };

      const sn = (cells[idx("sn")]?.textContent || "").trim();
      const titleCell = cells[idx("title")];
      const title = (titleCell?.querySelector(".title-text")?.textContent || titleCell?.textContent || "").trim();
      const views = (cells[idx("views")]?.textContent || "").trim();
      const readsCell = (cells[idx("reads")]?.textContent || "").trim();
      let reads = readsCell;
      let rate = "";
      const rateMatch = readsCell.match(/\(([^)]+)\)/);
      if (rateMatch) {
        rate = rateMatch[1];
        reads = readsCell.replace(/\s*\([^)]*\)\s*/, "").trim();
      }
      const earnings = (cells[idx("earnings")]?.textContent || "").trim();

      const escapeCell = (text) => {
        if (text === null || text === undefined) return "";
        return String(text).replace(/"/g, "''");
      };

      csvRows.push(
        [
          `"${escapeCell(sn)}""`,
          `"${escapeCell(title)}""`,
          `"${escapeCell(views)}""`,
          `"${escapeCell(reads)}""`,
          `"${escapeCell(rate)}""`,
          `"${escapeCell(earnings)}""`,
        ].join(",")
      );
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medium_stats.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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

  calculateMonthsActive(data) {
    if (!data.length) return 0;
    const dates = data.map((p) => new Date(p.firstPublishedAt)).sort((a, b) => a - b);
    const firstPost = dates[0];
    const now = new Date();
    const diffTime = Math.abs(now - firstPost);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return Math.max(diffMonths, 1);
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
          <td class="copy"><button class="copy-title-btn" data-title="${this.escapeHtml(title)}" aria-label="Copy title">Copy</button></td>
          <td class="number">${this.extension.formatNumber(totalStats?.views)}</td>
          <td class="number">${this.extension.formatNumber(totalStats?.reads)} <small style="color: #6b7280;">(${readRate}%)</small></td>
          <td class="number">${this.formatEarningsForDisplay(post.node)}</td>
        </tr>`;
      })
      .join("");

    tbody.innerHTML = rows;

    // re-attach copy handlers after updating rows
    this.attachCopyHandlers();
  }
}
