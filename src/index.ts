#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { 
  handleListEvents, 
  handleCreateEvent, 
  handleUpdateEvent, 
  handleDeleteEvent 
} from './handlers/calendar.js';

class GoogleCalendarServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'google-calendar-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_events',
          description: 'List upcoming calendar events',
          inputSchema: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'Google API access token',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of events to return (default: 10)',
              },
              daysBack: {
                type: 'number',
                description: 'Earliest date to include events from (default: 0 for today)',
              },
              daysForward: {
                type: 'number',
                description: 'Latest date to include events to',
              },
            },
            required: ['accessToken']
          },
        },
        {
          name: 'create_event',
          description: 'Create a new calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'Google API access token',
              },
              summary: {
                type: 'string',
                description: 'Event title',
              },
              location: {
                type: 'string',
                description: 'Event location',
              },
              description: {
                type: 'string',
                description: 'Event description',
              },
              start: {
                type: 'string',
                description: 'Start time in ISO format',
              },
              end: {
                type: 'string',
                description: 'End time in ISO format',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of attendee email addresses',
              },
              includeGoogleMeetDetails: {
                type: 'boolean',
                description: 'Whether to include Google Meet video conference details',
              },
            },
            required: ['accessToken', 'summary', 'start', 'end']
          },
        },
        {
          name: 'update_event',
          description: 'Update an existing calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'Google API access token',
              },
              eventId: {
                type: 'string',
                description: 'Event ID to update',
              },
              summary: {
                type: 'string',
                description: 'New event title',
              },
              location: {
                type: 'string',
                description: 'New event location',
              },
              description: {
                type: 'string',
                description: 'New event description',
              },
              start: {
                type: 'string',
                description: 'New start time in ISO format',
              },
              end: {
                type: 'string',
                description: 'New end time in ISO format',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'New list of attendee email addresses',
              },
              includeGoogleMeetDetails: {
                type: 'boolean',
                description: 'Whether to include Google Meet video conference details',
              },
            },
            required: ['accessToken', 'eventId']
          },
        },
        {
          name: 'delete_event',
          description: 'Delete a calendar event',
          inputSchema: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                description: 'Google API access token',
              },
              eventId: {
                type: 'string',
                description: 'Event ID to delete',
              },
            },
            required: ['accessToken', 'eventId']
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_events':
          return await handleListEvents(request.params.arguments);
        case 'create_event':
          return await handleCreateEvent(request.params.arguments);
        case 'update_event':
          return await handleUpdateEvent(request.params.arguments);
        case 'delete_event':
          return await handleDeleteEvent(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Calendar MCP server running on stdio');
  }
}

const server = new GoogleCalendarServer();
server.run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 