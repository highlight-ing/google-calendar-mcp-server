/**
 * Main entry point for the Google Calendar MCP Extism Plugin.
 * This file exports WebAssembly compatible functions that serve as entry points
 * for interacting with the Google Calendar API through the Extism runtime.
 */
import {
  handleListEvents,
  handleCreateEvent,
  handleUpdateEvent,
  handleDeleteEvent,
} from "./handlers/calendar.js";

/**
 * Lists calendar events from the user's Google Calendar.
 * Takes JSON input containing accessToken, maxResults (optional), daysBack (optional), and daysForward (optional).
 * @returns 0 on success, 1 on error
 */
export function list_events(): number {
  return handleListEvents();
}

/**
 * Creates a new calendar event in the user's Google Calendar.
 * Takes JSON input containing accessToken, summary, location (optional), description (optional),
 * start, end, attendees (optional), and includeGoogleMeetDetails (optional).
 * @returns 0 on success, 1 on error
 */
export function create_event(): number {
  return handleCreateEvent();
}

/**
 * Updates an existing calendar event in the user's Google Calendar.
 * Takes JSON input containing accessToken, eventId, summary (optional), location (optional), 
 * description (optional), start (optional), end (optional), attendees (optional), 
 * and includeGoogleMeetDetails (optional).
 * @returns 0 on success, 1 on error
 */
export function update_event(): number {
  return handleUpdateEvent();
}

/**
 * Deletes a calendar event from the user's Google Calendar.
 * Takes JSON input containing accessToken and eventId.
 * @returns 0 on success, 1 on error
 */
export function delete_event(): number {
  return handleDeleteEvent();
} 