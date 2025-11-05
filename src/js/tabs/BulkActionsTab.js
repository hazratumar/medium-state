class BulkActionsTab {
  constructor(extension) {
    this.extension = extension;
    this.followersTab = new FollowersTab(extension);
    this.followingsTab = new FollowingsTab(extension);
  }

  render() {
    return `
      <div class="bulk-actions-container">
        <div class="inner-tabs">
          <button class="inner-tab-button active" data-inner-tab="followers">Followers</button>
          <button class="inner-tab-button" data-inner-tab="followings">Followings</button>
        </div>
        <div class="inner-tab-content">
          <div id="followers-inner" class="inner-tab-panel active">
            ${this.followersTab.render()}
          </div>
          <div id="followings-inner" class="inner-tab-panel">
            ${this.followingsTab.render()}
          </div>
        </div>
      </div>
    `;
  }

  init() {
    this.setupInnerTabs();
    this.followersTab.init();
  }

  setupInnerTabs() {
    const innerTabButtons = document.querySelectorAll(".inner-tab-button");
    innerTabButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const targetTab = e.target.dataset.innerTab;
        this.switchInnerTab(targetTab);
      });
    });
  }

  switchInnerTab(tabName) {
    document.querySelectorAll(".inner-tab-button").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".inner-tab-panel").forEach((panel) => panel.classList.remove("active"));

    document.querySelector(`[data-inner-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}-inner`).classList.add("active");

    if (tabName === "followers") {
      this.followersTab.init();
    } else if (tabName === "followings") {
      this.followingsTab.init();
    }
  }
}
