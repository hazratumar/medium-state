class FollowersTab {
  constructor(extension) {
    this.extension = extension;
    this.followersData = [];
    this.nextCursor = null;
    this.currentPage = 1;
  }

  render() {
    return `
      <div class="bulk-actions-container">
        <div class="form-group" style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
          <label for="usernameInput" style="width:20%">Medium Username:</label>
          <input type="text" id="usernameInput" placeholder="Enter Medium username" style="width: 50%;" />
          <button id="fetchFollowersBtn" class="btn-primary" style="width: 25%;">Fetch Followers</button>
        </div>
        <div id="followersTable" class="table-container"></div>
      </div>
    `;
  }

  init() {
    this.setupEventListeners();
    this.loadStoredUsername();
  }

  setupEventListeners() {
    const fetchBtn = document.getElementById("fetchFollowersBtn");
    if (fetchBtn) {
      fetchBtn.addEventListener("click", () => this.handleFetchFollowers());
    }
  }

  loadStoredUsername() {
    const usernameInput = document.getElementById("usernameInput");
    const storedUsername = localStorage.getItem("competitor_username");
    if (usernameInput && storedUsername) {
      usernameInput.value = storedUsername;
    }
  }

  handleFetchFollowers() {
    const usernameInput = document.getElementById("usernameInput");
    const username = usernameInput?.value.trim();

    if (!username) {
      alert("Please enter a Competitor username");
      return;
    }

    localStorage.setItem("competitor_username", username);
    this.nextCursor = null;
    this.currentPage = 1;
    this.loadFollowers();
  }

  async loadFollowers() {
    const followersTable = document.getElementById("followersTable");
    if (!followersTable) return;

    const username = localStorage.getItem("competitor_username");
    if (!username) {
      followersTable.innerHTML = `
        <div class="error-state">
          <h3>Enter Username</h3>
          <p>Please enter a Competitor username above and click "Fetch Followers".</p>
        </div>`;
      return;
    }

    followersTable.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading followers list...</p>
      </div>`;

    try {
      const followers = await this.fetchFollowers();
      this.followersData = followers;
      followersTable.innerHTML = this.renderFollowersList(followers);
    } catch (error) {
      followersTable.innerHTML = `
        <div class="error-state">
          <h3>Error loading followers list</h3>
          <p>Please try again later.</p>
        </div>`;
    }
  }

  async fetchFollowers() {
    const username = localStorage.getItem("competitor_username");

    const payload = {
      operationName: "UserFollowers",
      variables: {
        // id: null,
        username: username,
        paging: { from: this.nextCursor || "0", limit: 25 },
      },
      query:
        "query UserFollowers($username: ID, $id: ID, $paging: PagingOptions) {\n  userResult(username: $username, id: $id) {\n    __typename\n    ... on User {\n      id\n      followersUserConnection(paging: $paging) {\n        pagingInfo {\n          next {\n            from\n            limit\n            __typename\n          }\n          __typename\n        }\n        users {\n          ...FollowList_publisher\n          __typename\n        }\n        __typename\n      }\n      ...UserCanonicalizer_user\n      ...FollowersHeader_publisher\n      ...NoFollows_publisher\n      __typename\n    }\n  }\n}\n\nfragment collectionUrl_collection on Collection {\n  id\n  domain\n  slug\n  __typename\n}\n\nfragment CollectionAvatar_collection on Collection {\n  name\n  avatar {\n    id\n    __typename\n  }\n  ...collectionUrl_collection\n  __typename\n  id\n}\n\nfragment SignInOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SignUpOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SusiModal_collection on Collection {\n  name\n  ...SignInOptions_collection\n  ...SignUpOptions_collection\n  __typename\n  id\n}\n\nfragment PublicationFollowButton_collection on Collection {\n  id\n  slug\n  name\n  ...SusiModal_collection\n  __typename\n}\n\nfragment PublicationFollowRow_collection on Collection {\n  __typename\n  id\n  name\n  description\n  ...CollectionAvatar_collection\n  ...PublicationFollowButton_collection\n}\n\nfragment userUrl_user on User {\n  __typename\n  id\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  hasSubdomain\n  username\n}\n\nfragment UserAvatar_user on User {\n  __typename\n  id\n  imageId\n  membership {\n    tier\n    __typename\n    id\n  }\n  name\n  username\n  ...userUrl_user\n}\n\nfragment isUserVerifiedBookAuthor_user on User {\n  verifications {\n    isBookAuthor\n    __typename\n  }\n  __typename\n  id\n}\n\nfragment SignInOptions_user on User {\n  id\n  name\n  imageId\n  __typename\n}\n\nfragment SignUpOptions_user on User {\n  id\n  name\n  imageId\n  __typename\n}\n\nfragment SusiModal_user on User {\n  ...SignInOptions_user\n  ...SignUpOptions_user\n  __typename\n  id\n}\n\nfragment useNewsletterV3Subscription_newsletterV3 on NewsletterV3 {\n  id\n  type\n  slug\n  name\n  collection {\n    slug\n    __typename\n    id\n  }\n  user {\n    id\n    name\n    username\n    newsletterV3 {\n      id\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment useNewsletterV3Subscription_user on User {\n  id\n  username\n  newsletterV3 {\n    ...useNewsletterV3Subscription_newsletterV3\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment useAuthorFollowSubscribeButton_user on User {\n  id\n  name\n  ...useNewsletterV3Subscription_user\n  __typename\n}\n\nfragment useAuthorFollowSubscribeButton_newsletterV3 on NewsletterV3 {\n  id\n  name\n  ...useNewsletterV3Subscription_newsletterV3\n  __typename\n}\n\nfragment AuthorFollowSubscribeButton_user on User {\n  id\n  name\n  imageId\n  ...SusiModal_user\n  ...useAuthorFollowSubscribeButton_user\n  newsletterV3 {\n    id\n    ...useAuthorFollowSubscribeButton_newsletterV3\n    __typename\n  }\n  __typename\n}\n\nfragment UserFollowRow_user on User {\n  __typename\n  id\n  name\n  bio\n  viewerEdge {\n    id\n    isFollowing\n    __typename\n  }\n  ...UserAvatar_user\n  ...isUserVerifiedBookAuthor_user\n  ...AuthorFollowSubscribeButton_user\n}\n\nfragment FollowsHeader_publisher on Publisher {\n  __typename\n  id\n  name\n  ... on Collection {\n    ...collectionUrl_collection\n    __typename\n    id\n  }\n  ... on User {\n    ...userUrl_user\n    __typename\n    id\n  }\n}\n\nfragment FollowList_publisher on Publisher {\n  id\n  ... on Collection {\n    ...PublicationFollowRow_collection\n    __typename\n    id\n  }\n  ... on User {\n    ...UserFollowRow_user\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment UserCanonicalizer_user on User {\n  id\n  username\n  hasSubdomain\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment FollowersHeader_publisher on Publisher {\n  ...FollowsHeader_publisher\n  ... on Collection {\n    subscriberCount\n    __typename\n    id\n  }\n  ... on User {\n    socialStats {\n      followerCount\n      __typename\n    }\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment NoFollows_publisher on Publisher {\n  id\n  name\n  __typename\n}\n",
    };

    try {
      const response = await fetch("https://medium.com/_/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      const connection = data?.data?.userResult?.followersUserConnection;
      const users = connection?.users || [];
      this.nextCursor = connection?.pagingInfo?.next?.from;
      return users;
    } catch (error) {
      console.error("Error fetching followers list:", error);
      return [];
    }
  }

  renderFollowersList(users) {
    if (!users || users.length === 0) {
      return `
        <div class="empty-state">
          <h3>No followers found</h3>
          <p>This user has no followers yet.</p>
        </div>`;
    }

    const userRows = users
      .map((user, index) => {
        const userData = user.__typename === "User" ? user : null;
        if (!userData) return "";

        return `
        <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
          <td class="number">${index + 1}</td>
          <td class="user-info">
            <div class="user-name">${userData.name || "Unknown"}</div>
          </td>
          <td class="user-info">
            <div class="user-username">@${userData.username || "unknown"}</div>
          </td>
          <td class="user-info">
            <button class="btn-primary follow-btn ${userData.membership ? "member-btn" : ""}" data-user-id="${
          userData?.newsletterV3?.id
        }" data-user-real-id="${userData.id}" style="${
          userData.membership ? "background: linear-gradient(135deg, #ffd700, #ffed4e); color: #333;" : ""
        }">Follow</button>
          </td>
        </tr>`;
      })
      .join("");

    const html = `
      <div class="following-summary">
        <div class="stat-card">
          <div class="stat-value">${users.length}</div>
          <div class="stat-label">Followers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${this.currentPage}</div>
          <div class="stat-label">Page</div>
        </div>
        <div class="bulk-controls">
          <button id="followAllBtn" class="btn-primary">Follow All</button>
          <button id="skipPageBtn" class="btn-secondary">Skip Page</button>
        </div>
      </div>
      <div id="followProgress" class="progress-container" style="display: none;">
        <div class="progress-info">
          <span id="progressStatus">Starting...</span>
          <span id="progressCount">0 / 0</span>
        </div>
        <div class="progress-bar">
          <div id="progressFill" class="progress-fill"></div>
        </div>
        <div class="progress-details">
          <div>Remaining: <span id="remainingCount">0</span></div>
          <div>Next follow in: <span id="nextFollowTimer">--</span></div>
        </div>
      </div>
      <div class="table-container">
        <table id="followersDataTable">
          <thead>
            <tr>
              <th>S/N</th>
              <th>Name</th>
              <th>Username</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${userRows}
          </tbody>
        </table>
      </div>`;

    setTimeout(() => {
      this.setupFollowButtons();
      this.setupFollowAllButton();
      this.setupSkipPageButton();
    }, 100);
    return html;
  }

  setupFollowButtons() {
    const followBtns = document.querySelectorAll(".follow-btn");
    followBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFollowUser(e));
    });
  }

  setupFollowAllButton() {
    const followAllBtn = document.getElementById("followAllBtn");
    if (followAllBtn) {
      followAllBtn.addEventListener("click", () => this.handleFollowAll());
    }
  }

  getLastUserId() {
    const rows = document.querySelectorAll("#followersDataTable tbody tr");
    if (rows.length === 0) return null;
    const lastRow = rows[rows.length - 1];
    const followBtn = lastRow.querySelector(".follow-btn");
    return followBtn?.dataset.userRealId || null;
  }

  setupSkipPageButton() {
    const skipPageBtn = document.getElementById("skipPageBtn");
    if (skipPageBtn) {
      skipPageBtn.addEventListener("click", async () => {
        const lastUserId = this.getLastUserId();
        this.nextCursor = lastUserId;
        this.currentPage++;
        await this.loadFollowers();
      });
    }
  }

  async handleFollowAll() {
    const followAllBtn = document.getElementById("followAllBtn");
    const memberBtns = document.querySelectorAll(".follow-btn.member-btn:not(.btn-success)");

    if (memberBtns.length === 0) {
      alert("No member users to follow");
      return;
    }

    const progressContainer = document.getElementById("followProgress");
    followAllBtn.disabled = true;
    followAllBtn.textContent = "Following Members...";
    progressContainer.style.display = "block";

    const total = memberBtns.length;
    let completed = 0;
    let skipped = 0;

    for (let i = 0; i < memberBtns.length; i++) {
      const btn = memberBtns[i];
      const newsletterV3Id = btn.dataset.userId;
      if (!newsletterV3Id) {
        skipped++;
        continue;
      }

      const username = btn.closest("tr").querySelector(".user-username").textContent;
      this.updateProgress(completed, total, `Following ${username}...`);

      btn.disabled = true;
      btn.textContent = "Following...";

      try {
        await this.followUser(newsletterV3Id);
        btn.textContent = "Followed";
        btn.classList.add("btn-success");
        completed++;
        this.updateProgress(completed, total, `Followed ${username}`);
      } catch (error) {
        btn.textContent = "Failed";
        btn.disabled = false;
        skipped++;
      }

      if (i < memberBtns.length - 1) {
        const delaySeconds = Math.floor(Math.random() * 3) + 1;
        const delayMs = delaySeconds * 1000;
        this.updateProgress(completed, total, `Waiting ${delaySeconds}s before next...`);
        await this.waitWithTimer(delayMs);
      }
    }

    this.updateProgress(completed, total, "Completed!");
    followAllBtn.textContent = `Followed ${completed} members`;
    followAllBtn.disabled = true;
    const skipPageBtn = document.getElementById("skipPageBtn");
    if (skipPageBtn) skipPageBtn.textContent = "Next Page";
    setTimeout(() => {
      progressContainer.style.display = "none";
    }, 3000);
  }

  updateProgress(completed, total, status) {
    const progressStatus = document.getElementById("progressStatus");
    const progressCount = document.getElementById("progressCount");
    const progressFill = document.getElementById("progressFill");
    const remainingCount = document.getElementById("remainingCount");

    if (progressStatus) progressStatus.textContent = status;
    if (progressCount) progressCount.textContent = `${completed} / ${total}`;
    if (remainingCount) remainingCount.textContent = total - completed;
    if (progressFill) {
      const percentage = (completed / total) * 100;
      progressFill.style.width = `${percentage}%`;
    }
  }

  async waitWithTimer(delayMs) {
    const timerElement = document.getElementById("nextFollowTimer");
    let remainingMs = delayMs;

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const seconds = Math.ceil(remainingMs / 1000);

        if (timerElement) {
          timerElement.textContent = `${seconds}s`;
        }

        remainingMs -= 100;

        if (remainingMs <= 0) {
          clearInterval(interval);
          if (timerElement) timerElement.textContent = "--";
          resolve();
        }
      }, 100);
    });
  }

  async handleFollowUser(event) {
    const btn = event.target;
    const newsletterV3Id = btn.dataset.userId;

    btn.disabled = true;
    btn.textContent = "Following...";

    try {
      await this.followUser(newsletterV3Id);
      btn.textContent = "Followed";
      btn.classList.add("btn-success");
    } catch (error) {
      btn.textContent = "Follow";
      btn.disabled = false;
      alert("Failed to follow user");
    }
  }

  async followUser(newsletterV3Id) {
    const payload = {
      operationName: "SubscribeNewsletterV3Mutation",
      variables: { newsletterV3Id, shouldRecordConsent: false },
      query:
        "mutation SubscribeNewsletterV3Mutation($newsletterV3Id: ID!, $shouldRecordConsent: Boolean) {\n  subscribeNewsletterV3(\n    newsletterV3Id: $newsletterV3Id\n    shouldRecordConsent: $shouldRecordConsent\n  )\n}\n",
    };

    const response = await fetch("https://medium.com/_/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Follow failed");
    return response.json();
  }
}
