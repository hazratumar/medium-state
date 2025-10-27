# Medium Stats Extension

A Chrome extension that provides comprehensive analytics and reporting for Medium writers. Track your article performance, earnings, and engagement metrics directly from your browser.

## Features

- **Real-time Stats**: View views, reads, and earnings for all your Medium articles
- **Interactive Dashboard**: Sort and filter articles by performance metrics
- **Visual Analytics**: Daily earnings chart with 7-day trend visualization
- **Advanced Filtering**: Search articles by title and apply various sorting options
- **Earnings Tracking**: Monitor your Medium Partner Program earnings
- **Performance Metrics**: Calculate read rates and engagement statistics
- **Export Ready**: React component for generating detailed reports

## Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd medium-state
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

## Usage

1. Navigate to Medium.com and log into your account
2. Click the extension icon in your browser toolbar
3. Click "Load Stats" to fetch your article data
4. Use the controls to:
   - Sort by views, reads, earnings, or title
   - Search for specific articles
   - View daily earnings trends in the chart

## Configuration

### API Parameters
- **First**: Number of articles to fetch (max 1000)
- **After**: Pagination cursor for loading more results
- **Order By**: Sort articles by latest, oldest, views, reads, or earnings
- **Filter**: Show only published articles

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **React Components**: Ant Design for advanced reporting
- **Chrome APIs**: Extension APIs, Content Scripts
- **Medium API**: GraphQL queries for fetching user statistics

## File Structure

```
medium-state/
├── manifest.json          # Chrome extension manifest
├── popup.html            # Extension popup interface
├── popup.js              # Main extension logic
├── popup-styles.css      # Popup styling
├── content.js            # Content script for Medium API calls
├── ReportGenerator.jsx   # React component for advanced reporting
├── usage-example.jsx     # Example usage of ReportGenerator
└── package.json          # Dependencies and project info
```

## API Integration

The extension uses Medium's internal GraphQL API to fetch:
- Article statistics (views, reads, earnings)
- User post connections
- Lifetime story stats
- Publication data

## Development

### Building React Components
```bash
npm run build  # If build script is configured
```

### Testing
1. Load the extension in Chrome developer mode
2. Navigate to Medium.com
3. Test the popup functionality
4. Check console for any errors

## Permissions

- `activeTab`: Access current tab information
- `*://medium.com/*`: Interact with Medium.com pages

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This extension uses Medium's internal API and is for educational purposes. Use responsibly and in accordance with Medium's terms of service.