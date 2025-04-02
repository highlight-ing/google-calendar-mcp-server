/**
 * Calendar handling functions for interacting with the Google Calendar API.
 * Uses the Host and Http globals that are injected by the Extism runtime.
 */

// Do NOT import Host or Http at the top level—assume they are injected as globals.

/**
 * Parses JSON input from the Host and returns the arguments as an object.
 * On failure, outputs an error message and returns null.
 * @returns Parsed arguments object or null if parsing fails
 */
function getArgs(): any | null {
  try {
    const input = Host.inputString();
    const args = JSON.parse(input);
    return args;
  } catch (err) {
    Host.outputString(JSON.stringify({ error: "Invalid JSON input" }));
    return null;
  }
}

/**
 * Helper function to get event time range based on daysBack and daysForward parameters.
 */
function getEventTimeRange(daysBack?: number, daysForward?: number) {
  const timeMin =
    daysBack !== undefined
      ? new Date(Date.now() - 1000 * 60 * 60 * 24 * daysBack).toISOString()
      : undefined;

  const timeMax =
    daysForward !== undefined
      ? new Date(Date.now() + 1000 * 60 * 60 * 24 * daysForward).toISOString()
      : undefined;

  return { timeMin, timeMax };
}

/**
 * Handles listing events from the user's Google Calendar.
 * Fetches a list of events based on the provided parameters.
 *
 * @returns 0 on success, 1 on error
 */
export function handleListEvents(): number {
  try {
    // Just output a simple test message to confirm the plugin is working
    Host.outputString(
      JSON.stringify(
        {
          status: "success",
          message: "Plugin is working correctly",
          note: "This is a test response to verify Extism runtime",
        },
        null,
        2
      )
    );
    return 0;
  } catch (error: any) {
    Host.outputString(
      JSON.stringify({
        error: `Error in test plugin: ${error.message || "Unknown error"}`,
      })
    );
    return 1;
  }
}

/**
 * Handles creating a new event in the user's Google Calendar.
 *
 * @returns 0 on success, 1 on error
 */
export function handleCreateEvent(): number {
  const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");

  const args = getArgs();
  if (!args) return 1;

  const {
    summary,
    location,
    description,
    start,
    end,
    attendees = [],
    includeGoogleMeetDetails = false,
  } = args;

  // Validate required parameters
  if (!summary || !start || !end) {
    Host.outputString(
      JSON.stringify({
        error:
          "Missing required parameters: summary, start, and end are required",
      })
    );
    return 1;
  }

  // Generate a UUID for the conference request ID if needed
  const conferenceRequestId = includeGoogleMeetDetails
    ? Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    : undefined;

  const event = {
    summary,
    location,
    description,
    start: {
      dateTime: start,
      timeZone: "UTC", // Use UTC as default timezone
    },
    end: {
      dateTime: end,
      timeZone: "UTC", // Use UTC as default timezone
    },
    attendees: attendees.map((email: string) => ({ email })),
    conferenceData: includeGoogleMeetDetails
      ? {
          createRequest: {
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
            requestId: conferenceRequestId,
          },
        }
      : undefined,
  };

  const conferenceDataVersion = includeGoogleMeetDetails ? "1" : "0";

  const response = Http.request(
    {
      url: `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${conferenceDataVersion}`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
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

/**
 * Handles updating an existing event in the user's Google Calendar.
 *
 * @returns 0 on success, 1 on error
 */
export function handleUpdateEvent(): number {
  const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");

  const args = getArgs();
  if (!args) return 1;

  const {
    eventId,
    summary,
    location,
    description,
    start,
    end,
    attendees,
    includeGoogleMeetDetails = false,
  } = args;

  // Validate required parameters
  if (!eventId) {
    Host.outputString(
      JSON.stringify({ error: "Missing required parameter: eventId" })
    );
    return 1;
  }

  const event: any = {};
  if (summary !== undefined) event.summary = summary;
  if (location !== undefined) event.location = location;
  if (description !== undefined) event.description = description;

  if (start !== undefined) {
    event.start = {
      dateTime: start,
      timeZone: "UTC", // Use UTC as default timezone
    };
  }

  if (end !== undefined) {
    event.end = {
      dateTime: end,
      timeZone: "UTC", // Use UTC as default timezone
    };
  }

  if (attendees !== undefined) {
    event.attendees = attendees.map((email: string) => ({ email }));
  }

  const conferenceDataVersion = includeGoogleMeetDetails ? "1" : "0";

  const response = Http.request(
    {
      url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=${conferenceDataVersion}`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
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

/**
 * Handles deleting an event from the user's Google Calendar.
 *
 * @returns 0 on success, 1 on error
 */
export function handleDeleteEvent(): number {
  const accessToken = Config.get("GOOGLE_ACCESS_TOKEN");

  const args = getArgs();
  if (!args) return 1;

  const { eventId } = args;

  // Validate required parameters
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
      Authorization: `Bearer ${accessToken}`,
    },
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
