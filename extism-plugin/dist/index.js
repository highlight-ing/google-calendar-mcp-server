"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  call: () => call,
  describe: () => describe
});
module.exports = __toCommonJS(src_exports);

// src/pdk.ts
var CallToolRequest = class {
  constructor(toolId, arguments_) {
    this.toolId = toolId;
    this.arguments = arguments_;
  }
  static fromJson(json) {
    return new CallToolRequest(json.toolId, json.arguments || {});
  }
  static toJson(request) {
    return {
      toolId: request.toolId,
      arguments: request.arguments
    };
  }
};
var CallToolResult = class {
  constructor(state, result, error) {
    this.state = state;
    this.result = result;
    this.error = error;
  }
  static fromJson(json) {
    return new CallToolResult(json.state, json.result, json.error);
  }
  static toJson(result) {
    const json = {
      state: result.state,
      result: result.result
    };
    if (result.error) {
      json.error = result.error;
    }
    return json;
  }
};
var Tool = class {
  constructor(id, label, description, parameters) {
    this.id = id;
    this.label = label;
    this.description = description;
    this.parameters = parameters;
  }
  static fromJson(json) {
    return new Tool(
      json.id,
      json.label,
      json.description,
      json.parameters || {}
    );
  }
  static toJson(tool) {
    return {
      id: tool.id,
      label: tool.label,
      description: tool.description,
      parameters: tool.parameters
    };
  }
};
var ListToolsResult = class {
  constructor(tools) {
    this.tools = tools;
  }
  static fromJson(json) {
    const tools = (json.tools || []).map((t) => Tool.fromJson(t));
    return new ListToolsResult(tools);
  }
  static toJson(result) {
    return {
      tools: result.tools.map((t) => Tool.toJson(t))
    };
  }
};

