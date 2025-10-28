class AnalyticsTab {
  constructor(extensionInstance) {
    this.extension = extensionInstance;
  }

  render() {
    return `
      <div class="chart-card full-width">
        <div class="chart-container">
          <h3>Monthly Story Stats</h3>
          <canvas id="monthlyStatsChart" width="630" height="180"></canvas>
          <div id="monthlyStatsTooltip" class="chart-tooltip"></div>
        </div>
      </div>
      <div class="chart-container">
        <h3>Daily Earnings Trend</h3>
        <canvas id="chart" width="460" height="180"></canvas>
      </div>
      <div class="chart-container">
        <h3>User Daily Earnings</h3>
        <canvas id="dailyEarningsChart" width="460" height="180"></canvas>
        <div id="dailyEarningsTooltip" class="chart-tooltip"></div>
      </div>
      <div id="analytics-summary" class="analytics-summary"></div>
    `;
  }

  init() {
    this.extension.loadChartData();
    this.loadDailyEarningsChart();
    this.loadMonthlyStatsChart();
    this.addTooltipStyles();
  }

  addTooltipStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .chart-tooltip {
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .chart-card {
        background: #fff;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }
      .full-width {
        width: 100%;
        margin: 16px 0;
      }
    `;
    document.head.appendChild(style);
  }

  async loadDailyEarningsChart() {
    const username = localStorage.getItem("mediumUsername");
    if (!username) {
      this.renderEmptyChart("dailyEarningsChart", "Username not set");
      return;
    }

    try {
      const endAt = Date.now();
      const startAt = endAt - 30 * 24 * 60 * 60 * 1000;

      const payload = {
        operationName: "UserDailyEarningsQuery",
        variables: {
          username: username,
          startAt: startAt,
          endAt: endAt,
          first: 100,
        },
        query: `query UserDailyEarningsQuery($username: ID!, $startAt: Long!, $endAt: Long!, $first: Int!) {
          userResult(username: $username) {
            __typename
            ... on User {
              id
              earnings {
                dailyEarnings: totalsConnection(first: $first timeGranularity: DAILY timeRange: {startAt: $startAt, endAt: $endAt}) {
                  edges {
                    node {
                      totalEarnings {
                        units
                        nanos
                        currencyCode
                      }
                      startAt
                      endAt
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          }
        }`,
      };

      const response = await fetch("https://medium.com/_/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const dailyEarnings = data?.data?.userResult?.earnings?.dailyEarnings?.edges || [];

      this.renderDailyEarningsChart(dailyEarnings);
    } catch (error) {
      console.error("Error fetching daily earnings:", error);
      this.renderEmptyChart("dailyEarningsChart", "Error loading data");
    }
  }

  renderDailyEarningsChart(dailyEarnings) {
    const canvas = document.getElementById("dailyEarningsChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (!dailyEarnings || dailyEarnings.length === 0) {
      this.renderEmptyChart("dailyEarningsChart", "No earnings data available");
      return;
    }

    const chartData = dailyEarnings
      .map((edge) => {
        const earnings = edge.node.totalEarnings;
        const value = (earnings.units || 0) + (earnings.nanos || 0) / 1000000000;
        return { date: new Date(edge.node.startAt), earnings: value };
      })
      .sort((a, b) => a.date - b.date);

    const maxEarnings = Math.max(...chartData.map((d) => d.earnings), 1);
    const barWidth = chartWidth / chartData.length;

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Store bar positions for tooltip
    this.dailyEarningsData = chartData.map((day, i) => {
      const barHeight = Math.max((day.earnings / maxEarnings) * chartHeight, 3);
      const x = padding + i * barWidth;
      const y = height - padding - barHeight;

      // Enhanced bar with shadow and rounded corners
      ctx.shadowColor = "rgba(16, 185, 129, 0.3)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#34d399");
      gradient.addColorStop(1, "#10b981");

      ctx.fillStyle = gradient;
      this.roundRect(ctx, x + 3, y, barWidth - 6, barHeight, 4);
      ctx.fill();

      ctx.shadowColor = "transparent";

      if (i % 4 === 0) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "11px Inter";
        ctx.textAlign = "center";
        ctx.fillText(day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), x + barWidth / 2, height - 15);
      }

      return { x: x + 3, y, width: barWidth - 6, height: barHeight, data: day };
    });

    this.setupTooltip(
      canvas,
      "dailyEarningsTooltip",
      this.dailyEarningsData,
      (data) => `<strong>${data.date.toLocaleDateString()}</strong><br>Earnings: $${data.earnings.toFixed(2)}`
    );
  }

  async loadMonthlyStatsChart() {
    const username = localStorage.getItem("mediumUsername");
    if (!username) {
      this.renderEmptyChart("monthlyStatsChart", "Username not set");
      return;
    }

    try {
      const endTime = Date.now();
      const startTime = endTime - 30 * 24 * 60 * 60 * 1000;

      const payload = {
        operationName: "UserMonthlyStoryStatsTimeseriesQuery",
        variables: {
          username: username,
          input: {
            startTime: startTime,
            endTime: endTime,
          },
        },
        query: `query UserMonthlyStoryStatsTimeseriesQuery($username: ID!, $input: UserPostsAggregateStatsInput!) {
          user(username: $username) {
            id
            postsAggregateTimeseriesStats(input: $input) {
              __typename
              ... on AggregatePostTimeseriesStats {
                totalStats {
                  presentations
                  viewers
                  readers
                  netFollowersGained
                  netSubscribersGained
                  __typename
                }
                points {
                  timestamp
                  stats {
                    total {
                      viewers
                      readers
                      __typename
                    }
                    __typename
                  }
                  __typename
                }
                __typename
              }
            }
            __typename
          }
        }`,
      };

      const response = await fetch("https://medium.com/_/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const statsData = data?.data?.user?.postsAggregateTimeseriesStats;

      this.renderMonthlyStatsChart(statsData);
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      this.renderEmptyChart("monthlyStatsChart", "Error loading data");
    }
  }

  renderMonthlyStatsChart(statsData) {
    const canvas = document.getElementById("monthlyStatsChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (!statsData?.points || statsData.points.length === 0) {
      this.renderEmptyChart("monthlyStatsChart", "No stats data available");
      return;
    }

    const chartData = statsData.points
      .map((point) => ({
        date: new Date(point.timestamp),
        viewers: point.stats.total.viewers || 0,
        readers: point.stats.total.readers || 0,
      }))
      .sort((a, b) => a.date - b.date);

    const maxValue = Math.max(...chartData.map((d) => Math.max(d.viewers, d.readers)), 1);
    const barWidth = chartWidth / chartData.length / 2;

    // Draw grid
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Store bar positions for tooltip
    this.monthlyStatsData = [];

    chartData.forEach((point, i) => {
      const x = padding + i * barWidth * 2;

      // Viewers bar with shadow
      const viewersHeight = Math.max((point.viewers / maxValue) * chartHeight, 3);
      const viewersY = height - padding - viewersHeight;

      ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;

      const viewersGradient = ctx.createLinearGradient(0, viewersY, 0, viewersY + viewersHeight);
      viewersGradient.addColorStop(0, "#60a5fa");
      viewersGradient.addColorStop(1, "#3b82f6");

      ctx.fillStyle = viewersGradient;
      this.roundRect(ctx, x, viewersY, barWidth - 2, viewersHeight, 3);
      ctx.fill();

      // Readers bar with shadow
      const readersHeight = Math.max((point.readers / maxValue) * chartHeight, 3);
      const readersY = height - padding - readersHeight;

      ctx.shadowColor = "rgba(239, 68, 68, 0.3)";

      const readersGradient = ctx.createLinearGradient(0, readersY, 0, readersY + readersHeight);
      readersGradient.addColorStop(0, "#f87171");
      readersGradient.addColorStop(1, "#ef4444");

      ctx.fillStyle = readersGradient;
      this.roundRect(ctx, x + barWidth, readersY, barWidth - 2, readersHeight, 3);
      ctx.fill();

      ctx.shadowColor = "transparent";

      // Date labels
      if (i % 2 === 0) {
        ctx.fillStyle = "#6b7280";
        ctx.font = "11px Inter";
        ctx.textAlign = "center";
        ctx.fillText(point.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), x + barWidth, height - 15);
      }

      this.monthlyStatsData.push(
        { x, y: viewersY, width: barWidth - 2, height: viewersHeight, data: point, type: "viewers" },
        { x: x + barWidth, y: readersY, width: barWidth - 2, height: readersHeight, data: point, type: "readers" }
      );
    });

    this.setupTooltip(
      canvas,
      "monthlyStatsTooltip",
      this.monthlyStatsData,
      (data, type) =>
        `<strong>${data.date.toLocaleDateString()}</strong><br>${type === "viewers" ? "Viewers" : "Readers"}: ${data[type].toLocaleString()}`
    );
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  setupTooltip(canvas, tooltipId, data, formatter) {
    const tooltip = document.getElementById(tooltipId);
    if (!tooltip) return;

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hoveredBar = data.find((bar) => x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height);

      if (hoveredBar) {
        tooltip.innerHTML = formatter(hoveredBar.data, hoveredBar.type);
        tooltip.style.display = "block";
        tooltip.style.left = e.clientX + 10 + "px";
        tooltip.style.top = e.clientY - 10 + "px";
        canvas.style.cursor = "pointer";
      } else {
        tooltip.style.display = "none";
        canvas.style.cursor = "default";
      }
    });

    canvas.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      canvas.style.cursor = "default";
    });
  }

  renderEmptyChart(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#6b7280";
    ctx.font = "14px Inter";
    ctx.textAlign = "center";
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }
}
