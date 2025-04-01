# Google Calendar MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Google Calendar API. This server enables you to manage your calendar events programmatically through the MCP interface.

## Features

### Calendar Tools
- `list_events`: List upcoming calendar events with date range filtering
- `create_event`: Create new calendar events with attendees
- `update_event`: Update existing calendar events
- `delete_event`: Delete calendar events

## Prerequisites

1. **Node.js**: Install Node.js version 14 or higher
2. **Google Cloud Console Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Calendar API:
     1. Go to "APIs & Services" > "Library"
     2. Search for and enable "Google Calendar API"
   - Set up OAuth 2.0 credentials:
     1. Go to "APIs & Services" > "Credentials"
     2. Click "Create Credentials" > "OAuth client ID"
     3. Choose "Web application"
     4. Set "Authorized redirect URIs" to include: `http://localhost:3000/code`
     5. Note down the Client ID and Client Secret

## Setup Instructions

1. **Clone and Install**:
   ```bash
   git clone https://github.com/yourusername/google-calendar-mcp-server.git
   cd google-calendar-mcp-server
   npm install
   ```

2. **Create OAuth Credentials**:
   Create a `credentials.json` file in the root directory:
   ```json
   {
       "web": {
           "client_id": "YOUR_CLIENT_ID",
           "client_secret": "YOUR_CLIENT_SECRET",
           "redirect_uris": ["http://localhost:3000/code"],
           "auth_uri": "https://accounts.google.com/o/oauth2/auth",
           "token_uri": "https://oauth2.googleapis.com/token"
       }
   }
   ```

3. **Get Refresh Token**:
   ```bash
   node get-refresh-token.js
   ```
   This will:
   - Open your browser for Google OAuth authentication
   - Request the following permissions:
     - `https://www.googleapis.com/auth/calendar`
   - Save the credentials to `token.json`
   - Display the refresh token in the console

4. **Configure MCP Settings**:
   Add the server configuration to your MCP settings file:
   - For VSCode Claude extension: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - For Claude desktop app: `~/Library/Application Support/Claude/claude_desktop_config.json`

   Add this to the `mcpServers` object:
   ```json
   {
     "mcpServers": {
       "google-calendar": {
         "command": "node",
         "args": ["/path/to/google-calendar-server/build/index.js"],
         "env": {
           "GOOGLE_ACCESS_TOKEN": "your_access_token",
         }
       }
     }
   }
   ```

5. **Build and Run**:
   ```bash
   npm run build
   ```

## Usage Examples

### Calendar Operations

1. **List Events**:
   ```json
   {
     "maxResults": 10,
     "timeMin": "2024-01-01T00:00:00Z",
     "timeMax": "2024-12-31T23:59:59Z"
   }
   ```

2. **Create Event**:
   ```json
   {
     "summary": "Team Meeting",
     "location": "Conference Room",
     "description": "Weekly sync-up",
     "start": "2024-01-24T10:00:00Z",
     "end": "2024-01-24T11:00:00Z",
     "attendees": ["colleague@example.com"]
   }
   ```

3. **Update Event**:
   ```json
   {
     "eventId": "event_id",
     "summary": "Updated Meeting",
     "location": "Virtual",
     "description": "Rescheduled weekly sync-up",
     "start": "2024-01-25T10:00:00Z",
     "end": "2024-01-25T11:00:00Z"
   }
   ```

4. **Delete Event**:
   ```json
   {
     "eventId": "event_id"
   }
   ```

## License

MIT 