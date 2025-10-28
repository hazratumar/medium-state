class FollowingsTab {
  constructor(extension) {
    this.extension = extension;
    this.followingData = [];
    this.unfollowAllInProgress = false;
    this.nextPagingFrom = "0";
    this.hasMoreFollowing = true;
    this.autoUnfollowMode = false;
  }

  render() {
    return `
      <div class="bulk-actions-container">
        <h3>Following Management</h3>
        <div id="followingsTable" class="table-container"></div>
      </div>
    `;
  }

  init() {
    this.loadFollowings();
  }

  async loadFollowings() {
    const followingsTable = document.getElementById("followingsTable");
    if (!followingsTable) return;

    const username = localStorage.getItem("mediumUsername");
    if (!username) {
      followingsTable.innerHTML = `
        <div class="error-state">
          <h3>Unable to Load Following List</h3>
          <p>Your Medium username is missing. Please set it in the settings and try again.</p>
        </div>`;
      return;
    }

    this.showLoadingState(followingsTable);

    try {
      this.nextPagingFrom = "0";
      this.followingData = [];
      const followingUsers = await this.fetchFollowing();
      this.followingData = followingUsers;
      followingsTable.innerHTML = this.renderFollowingList(followingUsers);
      this.setupUnfollowButtons();
    } catch (error) {
      this.showErrorState(followingsTable, "Error loading following list");
    }
  }

  showLoadingState(container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading following list...</p>
      </div>`;
  }

  showErrorState(container, message) {
    container.innerHTML = `
      <div class="error-state">
        <h3>${message}</h3>
        <p>Please try again later.</p>
      </div>`;
  }

  async fetchFollowing() {
    const username = localStorage.getItem("mediumUsername");

    const payload = {
      operationName: "UserFollowingUsersList",
      variables: {
        username: username,
        paging: { from: this.nextPagingFrom, limit: 25 },
      },
      query: `query UserFollowingUsersList($username: ID, $id: ID, $paging: PagingOptions) {
        userResult(username: $username, id: $id) {
          __typename
          ... on User {
            id
            followingUserConnection(paging: $paging) {
              pagingInfo {
                next {
                  from
                  limit
                  __typename
                }
                __typename
              }
              users {
                ...FollowList_publisher
                __typename
              }
              __typename
            }
            __typename
          }
        }
      }

      fragment FollowList_publisher on Publisher {
        id
        ... on User {
          ...UserFollowRow_user
          __typename
          id
        }
        __typename
      }

      fragment UserFollowRow_user on User {
        __typename
        id
        name
        bio
        username
        imageId
      }`,
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
      const connection = data?.data?.userResult?.followingUserConnection;
      const users = connection?.users || [];

      this.nextPagingFrom = connection?.pagingInfo?.next?.from || null;
      this.hasMoreFollowing = !!this.nextPagingFrom;

      return users;
    } catch (error) {
      console.error("Error fetching following list:", error);
      return [];
    }
  }

  renderFollowingList(users) {
    if (!users || users.length === 0) {
      return `
        <div class="empty-state">
          <h3>No following found</h3>
          <p>This user is not following anyone yet.</p>
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
            <button class="unfollow-button" data-user-id="${userData.id}">Unfollow</button>
          </td>
        </tr>`;
      })
      .join("");

    return `
      <div class="following-summary">
        <div class="stat-card">
          <div class="stat-value">${this.followingData.length}</div>
          <div class="stat-label">Following</div>
        </div>
        <div class="bulk-controls">
          <button id="unfollowAllBtn" class="btn-danger" style="display: ${users.length === 0 ? "none" : "inline-block"}">Unfollow All</button>
          <button id="loadMoreBtn" class="btn-primary" style="display: ${this.hasMoreFollowing ? "inline-block" : "none"}">Load More</button>
        </div>
      </div>
      <div id="unfollowProgress" class="progress-container" style="display: none;">
        <div class="progress-info">
          <span id="progressStatus">Starting...</span>
          <span id="progressCount">0 / 0</span>
        </div>
        <div class="progress-bar">
          <div id="progressFill" class="progress-fill"></div>
        </div>
        <div class="progress-details">
          <div>Remaining: <span id="remainingCount">0</span></div>
          <div>Next unfollow in: <span id="nextUnfollowTimer">--</span></div>
        </div>
      </div>
      <div class="table-container">
        <table id="followingTable">
          <thead>
            <tr>
              <th>S/N</th>
              <th>User</th>
              <th>Username</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="followingTableBody">
            ${userRows}
          </tbody>
        </table>
      </div>`;
  }

  setupUnfollowButtons() {
    const unfollowButtons = document.querySelectorAll(".unfollow-button");
    unfollowButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const userId = e.target.dataset.userId;
        this.unfollowUser(userId, e.target);
      });
    });

    const unfollowAllBtn = document.getElementById("unfollowAllBtn");
    if (unfollowAllBtn) {
      unfollowAllBtn.addEventListener("click", () => this.startUnfollowAll());
    }

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", () => this.loadMoreFollowing());
    }
  }

  async unfollowUser(targetUserId, button) {
    if (button.disabled) return;

    const originalText = button.textContent;
    try {
      button.disabled = true;
      button.classList.add("unfollowing");
      button.textContent = "Unfollowing...";

      await this.unfollowUserSilent(targetUserId);

      button.classList.remove("unfollowing");
      button.classList.add("unfollowed");
      button.textContent = "Unfollowed";

      this.updateFollowingCount(-1);

      const row = button.closest("tr");
      row.style.transition = "opacity 0.3s ease";
      row.style.opacity = "0";
      setTimeout(() => row.remove(), 300);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      button.disabled = false;
      button.classList.remove("unfollowing");
      button.textContent = originalText;
    }
  }

  updateFollowingCount(delta) {
    const statValue = document.querySelector(".stat-value");
    if (statValue) {
      const current = parseInt(statValue.textContent) || 0;
      statValue.textContent = Math.max(0, current + delta);
    }
  }

  async startUnfollowAll() {
    if (this.unfollowAllInProgress) return;

    const users = this.followingData.filter((user) => user.__typename === "User");
    if (users.length === 0) return;

    this.unfollowAllInProgress = true;
    this.autoUnfollowMode = true;
    const unfollowAllBtn = document.getElementById("unfollowAllBtn");
    const progressContainer = document.getElementById("unfollowProgress");

    unfollowAllBtn.disabled = true;
    unfollowAllBtn.textContent = "Auto Unfollowing...";
    progressContainer.style.display = "block";

    await this.processUnfollowAll(users);

    this.unfollowAllInProgress = false;
    if (!this.autoUnfollowMode) {
      setTimeout(() => {
        unfollowAllBtn.disabled = false;
        unfollowAllBtn.textContent = "Unfollow All";
        progressContainer.style.display = "none";
      }, 3000);
    }
  }

  async loadMoreFollowing() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (!this.hasMoreFollowing || !loadMoreBtn || loadMoreBtn.disabled) return;

    const originalText = loadMoreBtn.textContent;
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = "Loading...";

    try {
      const newUsers = await this.fetchFollowing();
      if (newUsers.length === 0) {
        this.hasMoreFollowing = false;
        loadMoreBtn.style.display = "none";
        return;
      }

      this.followingData = [...this.followingData, ...newUsers];
      this.appendNewRows(newUsers);
      this.updateFollowingCount(newUsers.length);
    } catch (error) {
      console.error("Error loading more following:", error);
    } finally {
      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = originalText;
      loadMoreBtn.style.display = this.hasMoreFollowing ? "inline-block" : "none";
    }
  }

  appendNewRows(newUsers) {
    const tableBody = document.getElementById("followingTableBody");
    if (!tableBody) return;

    const startIndex = this.followingData.length - newUsers.length;
    const fragment = document.createDocumentFragment();

    newUsers.forEach((user, index) => {
      const userData = user.__typename === "User" ? user : null;
      if (!userData) return;

      const row = document.createElement("tr");
      row.style.opacity = "0";
      row.style.transform = "translateY(20px)";
      row.style.transition = "all 0.3s ease";
      row.innerHTML = `
        <td class="number">${startIndex + index + 1}</td>
        <td class="user-info">
          <div class="user-name">${userData.name || "Unknown"}</div>
        </td>
        <td class="user-info">
          <div class="user-username">@${userData.username || "unknown"}</div>
        </td>
        <td class="user-info">
          <button class="unfollow-button" data-user-id="${userData.id}">Unfollow</button>
        </td>`;

      const button = row.querySelector(".unfollow-button");
      button.addEventListener("click", (e) => {
        this.unfollowUser(userData.id, e.target);
      });

      fragment.appendChild(row);

      setTimeout(() => {
        row.style.opacity = "1";
        row.style.transform = "translateY(0)";
      }, index * 50);
    });

    tableBody.appendChild(fragment);
  }

  async processUnfollowAll(users) {
    const total = users.length;
    let completed = 0;
    const progressFill = document.getElementById("progressFill");
    const progressStatus = document.getElementById("progressStatus");
    const progressCount = document.getElementById("progressCount");
    const remainingCount = document.getElementById("remainingCount");
    const timerDisplay = document.getElementById("nextUnfollowTimer");

    for (let i = 0; i < users.length; i++) {
      if (!this.autoUnfollowMode) break;

      const user = users[i];
      const currentTotal = users.length - 1;
      const remaining = currentTotal - completed;

      progressStatus.textContent = `Unfollowing ${user.name || user.username}...`;
      progressCount.textContent = `${completed} / ${currentTotal}`;
      remainingCount.textContent = remaining;

      // Auto load more when remaining reaches 0
      if (remaining <= 3 && this.hasMoreFollowing && this.autoUnfollowMode) {
        progressStatus.textContent = "Loading more users...";
        await this.loadMoreFollowing();
        const newUsers = this.followingData.filter((u) => u.__typename === "User").slice(users.length);
        if (newUsers.length > 0) {
          users.push(...newUsers);
        }
      }

      try {
        const button = document.querySelector(`button[data-user-id="${user.id}"]`);
        if (button) {
          button.disabled = true;
          button.classList.add("unfollowing");
          button.textContent = "Unfollowing...";
        }

        await this.unfollowUserSilent(user.id);
        completed++;

        const currentTotal = users.length;
        const percentage = (completed / currentTotal) * 100;
        progressFill.style.width = `${percentage}%`;
        progressCount.textContent = `${completed} / ${currentTotal}`;

        if (button) {
          button.classList.remove("unfollowing");
          button.classList.add("unfollowed");
          button.textContent = "Unfollowed";

          const row = button.closest("tr");
          if (row) {
            row.style.transition = "opacity 0.3s ease";
            row.style.opacity = "0";
            setTimeout(() => row.remove(), 300);
          }
        }

        if (i < users.length - 1) {
          const delay = 2000 + Math.random() * 1000;
          await this.countdown(delay, timerDisplay);
        }
      } catch (error) {
        console.error(`Failed to unfollow ${user.username}:`, error);
      }
    }

    progressStatus.textContent = this.autoUnfollowMode ? "Completed!" : "Stopped";
    progressFill.style.width = "100%";
    remainingCount.textContent = "0";
    timerDisplay.textContent = "--";

    if (this.autoUnfollowMode) {
      await this.loadMoreAndContinue();
    }
  }

  async loadMoreAndContinue() {
    if (!this.hasMoreFollowing || !this.autoUnfollowMode) {
      this.autoUnfollowMode = false;
      document.getElementById("progressStatus").textContent = "All users unfollowed!";
      setTimeout(() => this.loadFollowings(), 2000);
      return;
    }

    document.getElementById("progressStatus").textContent = "Loading more users...";
    const moreUsers = await this.fetchFollowing();

    if (moreUsers.length > 0) {
      this.followingData = moreUsers;
      await this.processUnfollowAll(moreUsers);
    } else {
      this.autoUnfollowMode = false;
      document.getElementById("progressStatus").textContent = "All users unfollowed!";
      setTimeout(() => this.loadFollowings(), 2000);
    }
  }

  async unfollowUserSilent(targetUserId) {
    const payload = [
      {
        operationName: "UnfollowUserMutation",
        variables: { targetUserId },
        query: `mutation UnfollowUserMutation($targetUserId: ID!) {
        unfollowUser(targetUserId: $targetUserId) {
          __typename
          id
          viewerEdge {
            __typename
            isFollowing
          }
        }
      }`,
      },
    ];

    const response = await fetch("https://medium.com/_/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data[0]?.data?.unfollowUser) throw new Error("Unfollow failed");
  }

  countdown(ms, element) {
    return new Promise((resolve) => {
      const endTime = Date.now() + ms;
      const interval = setInterval(() => {
        if (!this.autoUnfollowMode) {
          clearInterval(interval);
          resolve();
          return;
        }
        const remaining = Math.ceil((endTime - Date.now()) / 1000);
        if (remaining < 0) {
          clearInterval(interval);
          resolve();
        } else {
          element.textContent = `${remaining}s`;
        }
      }, 100);
    });
  }
}
