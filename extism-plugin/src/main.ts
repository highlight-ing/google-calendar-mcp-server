/**
 * Main implementation for the Google Calendar Extism Plugin.
 * This file contains the core implementation that processes the requests from the host.
 */
import { CallToolRequest, CallToolResult, ListToolsResult, Tool } from "./pdk";

import {
  handleListEvents,
  handleCreateEvent,
  handleUpdateEvent,
  handleDeleteEvent,
} from "./handlers/calendar";

/**
 * Implementation of the call function that routes requests to the appropriate handler.
 * @param request The request to process
 * @returns The result of processing the request
 */
export function callImpl(request: CallToolRequest): CallToolResult {
  try {
    // Set up input for the handlers
    const originalInputString = Host.inputString;
    let outputContent: string = "";

    // Override Host.inputString and Host.outputString for the handlers
    Host.inputString = () => JSON.stringify(request.arguments);
    const originalOutputString = Host.outputString;
    Host.outputString = (content: string) => {
      outputContent = content;
      return true;
    };

    let result: number = 1;

    // Route the request to the appropriate handler based on the toolId
    switch (request.toolId) {
      case "list_events":
        result = handleListEvents();
        break;

      case "create_event":
        result = handleCreateEvent();
        break;

      case "update_event":
        result = handleUpdateEvent();
        break;

      case "delete_event":
        result = handleDeleteEvent();
        break;

      default:
        // Restore original methods
        Host.inputString = originalInputString;
        Host.outputString = originalOutputString;
        return new CallToolResult(
          "error",
          null,
          `Unknown tool: ${request.toolId}`
        );
    }

    // Restore original methods
    Host.inputString = originalInputString;
    Host.outputString = originalOutputString;

    // Process result
    if (result === 0) {
      try {
        const parsedOutput = JSON.parse(outputContent);
        return new CallToolResult("success", parsedOutput, undefined);
      } catch (e) {
        return new CallToolResult("success", outputContent, undefined);
      }
    } else {
      try {
        const parsedError = JSON.parse(outputContent);
        return new CallToolResult(
          "error",
          null,
          parsedError.error || "Unknown error"
        );
      } catch (e) {
        return new CallToolResult(
          "error",
          null,
          "Failed to process Calendar request"
        );
      }
    }
  } catch (err) {
    return new CallToolResult(
      "error",
      null,
      `Error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Implementation of the describe function that returns the list of available tools.
 * @returns A list of available tools in the OpenAI API tool format
 */
export function describeImpl(): ListToolsResult {
  const tools = [
    {
      "type": "function",
      "function": {
        "name": "list_events",
        "description": "Lists events from the user's Google Calendar",
        "parameters": {
          "type": "object",
          "properties": {
            "maxResults": {
              "type": "integer",
              "description": "Maximum number of events to return"
            },
            "daysBack": {
              "type": "integer",
              "description": "Number of days to look back"
            },
            "daysForward": {
              "type": "integer",
              "description": "Number of days to look forward"
            },
            "calendarId": {
              "type": "string",
              "description": "ID of the calendar to query, defaults to 'primary'"
            }
          },
          "required": []
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "create_event",
        "description": "Creates a new event in the user's Google Calendar",
        "parameters": {
          "type": "object",
          "properties": {
            "summary": {
              "type": "string",
              "description": "Event title"
            },
            "location": {
              "type": "string",
              "description": "Event location"
            },
            "description": {
              "type": "string",
              "description": "Event description"
            },
            "start": {
              "type": "string",
              "description": "Start time (ISO format)"
            },
            "end": {
              "type": "string",
              "description": "End time (ISO format)"
            },
            "attendees": {
              "type": "array",
              "description": "List of attendee email addresses",
              "items": {
                "type": "string"
              }
            },
            "includeGoogleMeetDetails": {
              "type": "boolean",
              "description": "Whether to include Google Meet details"
            }
          },
          "required": ["summary", "start", "end"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "update_event",
        "description": "Updates an existing event in the user's Google Calendar",
        "parameters": {
          "type": "object",
          "properties": {
            "eventId": {
              "type": "string",
              "description": "ID of the event to update"
            },
            "summary": {
              "type": "string",
              "description": "Event title"
            },
            "location": {
              "type": "string",
              "description": "Event location"
            },
            "description": {
              "type": "string",
              "description": "Event description"
            },
            "start": {
              "type": "string",
              "description": "Start time (ISO format)"
            },
            "end": {
              "type": "string",
              "description": "End time (ISO format)"
            },
            "attendees": {
              "type": "array",
              "description": "List of attendee email addresses",
              "items": {
                "type": "string"
              }
            },
            "includeGoogleMeetDetails": {
              "type": "boolean",
              "description": "Whether to include Google Meet details"
            }
          },
          "required": ["eventId"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "delete_event",
        "description": "Deletes an event from the user's Google Calendar",
        "parameters": {
          "type": "object",
          "properties": {
            "eventId": {
              "type": "string",
              "description": "ID of the event to delete"
            }
          },
          "required": ["eventId"]
        }
      }
    }
  ];

  return new ListToolsResult(tools);
}
