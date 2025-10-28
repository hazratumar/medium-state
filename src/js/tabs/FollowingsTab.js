class FollowingsTab {
  constructor(extension) {
    this.extension = extension;
    this.followingData = [];
    this.unfollowAllInProgress = false;
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

    followingsTable.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading following list...</p>
      </div>`;

    try {
      const followingUsers = await this.fetchFollowing();
      this.followingData = followingUsers;
      followingsTable.innerHTML = this.renderFollowingList(followingUsers);
      this.setupUnfollowButtons();
    } catch (error) {
      followingsTable.innerHTML = `
        <div class="error-state">
          <h3>Error loading following list</h3>
          <p>Please try again later.</p>
        </div>`;
    }
  }

  async fetchFollowing() {
    const username = localStorage.getItem("mediumUsername");

    const payload = {
      operationName: "UserFollowingUsersList",
      variables: {
        username: username,
        paging: { from: "0", limit: 25 },
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
      return data?.data?.userResult?.followingUserConnection?.users || [];
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
          <div class="stat-value">${users.length}</div>
          <div class="stat-label">Following</div>
        </div>
        <div class="bulk-controls">
          <button id="unfollowAllBtn" class="btn-danger" style="display: ${users.length === 0 ? "none" : "inline-block"}">Unfollow All</button>
          <button id="refreshBtn" class="btn-primary" style="display: ${users.length === 0 ? "inline-block" : "none"}">Refresh</button>
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
          <tbody>
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

    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.loadFollowings());
    }
  }

  async unfollowUser(targetUserId, button) {
    const payload = [{
      operationName: "UnfollowUserMutation",
      variables: { targetUserId },
      query: `mutation UnfollowUserMutation($targetUserId: ID!) {
        unfollowUser(targetUserId: $targetUserId) {
          __typename
          id
          name
          viewerEdge {
            __typename
            id
            isFollowing
          }
        }
      }`,
    }];

    try {
      button.disabled = true;
      button.classList.add("unfollowing");
      button.textContent = "Unfollowing...";

      const response = await fetch("https://medium.com/_/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data[0]?.data?.unfollowUser) {
        button.classList.remove("unfollowing");
        button.classList.add("unfollowed");
        button.textContent = "Unfollowed";

        const row = button.closest("tr");
        row.classList.add("removing-row");
        await new Promise((resolve) => setTimeout(resolve, 500));
        row.remove();
      } else {
        throw new Error("Unfollow failed");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      button.disabled = false;
      button.classList.remove("unfollowing");
      button.textContent = "Unfollow";
    }
  }

  async startUnfollowAll() {
    if (this.unfollowAllInProgress) return;

    const users = this.followingData.filter((user) => user.__typename === "User");
    if (users.length === 0) return;

    if (!confirm(`Are you sure you want to unfollow all ${users.length} users?`)) {
      return;
    }

    this.unfollowAllInProgress = true;
    const unfollowAllBtn = document.getElementById("unfollowAllBtn");
    const progressContainer = document.getElementById("unfollowProgress");

    unfollowAllBtn.disabled = true;
    unfollowAllBtn.textContent = "Unfollowing All...";
    progressContainer.style.display = "block";

    await this.processUnfollowAll(users);

    this.unfollowAllInProgress = false;
    setTimeout(() => {
      unfollowAllBtn.disabled = false;
      unfollowAllBtn.textContent = "Unfollow All";
      progressContainer.style.display = "none";
    }, 3000);
  }

  async processUnfollowAll(users) {
    const total = users.length;
    let completed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      this.updateProgress(completed, total, `Unfollowing @${user.username}...`);

      try {
        await this.unfollowUserSilent(user.id);
        completed++;
        this.updateProgress(completed, total, `Unfollowed @${user.username}`);

        const row = document.querySelector(`[data-user-id="${user.id}"]`)?.closest("tr");
        if (row) {
          row.classList.add("removing-row");
          setTimeout(() => row.remove(), 500);
        }
      } catch (error) {
        console.error(`Failed to unfollow ${user.username}:`, error);
      }

      if (i < users.length - 1) {
        const delaySeconds = Math.floor(Math.random() * 10) + 1;
        const delayMs = delaySeconds * 1000;
        this.updateProgress(completed, total, `Waiting ${delaySeconds}s before next...`);
        await this.waitWithTimer(delayMs);
      }
    }

    this.updateProgress(completed, total, "Completed!");
  }

  async unfollowUserSilent(targetUserId) {
    const payload = [{
      operationName: "UnfollowUserMutation",
      variables: { targetUserId },
      query: `mutation UnfollowUserMutation($targetUserId: ID!) {
        unfollowUser(targetUserId: $targetUserId) {
          __typename
          id
          name
          viewerEdge {
            __typename
            id
            isFollowing
          }
        }
      }`,
    }];

    const response = await fetch("https://medium.com/_/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data[0]?.data?.unfollowUser) {
      throw new Error("Unfollow failed");
    }
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
    const timerElement = document.getElementById("nextUnfollowTimer");
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
}