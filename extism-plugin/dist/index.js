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
  create_event: () => create_event,
  delete_event: () => delete_event,
  list_events: () => list_events,
  update_event: () => update_event
});
module.exports = __toCommonJS(src_exports);

// src/handlers/calendar.ts
function getArgs() {
  const input = Host.inputString();
  try {
    return JSON.parse(input);
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
  const args = getArgs();
  if (!args)
    return 1;
  const {
    accessToken,
    maxResults = 10,
    daysBack = 0,
    daysForward
  } = args;
  const { timeMin, timeMax } = getEventTimeRange(daysBack, daysForward);
  const timeMinParam = timeMin ? `&timeMin=${timeMin}` : "";
  const timeMaxParam = timeMax ? `&timeMax=${timeMax}` : "";
  const maxResultsParam = maxResults ? `&maxResults=${maxResults}` : "";
  const url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true" + timeMinParam + timeMaxParam + maxResultsParam;
  const response = Http.request({
    url,
    method: "GET",
    headers: { "Authorization": `Bearer ${accessToken}` }
  });
  if (response.status !== 200) {
    Host.outputString(JSON.stringify({ error: `Failed to fetch events: ${response.body}` }));
    return 1;
  }
  let data;
  try {
    data = JSON.parse(response.body);
  } catch (err) {
    Host.outputString(JSON.stringify({ error: "Invalid response from Google Calendar API" }));
    return 1;
  }
  const events = data.items?.map((event) => ({
    id: event.id,
    summary: event.summary,
    start: event.start,
    end: event.end,
    location: event.location
  })) || [];
  Host.outputString(JSON.stringify(events, null, 2));
  return 0;
}
function handleCreateEvent() {
  const args = getArgs();
  if (!args)
    return 1;
  const {
    accessToken,
    summary,
    location,
    description,
    start,
    end,
    attendees = [],
    includeGoogleMeetDetails = false
  } = args;
  if (!summary || !start || !end) {
    Host.outputString(JSON.stringify({ error: "Missing required parameters: summary, start, and end are required" }));
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
  const response = Http.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${conferenceDataVersion}`,
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  if (response.status !== 200) {
    Host.outputString(JSON.stringify({ error: `Failed to create event: ${response.body}` }));
    return 1;
  }
  let data;
  try {
    data = JSON.parse(response.body);
  } catch (err) {
    Host.outputString(JSON.stringify({ error: "Invalid response from Google Calendar API" }));
    return 1;
  }
  Host.outputString(JSON.stringify({ id: data.id, message: "Event created successfully" }, null, 2));
  return 0;
}
function handleUpdateEvent() {
  const args = getArgs();
  if (!args)
    return 1;
  const {
    accessToken,
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
    Host.outputString(JSON.stringify({ error: "Missing required parameter: eventId" }));
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
  const response = Http.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=${conferenceDataVersion}`,
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });
  if (response.status !== 200) {
    Host.outputString(JSON.stringify({ error: `Failed to update event: ${response.body}` }));
    return 1;
  }
  let data;
  try {
    data = JSON.parse(response.body);
  } catch (err) {
    Host.outputString(JSON.stringify({ error: "Invalid response from Google Calendar API" }));
    return 1;
  }
  Host.outputString(JSON.stringify({ id: data.id, message: "Event updated successfully" }, null, 2));
  return 0;
}
function handleDeleteEvent() {
  const args = getArgs();
  if (!args)
    return 1;
  const { accessToken, eventId } = args;
  if (!eventId) {
    Host.outputString(JSON.stringify({ error: "Missing required parameter: eventId" }));
    return 1;
  }
  const response = Http.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (response.status !== 204 && response.status !== 200) {
    Host.outputString(JSON.stringify({ error: `Failed to delete event: ${response.body}` }));
    return 1;
  }
  Host.outputString(JSON.stringify({ message: "Event deleted successfully" }, null, 2));
  return 0;
}

// src/index.ts
function list_events() {
  return handleListEvents();
}
function create_event() {
  return handleCreateEvent();
}
function update_event() {
  return handleUpdateEvent();
}
function delete_event() {
  return handleDeleteEvent();
}
//# sourceMappingURL=index.js.map
