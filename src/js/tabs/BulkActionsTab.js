class BulkActionsTab {
  constructor(extension) {
    this.extension = extension;
    this.followingData = [];
    this.unfollowAllInProgress = false;
  }

  render() {
    return `
      <div class="bulk-actions-container">
        <h3>Bulk Actions</h3>
        <div class="inner-tabs">
          <button class="inner-tab-button active" data-inner-tab="followers">Followers</button>
          <button class="inner-tab-button" data-inner-tab="followings">Followings</button>
        </div>
        <div class="inner-tab-content">
          <div id="followers-inner" class="inner-tab-panel active">
            <p>Manage your followers</p>
            <div id="followersTable" class="table-container"></div>
          </div>
          <div id="followings-inner" class="inner-tab-panel">
            <div id="followingsTable" class="table-container"></div>
          </div>
        </div>
      </div>
    `;
  }

  init() {
    this.setupInnerTabs();
    this.loadFollowers();
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
    // Remove active class from all inner tab buttons and panels
    document.querySelectorAll(".inner-tab-button").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".inner-tab-panel").forEach((panel) => panel.classList.remove("active"));

    // Add active class to clicked button and corresponding panel
    document.querySelector(`[data-inner-tab="${tabName}"]`).classList.add("active");
    document.getElementById(`${tabName}-inner`).classList.add("active");

    // Load content based on selected tab
    if (tabName === "followers") {
      this.loadFollowers();
    } else if (tabName === "followings") {
      this.loadFollowings();
    }
  }

  loadFollowers() {
    const followersTable = document.getElementById("followersTable");
    if (followersTable) {
      followersTable.innerHTML = "<p>Loading followers...</p>";
      // TODO: Implement followers loading logic
    }
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
        // id: "11e248f1d5e7",
        username: username,
        paging: { from: "1761544140400", limit: 25 },
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

      fragment collectionUrl_collection on Collection {
        id
        domain
        slug
        __typename
      }

      fragment CollectionAvatar_collection on Collection {
        name
        avatar {
          id
          __typename
        }
        ...collectionUrl_collection
        __typename
        id
      }

      fragment SignInOptions_collection on Collection {
        id
        name
        __typename
      }

      fragment SignUpOptions_collection on Collection {
        id
        name
        __typename
      }

      fragment SusiModal_collection on Collection {
        name
        ...SignInOptions_collection
        ...SignUpOptions_collection
        __typename
        id
      }

      fragment PublicationFollowButton_collection on Collection {
        id
        slug
        name
        ...SusiModal_collection
        __typename
      }

      fragment PublicationFollowRow_collection on Collection {
        __typename
        id
        name
        description
        ...CollectionAvatar_collection
        ...PublicationFollowButton_collection
      }

      fragment userUrl_user on User {
        __typename
        id
        customDomainState {
          live {
            domain
            __typename
          }
          __typename
        }
        hasSubdomain
        username
      }

      fragment UserAvatar_user on User {
        __typename
        id
        imageId
        membership {
          tier
          __typename
          id
        }
        name
        username
        ...userUrl_user
      }

      fragment isUserVerifiedBookAuthor_user on User {
        verifications {
          isBookAuthor
          __typename
        }
        __typename
        id
      }

      fragment SignInOptions_user on User {
        id
        name
        imageId
        __typename
      }

      fragment SignUpOptions_user on User {
        id
        name
        imageId
        __typename
      }

      fragment SusiModal_user on User {
        ...SignInOptions_user
        ...SignUpOptions_user
        __typename
        id
      }

      fragment useNewsletterV3Subscription_newsletterV3 on NewsletterV3 {
        id
        type
        slug
        name
        collection {
          slug
          __typename
          id
        }
        user {
          id
          name
          username
          newsletterV3 {
            id
            __typename
          }
          __typename
        }
        __typename
      }

      fragment useNewsletterV3Subscription_user on User {
        id
        username
        newsletterV3 {
          ...useNewsletterV3Subscription_newsletterV3
          __typename
          id
        }
        __typename
      }

      fragment useAuthorFollowSubscribeButton_user on User {
        id
        name
        ...useNewsletterV3Subscription_user
        __typename
      }

      fragment useAuthorFollowSubscribeButton_newsletterV3 on NewsletterV3 {
        id
        name
        ...useNewsletterV3Subscription_newsletterV3
        __typename
      }

      fragment AuthorFollowSubscribeButton_user on User {
        id
        name
        imageId
        ...SusiModal_user
        ...useAuthorFollowSubscribeButton_user
        newsletterV3 {
          id
          ...useAuthorFollowSubscribeButton_newsletterV3
          __typename
        }
        __typename
      }

      fragment UserFollowRow_user on User {
        __typename
        id
        name
        bio
        ...UserAvatar_user
        ...isUserVerifiedBookAuthor_user
        ...AuthorFollowSubscribeButton_user
      }

      fragment FollowList_publisher on Publisher {
        id
        ... on Collection {
          ...PublicationFollowRow_collection
          __typename
          id
        }
        ... on User {
          ...UserFollowRow_user
          __typename
          id
        }
        __typename
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
          <button id="unfollowAllBtn" class="btn-danger">Unfollow All</button>
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
  }

  async unfollowUser(targetUserId, button) {
    const payload = [
      {
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
      },
    ];

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

      // Show error toast instead of alert
      const toast = document.createElement("div");
      toast.className = "error-toast";
      toast.textContent = "Failed to unfollow user. Please try again.";
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 3000);
    }
  }

  async startUnfollowAll() {
    if (this.unfollowAllInProgress) return;

    const users = this.followingData.filter((user) => user.__typename === "User");
    if (users.length === 0) {
      alert("No users to unfollow");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to unfollow all ${users.length} users? The process will unfollow each user with random 1-10 second delays between actions.`
      )
    ) {
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
      progressContainer.classList.remove("completed");
    }, 3000);
  }

  async processUnfollowAll(users) {
    const total = users.length;
    let completed = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      this.updateProgress(completed, total, `Unfollowing @${user.username}...`);

      let success = false;
      let retries = 0;
      const maxRetries = 3;

      while (!success && retries < maxRetries) {
        try {
          await this.unfollowUserSilent(user.id);
          success = true;
          completed++;
          this.updateProgress(completed, total, `Unfollowed @${user.username}`);

          // Remove row from table with animation
          const row = document.querySelector(`[data-user-id="${user.id}"]`)?.closest("tr");
          if (row) {
            row.classList.add("removing-row");
            setTimeout(() => row.remove(), 500);
          }
        } catch (error) {
          retries++;
          console.error(`Failed to unfollow ${user.username} (attempt ${retries}):`, error);

          if (retries < maxRetries) {
            this.updateProgress(completed, total, `Retrying @${user.username} (${retries}/${maxRetries})...`);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
          } else {
            this.updateProgress(completed, total, `Failed to unfollow @${user.username}`);
          }
        }
      }

      // Wait random delay between 1-10 seconds (except for last user)
      if (i < users.length - 1) {
        const delaySeconds = Math.floor(Math.random() * 10) + 1;
        const delayMs = delaySeconds * 1000;
        this.updateProgress(completed, total, `Waiting ${delaySeconds}s before next...`);
        await this.waitWithTimer(delayMs);
      }
    }

    this.updateProgress(completed, total, "Completed!");
    document.getElementById("unfollowProgress").classList.add("completed");
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
          name
          viewerEdge {
            __typename
            id
            isFollowing
          }
        }
      }`,
      },
    ];

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
