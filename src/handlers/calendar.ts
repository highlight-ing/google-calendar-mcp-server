import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

function getEventTimeRange(daysBack?: number, daysForward?: number) {
  const timeMin = daysBack !== undefined 
    ? new Date(Date.now() - 1000 * 60 * 60 * 24 * daysBack).toISOString() 
    : undefined;
  
  const timeMax = daysForward !== undefined 
    ? new Date(Date.now() + 1000 * 60 * 60 * 24 * daysForward).toISOString() 
    : undefined;
  
  return { timeMin, timeMax };
}

export async function handleListEvents(args: any) {
  try {
    const { 
      accessToken, 
      maxResults = 10, 
      daysBack = 0, 
      daysForward 
    } = args;

    const { timeMin, timeMax } = getEventTimeRange(daysBack, daysForward);

    const timeMinParam = timeMin ? `&timeMin=${timeMin}` : '';
    const timeMaxParam = timeMax ? `&timeMax=${timeMax}` : '';
    const maxResultsParam = maxResults ? `&maxResults=${maxResults}` : '';

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true' +
      timeMinParam +
      timeMaxParam +
      maxResultsParam,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    const events = data.items?.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      location: event.location,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(events, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error fetching calendar events: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleCreateEvent(args: any) {
  try {
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

    // Generate a UUID for the conference request ID if needed
    const conferenceRequestId = includeGoogleMeetDetails 
      ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      : undefined;

    const event = {
      summary,
      location,
      description,
      start: {
        dateTime: start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees.map((email: string) => ({ email })),
      conferenceData: includeGoogleMeetDetails
        ? {
            createRequest: {
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
              requestId: conferenceRequestId,
            },
          }
        : undefined,
    };

    const conferenceDataVersion = includeGoogleMeetDetails ? '1' : '0';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=${conferenceDataVersion}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: `Event created successfully. Event ID: ${data.id}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error creating event: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleUpdateEvent(args: any) {
  try {
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

    const event: any = {};
    if (summary !== undefined) event.summary = summary;
    if (location !== undefined) event.location = location;
    if (description !== undefined) event.description = description;
    
    if (start !== undefined) {
      event.start = {
        dateTime: start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    
    if (end !== undefined) {
      event.end = {
        dateTime: end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    
    if (attendees !== undefined) {
      event.attendees = attendees.map((email: string) => ({ email }));
    }

    // For conference data, we'd need to handle this more carefully in a real app
    // as you can't simply add/remove Google Meet links to existing events without
    // checking the current conferenceData status

    const conferenceDataVersion = includeGoogleMeetDetails ? '1' : '0';

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}?conferenceDataVersion=${conferenceDataVersion}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: `Event updated successfully. Event ID: ${data.id}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error updating event: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleDeleteEvent(args: any) {
  try {
    const { accessToken, eventId } = args;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Event deleted successfully. Event ID: ${eventId}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting event: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
} 