// src/handlers/calendar.ts
function getArgs() {
  try {
    const input = Host.inputString();
    const args = JSON.parse(input);
    return args;
  } catch (err) {
    Host.outputString(JSON.stringify({ error: "Invalid JSON input" }));
    return null;
  }
}
function getEventTimeRange(daysBack, daysForward) {
  const timeMin = daysBack !== void 0 ? new Date(Date.now() - 1e3 * 60 * 60 * 24 * daysBack).toISOString() : void 0;
  const timeMax = daysForward !== void 0 ? new Date(Date.now() + 1e3 * 60 * 60 * 24 * daysForward).toISOString() : void 0;
  return { timeMin, timeMax };
}
function handleListEvents() {
  try {
    const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");
    if (!accessToken) {
      Host.outputString(
        JSON.stringify({
          error: "Missing required Google access token"
        })
      );
      return 1;
    }
    const args = getArgs();
    if (!args)
      return 1;
    const { maxResults = 10, daysBack, daysForward, calendarId = "primary" } = args;
    const { timeMin, timeMax } = getEventTimeRange(daysBack, daysForward);
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=${maxResults}`;
    if (timeMin)
      url += `&timeMin=${encodeURIComponent(timeMin)}`;
    if (timeMax)
      url += `&timeMax=${encodeURIComponent(timeMax)}`;
    url += `&orderBy=startTime&singleEvents=true`;
    const response = Http.request({
      url,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    if (response.status !== 200) {
      Host.outputString(
        JSON.stringify({
          error: `Failed to list events: ${response.body}`,
          status: response.status
        })
      );
      return 1;
    }
    let data;
    try {
      data = JSON.parse(response.body);
      const events = data.items.map((event) => {
        return {
          id: event.id,
          summary: event.summary,
          description: event.description,
          location: event.location,
          start: event.start,
          end: event.end,
          organizer: event.organizer,
          attendees: event.attendees,
          htmlLink: event.htmlLink,
          conferenceData: event.conferenceData
        };
      });
      Host.outputString(
        JSON.stringify(
          {
            events,
            nextPageToken: data.nextPageToken
          },
          null,
          2
        )
      );
      return 0;
    } catch (err) {
      Host.outputString(
        JSON.stringify({
          error: "Invalid response from Google Calendar API",
          details: err instanceof Error ? err.message : String(err)
        })
      );
      return 1;
    }
  } catch (error) {
    Host.outputString(
      JSON.stringify({
        error: `Error listing events: ${error.message || "Unknown error"}`
      })
    );
    return 1;
  }
}
function handleCreateEvent() {
  const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");
  const args = getArgs();
  if (!args)
    return 1;
  const {
    summary,
    location,
    description,
    start,
    end,
    attendees = [],
    includeGoogleMeetDetails = false
  } = args;
  if (!summary || !start || !end) {
    Host.outputString(
      JSON.stringify({
        error: "Missing required parameters: summary, start, and end are required"
      })
    );
    return 1;
  }
  const conferenceRequestId = includeGoogleMeetDetails ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) : void 0;
  const event = {
    summary,
    location,
    description,
    start: {
      dateTime: start,
      timeZone: "UTC"
      // Use UTC as default timezone
    },
    end: {
      dateTime: end,
      timeZone: "UTC"
      // Use UTC as default timezone
    },
    attendees: attendees.map((email) => ({ email })),
    conferenceData: includeGoogleMeetDetails ? {
      createRequest: {
        conferenceSolutionKey: {
          type: "hangoutsMeet"
        },
        requestId: conferenceRequestId
      }
    } : void 0
  };
  const conferenceDataVersion = includeGoogleMeetDetails ? "1" : "0";
  const response = Http.request(
    {
      url: `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${conferenceDataVersion}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    },
    JSON.stringify(event)
  );
  if (response.status !== 200) {
    Host.outputString(
      JSON.stringify({ error: `Failed to create event: ${response.body}` })
    );
    return 1;
  }
  let data;
  try {
    data = JSON.parse(response.body);
  } catch (err) {
    Host.outputString(
      JSON.stringify({ error: "Invalid response from Google Calendar API" })
    );
    return 1;
  }
  Host.outputString(
    JSON.stringify(
      { id: data.id, message: "Event created successfully" },
      null,
      2
    )
  );
  return 0;
}
function handleUpdateEvent() {
  const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");
  const args = getArgs();
  if (!args)
    return 1;
  const {
    eventId,
    summary,
    location,
    description,
    start,
    end,
    attendees,
    includeGoogleMeetDetails = false
  } = args;
  if (!eventId) {
    Host.outputString(
      JSON.stringify({ error: "Missing required parameter: eventId" })
    );
    return 1;
  }
  const event = {};
  if (summary !== void 0)
    event.summary = summary;
  if (location !== void 0)
    event.location = location;
  if (description !== void 0)
    event.description = description;
  if (start !== void 0) {
    event.start = {
      dateTime: start,
      timeZone: "UTC"
      // Use UTC as default timezone
    };
  }
  if (end !== void 0) {
    event.end = {
      dateTime: end,
      timeZone: "UTC"
      // Use UTC as default timezone
    };
  }
  if (attendees !== void 0) {
    event.attendees = attendees.map((email) => ({ email }));
  }
  const conferenceDataVersion = includeGoogleMeetDetails ? "1" : "0";
  const response = Http.request(
    {
      url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=${conferenceDataVersion}`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    },
    JSON.stringify(event)
  );
  if (response.status !== 200) {
    Host.outputString(
      JSON.stringify({ error: `Failed to update event: ${response.body}` })
    );
    return 1;
  }
  let data;
  try {
    data = JSON.parse(response.body);
  } catch (err) {
    Host.outputString(
      JSON.stringify({ error: "Invalid response from Google Calendar API" })
    );
    return 1;
  }
  Host.outputString(
    JSON.stringify(
      { id: data.id, message: "Event updated successfully" },
      null,
      2
    )
  );
  return 0;
}
function handleDeleteEvent() {
  const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");
  const args = getArgs();
  if (!args)
    return 1;
  const { eventId } = args;
  if (!eventId) {
    Host.outputString(
      JSON.stringify({ error: "Missing required parameter: eventId" })
    );
    return 1;
  }
  const response = Http.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (response.status !== 204 && response.status !== 200) {
    Host.outputString(
      JSON.stringify({ error: `Failed to delete event: ${response.body}` })
    );
    return 1;
  }
  Host.outputString(
    JSON.stringify({ message: "Event deleted successfully" }, null, 2)
  );
  return 0;
}

// src/main.ts
function callImpl(request) {
  try {
    const originalInputString = Host.inputString;
    let outputContent = "";
    Host.inputString = () => JSON.stringify(request.arguments);
    const originalOutputString = Host.outputString;
    Host.outputString = (content) => {
      outputContent = content;
      return content;
    };
    let result = 1;
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
        Host.inputString = originalInputString;
        Host.outputString = originalOutputString;
        return new CallToolResult(
          "error",
          null,
          `Unknown tool: ${request.toolId}`
        );
    }
    Host.inputString = originalInputString;
    Host.outputString = originalOutputString;
    if (result === 0) {
      try {
        const parsedOutput = JSON.parse(outputContent);
        return new CallToolResult("success", parsedOutput, void 0);
      } catch (e) {
        return new CallToolResult("success", outputContent, void 0);
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
function describeImpl() {
  const tools = [
    new Tool(
      "list_events",
      "List Calendar Events",
      "Lists events from the user's Google Calendar",
      {
        maxResults: {
          type: "number",
          description: "Maximum number of events to return",
          optional: true
        },
        daysBack: {
          type: "number",
          description: "Number of days to look back",
          optional: true
        },
        daysForward: {
          type: "number",
          description: "Number of days to look forward",
          optional: true
        }
      }
    ),
    new Tool(
      "create_event",
      "Create Calendar Event",
      "Creates a new event in the user's Google Calendar",
      {
        summary: { type: "string", description: "Event title" },
        location: {
          type: "string",
          description: "Event location",
          optional: true
        },
        description: {
          type: "string",
          description: "Event description",
          optional: true
        },
        start: { type: "string", description: "Start time (ISO format)" },
        end: { type: "string", description: "End time (ISO format)" },
        attendees: {
          type: "array",
          description: "List of attendee email addresses",
          optional: true
        },
        includeGoogleMeetDetails: {
          type: "boolean",
          description: "Whether to include Google Meet details",
          optional: true
        }
      }
    ),
    new Tool(
      "update_event",
      "Update Calendar Event",
      "Updates an existing event in the user's Google Calendar",
      {
        eventId: { type: "string", description: "ID of the event to update" },
        summary: { type: "string", description: "Event title", optional: true },
        location: {
          type: "string",
          description: "Event location",
          optional: true
        },
        description: {
          type: "string",
          description: "Event description",
          optional: true
        },
        start: {
          type: "string",
          description: "Start time (ISO format)",
          optional: true
        },
        end: {
          type: "string",
          description: "End time (ISO format)",
          optional: true
        },
        attendees: {
          type: "array",
          description: "List of attendee email addresses",
          optional: true
        },
        includeGoogleMeetDetails: {
          type: "boolean",
          description: "Whether to include Google Meet details",
          optional: true
        }
      }
    ),
    new Tool(
      "delete_event",
      "Delete Calendar Event",
      "Deletes an event from the user's Google Calendar",
      {
        eventId: { type: "string", description: "ID of the event to delete" }
      }
    )
  ];
  return new ListToolsResult(tools);
}

// src/index.ts
function call() {
  const untypedInput = JSON.parse(Host.inputString());
  const input = CallToolRequest.fromJson(untypedInput);
  const output = callImpl(input);
  const untypedOutput = CallToolResult.toJson(output);
  Host.outputString(JSON.stringify(untypedOutput));
  return 0;
}
function describe() {
  const output = describeImpl();
  const untypedOutput = ListToolsResult.toJson(output);
  Host.outputString(JSON.stringify(untypedOutput));
  return 0;
}
//# sourceMappingURL=index.js.map
