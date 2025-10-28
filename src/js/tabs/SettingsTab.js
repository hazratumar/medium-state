class SettingsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
  }

  render() {
    const savedSelfUsername = localStorage.getItem("self_username") || "";
    const savedUsername = localStorage.getItem("competitor_username") || "";
    const savedFirst = localStorage.getItem("limit") || "1000";
    return `
      <div class="settings-form">
        <div class="form-group">
          <label for="self_username">Self Username</label>
          <input id="self_username" type="text" value="${savedSelfUsername}" placeholder="Enter your self username" />
          <small>Your personal username identifier</small>
        </div>  
        <div class="form-group">
          <label for="competitor_username">Medium Username</label>
          <input id="competitor_username" type="text" value="${savedUsername}" placeholder="Enter your Medium username" required />
          <small>Competitor Username to fetch data for (e.g., codebyumar)</small>
        </div>
        <div class="form-group">
          <label for="first">Articles to fetch</label>
          <input id="first" type="number" value="${savedFirst}" min="1" max="1000" placeholder="Max 1000" />
          <small>Maximum number of articles to load</small>
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
        const selfUsername = document.getElementById("self_username").value.trim();
        const username = document.getElementById("competitor_username").value.trim();
        const first = document.getElementById("first").value;

        if (username) {
          localStorage.setItem("self_username", selfUsername);
          localStorage.setItem("competitor_username", username);
          localStorage.setItem("limit", first);
          this.extension.showStatus("Settings saved successfully", "success");
        } else {
          this.extension.showStatus("Please enter a valid username", "error");
        }
      });
    }
  }
}
