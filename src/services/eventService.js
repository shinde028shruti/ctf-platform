/**
 * eventService.js
 * Handles CTF event data and registration.
 * Currently uses mock data from src/data/events.js.
 * TODO: Replace all methods with real API calls when backend is ready.
 */

import { events as mockEvents } from '../data/events';

const EVENTS_KEY = 'cyberforge_events';
const delay = (ms = 500) => new Promise(res => setTimeout(res, ms));

const getStoredEvents = () => {
  const raw = localStorage.getItem(EVENTS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return mockEvents;
};

const saveStoredEvents = (events) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const eventService = {
  /**
   * Get all events.
   * TODO: Replace with GET /api/events
   */
  async getEvents() {
    await delay();
    return getStoredEvents();
  },

  /**
   * Get a single event by ID.
   * TODO: Replace with GET /api/events/:id
   */
  async getEventById(id) {
    await delay(300);
    const event = getStoredEvents().find(e => e.id === Number(id));
    if (!event) throw new Error('Event not found.');
    return event;
  },

  /**
   * Get upcoming events only.
   * TODO: Replace with GET /api/events?status=upcoming
   */
  async getUpcomingEvents() {
    await delay();
    return getStoredEvents().filter(e => e.status === 'upcoming');
  },

  /**
   * Get featured event.
   * TODO: Replace with GET /api/events/featured
   */
  async getFeaturedEvent() {
    await delay(200);
    return getStoredEvents().find(e => e.featured) || null;
  },

  /**
   * Register/join an event.
   * TODO: Replace with POST /api/events/:id/register
   */
  async joinEvent(eventId) {
    await delay(600);
    const events = getStoredEvents();
    const index = events.findIndex(e => e.id === Number(eventId));
    if (index === -1) throw new Error('Event not found.');
    events[index] = {
      ...events[index],
      joined: true,
      participants: events[index].participants + 1,
    };
    saveStoredEvents(events);
    return events[index];
  },

  /**
   * Unregister from an event.
   * TODO: Replace with DELETE /api/events/:id/register
   */
  async leaveEvent(eventId) {
    await delay(400);
    const events = getStoredEvents();
    const index = events.findIndex(e => e.id === Number(eventId));
    if (index === -1) throw new Error('Event not found.');
    events[index] = {
      ...events[index],
      joined: false,
      participants: Math.max(0, events[index].participants - 1),
    };
    saveStoredEvents(events);
    return events[index];
  },
};
