class StatsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
  }

  render() {
    return `
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
        this.extension.sortTable();
      });
    }

    const refreshBtn = document.getElementById("refreshStats");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this.extension.handleApiCall();
      });
    }
  }
}
