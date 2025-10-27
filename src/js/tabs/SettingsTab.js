class SettingsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
  }

  render() {
    return `
      <div class="settings-form">
        <div class="form-group">
          <label for="first">Articles to fetch</label>
          <input id="first" type="number" value="1000" min="1" max="1000" placeholder="Max 1000" />
          <small>Maximum number of articles to load</small>
        </div>
        <div class="form-group">
          <label for="after">Pagination cursor</label>
          <input id="after" type="text" placeholder="Leave empty for first page" />
          <small>For loading additional pages of results</small>
        </div>
        <div class="form-group">
          <label for="filter">Content filter</label>
          <select id="filter">
            <option value="true">Published Articles Only</option>
            <option value="false">All Posts (Including Drafts)</option>
          </select>
        </div>
      </div>
    `;
  }

  init() {
    // Settings tab doesn't need specific initialization
  }
}