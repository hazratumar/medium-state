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
            <option value="earnings-desc">Highest Earnings</option>
            <option value="earnings-asc">Lowest Earnings</option>
          </select>
        </div>
      </div>
      <div id="status" class="status"></div>
      <div id="table" class="table-container"></div>
    `;
  }

  init() {
    const orderBy = document.getElementById('orderBy');
    if (orderBy) {
      orderBy.addEventListener('change', () => this.extension.handleApiCall());
    }
  }
}