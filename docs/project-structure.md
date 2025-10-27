# Project Structure

```
medium-state/
├── manifest.json           # Chrome extension manifest
├── README.md              # Project documentation
├── package.json           # Dependencies and scripts
├── src/                   # Source code
│   ├── html/             # HTML files
│   │   └── popup.html    # Extension popup interface
│   ├── css/              # Stylesheets
│   │   └── popup-styles.css # Popup styling
│   └── js/               # JavaScript files
│       ├── popup.js      # Main extension logic
│       └── content.js    # Content script for Medium API
├── assets/               # Static assets
│   ├── icons/           # Extension icons
│   └── images/          # Images and graphics
└── docs/                # Documentation
    └── project-structure.md # This file
```

## File Organization

- **src/**: All source code organized by type
- **assets/**: Static resources like icons and images
- **docs/**: Project documentation and guides
- **Root files**: Configuration and manifest files