class SettingsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
  }

  render() {
    const savedUsername = localStorage.getItem("mediumUsername") || "";
    const savedFirst = localStorage.getItem("mediumFirst") || "1000";
    const savedAfter = localStorage.getItem("mediumAfter") || "";
    const savedFilter = localStorage.getItem("mediumFilter") || "true";
    return `
      <div class="settings-form">
        <div class="form-group">
          <label for="mediumUsername">Medium Username</label>
          <input id="mediumUsername" type="text" value="${savedUsername}" placeholder="Enter your Medium username" required />
          <small>Username to fetch data for (e.g., codebyumar)</small>
        </div>
        <div class="form-group">
          <label for="first">Articles to fetch</label>
          <input id="first" type="number" value="${savedFirst}" min="1" max="1000" placeholder="Max 1000" />
          <small>Maximum number of articles to load</small>
        </div>
        <div class="form-group">
          <label for="after">Pagination cursor</label>
          <input id="after" type="text" value="${savedAfter}" placeholder="Leave empty for first page" />
          <small>For loading additional pages of results</small>
        </div>
        <div class="form-group">
          <label for="filter">Content filter</label>
          <select id="filter">
            <option value="true" ${savedFilter === "true" ? "selected" : ""}>Published Articles Only</option>
            <option value="false" ${savedFilter === "false" ? "selected" : ""}>All Posts (Including Drafts)</option>
          </select>
        </div>
        <div class="form-group">
          <button id="saveSettings" class="btn-primary" style="margin-top: 20px;">Save Settings</button>
        </div>
      </div>
    `;
  }

  init() {
    const saveBtn = document.getElementById("saveSettings");

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const username = document.getElementById("mediumUsername").value.trim();
        const first = document.getElementById("first").value;
        const after = document.getElementById("after").value;
        const filter = document.getElementById("filter").value;

        if (username) {
          localStorage.setItem("mediumUsername", username);
          localStorage.setItem("mediumFirst", first);
          localStorage.setItem("mediumAfter", after);
          localStorage.setItem("mediumFilter", filter);
          this.extension.showStatus("Settings saved successfully", "success");
        } else {
          this.extension.showStatus("Please enter a valid username", "error");
        }
      });
    }
  }
}
