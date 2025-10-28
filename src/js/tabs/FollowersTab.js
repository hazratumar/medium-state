class FollowersTab {
  constructor(extension) {
    this.extension = extension;
    this.followersData = [];
  }

  render() {
    return `
      <div class="bulk-actions-container">
        <h3>Followers Management</h3>
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
    const storedUsername = localStorage.getItem("mediumUsername");
    if (usernameInput && storedUsername) {
      usernameInput.value = storedUsername;
    }
  }

  handleFetchFollowers() {
    const usernameInput = document.getElementById("usernameInput");
    const username = usernameInput?.value.trim();

    if (!username) {
      alert("Please enter a Medium username");
      return;
    }

    localStorage.setItem("mediumUsername", username);
    this.loadFollowers();
  }

  async loadFollowers() {
    const followersTable = document.getElementById("followersTable");
    if (!followersTable) return;

    const username = localStorage.getItem("mediumUsername");
    if (!username) {
      followersTable.innerHTML = `
        <div class="error-state">
          <h3>Enter Username</h3>
          <p>Please enter a Medium username above and click "Fetch User Followers".</p>
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
    const username = localStorage.getItem("mediumUsername");

    const payload = {
      operationName: "UserFollowers",
      variables: {
        // id: null,
        username: username,
        paging: { from: "0", limit: 25 },
      },
      query:
        "query UserFollowers($username: ID, $id: ID, $paging: PagingOptions) {\n  userResult(username: $username, id: $id) {\n    __typename\n    ... on User {\n      id\n      followersUserConnection(paging: $paging) {\n        pagingInfo {\n          next {\n            from\n            limit\n            __typename\n          }\n          __typename\n        }\n        users {\n          ...FollowList_publisher\n          __typename\n        }\n        __typename\n      }\n      ...UserCanonicalizer_user\n      ...FollowersHeader_publisher\n      ...NoFollows_publisher\n      __typename\n    }\n  }\n}\n\nfragment collectionUrl_collection on Collection {\n  id\n  domain\n  slug\n  __typename\n}\n\nfragment CollectionAvatar_collection on Collection {\n  name\n  avatar {\n    id\n    __typename\n  }\n  ...collectionUrl_collection\n  __typename\n  id\n}\n\nfragment SignInOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SignUpOptions_collection on Collection {\n  id\n  name\n  __typename\n}\n\nfragment SusiModal_collection on Collection {\n  name\n  ...SignInOptions_collection\n  ...SignUpOptions_collection\n  __typename\n  id\n}\n\nfragment PublicationFollowButton_collection on Collection {\n  id\n  slug\n  name\n  ...SusiModal_collection\n  __typename\n}\n\nfragment PublicationFollowRow_collection on Collection {\n  __typename\n  id\n  name\n  description\n  ...CollectionAvatar_collection\n  ...PublicationFollowButton_collection\n}\n\nfragment userUrl_user on User {\n  __typename\n  id\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  hasSubdomain\n  username\n}\n\nfragment UserAvatar_user on User {\n  __typename\n  id\n  imageId\n  membership {\n    tier\n    __typename\n    id\n  }\n  name\n  username\n  ...userUrl_user\n}\n\nfragment isUserVerifiedBookAuthor_user on User {\n  verifications {\n    isBookAuthor\n    __typename\n  }\n  __typename\n  id\n}\n\nfragment SignInOptions_user on User {\n  id\n  name\n  imageId\n  __typename\n}\n\nfragment SignUpOptions_user on User {\n  id\n  name\n  imageId\n  __typename\n}\n\nfragment SusiModal_user on User {\n  ...SignInOptions_user\n  ...SignUpOptions_user\n  __typename\n  id\n}\n\nfragment useNewsletterV3Subscription_newsletterV3 on NewsletterV3 {\n  id\n  type\n  slug\n  name\n  collection {\n    slug\n    __typename\n    id\n  }\n  user {\n    id\n    name\n    username\n    newsletterV3 {\n      id\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment useNewsletterV3Subscription_user on User {\n  id\n  username\n  newsletterV3 {\n    ...useNewsletterV3Subscription_newsletterV3\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment useAuthorFollowSubscribeButton_user on User {\n  id\n  name\n  ...useNewsletterV3Subscription_user\n  __typename\n}\n\nfragment useAuthorFollowSubscribeButton_newsletterV3 on NewsletterV3 {\n  id\n  name\n  ...useNewsletterV3Subscription_newsletterV3\n  __typename\n}\n\nfragment AuthorFollowSubscribeButton_user on User {\n  id\n  name\n  imageId\n  ...SusiModal_user\n  ...useAuthorFollowSubscribeButton_user\n  newsletterV3 {\n    id\n    ...useAuthorFollowSubscribeButton_newsletterV3\n    __typename\n  }\n  __typename\n}\n\nfragment UserFollowRow_user on User {\n  __typename\n  id\n  name\n  bio\n  ...UserAvatar_user\n  ...isUserVerifiedBookAuthor_user\n  ...AuthorFollowSubscribeButton_user\n}\n\nfragment FollowsHeader_publisher on Publisher {\n  __typename\n  id\n  name\n  ... on Collection {\n    ...collectionUrl_collection\n    __typename\n    id\n  }\n  ... on User {\n    ...userUrl_user\n    __typename\n    id\n  }\n}\n\nfragment FollowList_publisher on Publisher {\n  id\n  ... on Collection {\n    ...PublicationFollowRow_collection\n    __typename\n    id\n  }\n  ... on User {\n    ...UserFollowRow_user\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment UserCanonicalizer_user on User {\n  id\n  username\n  hasSubdomain\n  customDomainState {\n    live {\n      domain\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment FollowersHeader_publisher on Publisher {\n  ...FollowsHeader_publisher\n  ... on Collection {\n    subscriberCount\n    __typename\n    id\n  }\n  ... on User {\n    socialStats {\n      followerCount\n      __typename\n    }\n    __typename\n    id\n  }\n  __typename\n}\n\nfragment NoFollows_publisher on Publisher {\n  id\n  name\n  __typename\n}\n",
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

      console.log("📍 ---------------------------------------------------------------------📍");
      console.log("📍 ~ FollowersTab.js:152 ~ FollowersTab ~ fetchFollowers ~ data:", data);
      console.log("📍 ---------------------------------------------------------------------📍");

      return data?.data?.userResult?.followersUserConnection?.users || [];
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
            <button class="btn-primary follow-btn" data-user-id="${userData?.newsletterV3?.id}">Follow</button>
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
        <div class="bulk-controls">
          <button id="refreshFollowersBtn" class="btn-primary">Refresh</button>
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

    setTimeout(() => this.setupFollowButtons(), 100);
    return html;
  }

  setupFollowButtons() {
    const followBtns = document.querySelectorAll(".follow-btn");
    followBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleFollowUser(e));
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
