# Track App - Time Tracking Desktop Application

A modern, feature-rich time tracking desktop application built with Electron, React, and TypeScript. Designed specifically for developers to track their work time with Notion integration.

## 🚀 Features

### Core Functionality
- **Start/Stop Time Tracking**: Simple one-click time tracking with project association
- **Task Descriptions**: Add detailed descriptions for each tracked session
- **Idle Detection**: Automatically pause tracking when user is inactive (configurable)
- **Project Management**: Organize tasks by projects with color coding

### Menu Bar Integration
- **macOS Menu Bar App**: Quick access to start/stop tracking
- **Current Task Display**: Shows active task and elapsed time in menu bar
- **Quick Actions**: Start/stop tracking and switch projects from menu bar

### Work Log Management
- **Comprehensive Task List**: View all tracked time entries with details
- **Advanced Filtering**: Filter by project, date range, payment status, and search
- **Task Management**: Edit, delete, and mark tasks as paid/unpaid
- **Archiving**: Archive completed tasks and projects

### Notion Integration
- **API Integration**: Connect with Notion via official API
- **Auto-Sync**: Automatically sync completed tasks to Notion databases
- **Project Linking**: Link local projects to specific Notion databases
- **Data Export**: Export task data to Notion with proper formatting

### Reporting & Analytics
- **Time Reports**: Generate detailed time reports with CSV export
- **Project Breakdown**: View time distribution across projects
- **Payment Tracking**: Separate paid vs unpaid hours
- **Date Range Analysis**: Daily, weekly, and monthly breakdowns

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Electron 27, Node.js
- **Database**: NoSQL (electron-store JSON files)
- **UI Framework**: Custom CSS with modern design
- **External APIs**: Notion API
- **Build Tools**: Electron Builder, Vite

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- macOS (primary target platform)

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd track-app
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm run dist:mac
```

## 🏗 Project Structure

```
track-app/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Main entry point
│   │   ├── preload.ts       # Preload script
│   │   ├── database.ts      # SQLite database service
│   │   ├── idle-detector.ts # User activity monitoring
│   │   └── notion-service.ts # Notion API integration
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── App.tsx             # Main app component
│   └── main.tsx            # React entry point
├── dist/                   # Build output
├── assets/                 # Static assets
└── package.json
```

## 🔧 Configuration

### Notion Integration Setup

1. Create a Notion integration at [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Get your API key and workspace ID
3. Create a `.env` file in the project root with:
   ```
   NOTION_TOKEN=your_notion_api_key_here
   NOTION_DATABASE_ID=your_database_id_here
   ```
4. The API key will be automatically loaded from environment variables
5. Link projects to specific Notion databases in project settings
6. Enable auto-sync to automatically send completed tasks to Notion

#### Auto-sync Features
- **Automatic Sync**: When enabled, completed tasks are automatically synchronized to Notion
- **Project Linking**: Link each project to a specific Notion database
- **Task Details**: Syncs task description, duration, start/end times, and payment status
- **Error Handling**: Sync errors don't prevent task saving locally

### Idle Detection

Configure idle timeout in settings:
- Default: 5 minutes
- Range: 1-60 minutes
- Automatically pauses tracking when user is inactive

## 🎨 UI/UX Features

- **Modern Design**: Clean, productivity-focused interface
- **French Localization**: UI text in French as requested
- **Responsive Layout**: Works on different screen sizes
- **Dark Mode Ready**: CSS variables for easy theming
- **Accessibility**: Keyboard navigation and screen reader support

## 📊 Database Schema

### Tasks Table
- `id`: Unique identifier
- `description`: Task description
- `projectId`: Associated project
- `startTime`: Start timestamp
- `endTime`: End timestamp (optional)
- `duration`: Duration in seconds
- `isPaid`: Payment status
- `isArchived`: Archive status

### Projects Table
- `id`: Unique identifier
- `name`: Project name
- `color`: Project color
- `notionDatabaseId`: Linked Notion database
- `isArchived`: Archive status

### Settings Table
- `key`: Setting name
- `value`: Setting value (JSON)

## 🔌 API Integration

### Notion API
- **Authentication**: API key-based
- **Endpoints**: Database queries, page creation
- **Data Mapping**: Automatic field mapping
- **Error Handling**: Graceful fallbacks

### Electron IPC
- **Security**: Context isolation enabled
- **Communication**: Main-renderer process communication
- **Event Handling**: Real-time updates

## 🚀 Development

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run dist:mac`: Create macOS distribution
- `npm run lint`: Run ESLint

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

## 📱 Platform Support

- **Primary**: macOS (with menu bar integration)
- **Secondary**: Windows/Linux (basic support)
- **Architecture**: x64 and ARM64 support

## 🔒 Security

- **Context Isolation**: Electron security best practices
- **API Key Storage**: Secure local storage
- **Data Privacy**: All data stored locally
- **No Telemetry**: Privacy-focused design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with details

## 🔄 Roadmap

- [ ] Cloud sync support
- [ ] Team collaboration features
- [ ] Advanced reporting with charts
- [ ] Mobile companion app
- [ ] Integration with other tools (Slack, GitHub, etc.)
- [ ] Offline mode improvements
- [ ] Multi-language support 