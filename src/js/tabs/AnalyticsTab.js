class AnalyticsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
    this.chart = null;
    this.isLoading = false;
  }

  render() {
    return `
      <div class="analytics-container">
        <div class="analytics-header">
          <h3>Analytics Dashboard</h3>
          <button id="refreshAnalytics" class="refresh-btn">Refresh</button>
        </div>
        <div class="chart-section">
          <div class="chart-header">
            <h4>Top Earning Posts</h4>
            <div id="analyticsStatus" class="status"></div>
          </div>
          <div class="chart-container">
            <canvas id="earningsChart" width="600" height="180"></canvas>
            <div id="chartLoader" class="chart-loader" style="display: none;">Loading...</div>
          </div>
        </div>
        <div class="stats-summary">
          <div class="stat-card">
            <span class="stat-label">Total Earnings</span>
            <span id="totalEarnings" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Avg Per Post</span>
            <span id="avgDaily" class="stat-value">$0.00</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Top Post</span>
            <span id="bestDay" class="stat-value">$0.00</span>
          </div>
        </div>
      </div>
    `;
  }

  init() {
    this.initCharts();
    this.bindEvents();
    this.loadData();
  }

  bindEvents() {
    const refreshBtn = document.getElementById('refreshAnalytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadData());
    }
  }

  initCharts() {
    this.earningsChart = new BarChart("earningsChart", {
      barColor: "#667eea",
      padding: 40,
    });
  }

  async loadData() {
    if (this.isLoading) return;
    
    try {
      this.setLoadingState(true);
      const params = this.getApiParams();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, {
        action: "earnings",
        params
      }, (response) => {
        this.setLoadingState(false);
        this.handleResponse(response);
      });
    } catch (error) {
      this.setLoadingState(false);
      this.showStatus('Failed to load analytics data', 'error');
    }
  }

  getApiParams() {
    const username = localStorage.getItem('self_username') || localStorage.getItem('competitor_username') || 'codebyumar';
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    return {
      username,
      first: 1000,
      after: '',
      startAt: sevenDaysAgo,
      endAt: now
    };
  }

  setLoadingState(loading) {
    this.isLoading = loading;
    const loader = document.getElementById('chartLoader');
    const refreshBtn = document.getElementById('refreshAnalytics');
    
    if (loader) loader.style.display = loading ? 'block' : 'none';
    if (refreshBtn) refreshBtn.disabled = loading;
    
    this.showStatus(loading ? 'Loading analytics...' : '', loading ? 'loading' : '');
  }

  showStatus(message, type = '') {
    const status = document.getElementById('analyticsStatus');
    if (status) {
      status.textContent = message;
      status.className = `status ${type}`;
    }
  }

  handleResponse(response) {
    if (!response || response.error) {
      this.showStatus(response?.error || 'Failed to fetch data', 'error');
      this.renderCharts();
      return;
    }

    const posts = response?.data?.[0]?.data?.userResult?.postsConnection?.edges;
    if (posts && posts.length > 0) {
      this.renderCharts(posts);
      this.updateSummaryStats(posts);
      this.showStatus('Analytics loaded successfully', 'success');
    } else {
      this.renderCharts();
      this.showStatus('No earnings data available', 'info');
    }
  }

  renderCharts(posts) {
    const earningsData = this.getEarningsData(posts);
    this.earningsChart.render(earningsData);
  }

  getEarningsData(posts) {
    if (!posts || posts.length === 0) {
      return this.getDummyData();
    }

    // Get top 7 earning posts for visualization
    const topPosts = posts
      .filter(post => post.node.earnings?.monthlyEarnings)
      .sort((a, b) => {
        const aValue = (a.node.earnings.monthlyEarnings.units || 0) + (a.node.earnings.monthlyEarnings.nanos || 0) / 1000000000;
        const bValue = (b.node.earnings.monthlyEarnings.units || 0) + (b.node.earnings.monthlyEarnings.nanos || 0) / 1000000000;
        return bValue - aValue;
      })
      .slice(0, 7);

    return topPosts.map(post => {
      const earnings = post.node.earnings.monthlyEarnings;
      const value = (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
      return {
        label: post.node.title.substring(0, 10) + '...',
        value
      };
    });
  }

  getDummyData() {
    const today = new Date();
    const dummyEarnings = [5.2, 8.7, 12.3, 15.8, 9.4, 18.6, 22.1];
    return dummyEarnings.map((value, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return {
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value
      };
    });
  }

  updateSummaryStats(posts) {
    if (!posts || posts.length === 0) {
      document.getElementById('totalEarnings').textContent = '$0.00';
      document.getElementById('avgDaily').textContent = '$0.00';
      document.getElementById('bestDay').textContent = '$0.00';
      return;
    }

    // Calculate actual earnings from all posts
    let totalEarnings = 0;
    let maxEarnings = 0;
    let earningPosts = 0;

    posts.forEach(post => {
      const earnings = post.node.earnings?.monthlyEarnings;
      if (earnings) {
        const value = (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
        totalEarnings += value;
        maxEarnings = Math.max(maxEarnings, value);
        earningPosts++;
      }
    });

    const avgEarnings = earningPosts > 0 ? totalEarnings / earningPosts : 0;

    document.getElementById('totalEarnings').textContent = `$${totalEarnings.toFixed(2)}`;
    document.getElementById('avgDaily').textContent = `$${avgEarnings.toFixed(2)}`;
    document.getElementById('bestDay').textContent = `$${maxEarnings.toFixed(2)}`;
  }
}
