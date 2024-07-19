import axios from 'axios';

// Base URL of the API
//const API_URL = 'http://127.0.0.1:5000/api';


// Retrieve the Canvas API token from local storage or other secure storage
const canvasToken = localStorage.getItem('CANVAS_ACCESS_TOKEN');

// Helper function to get headers with the Canvas API token
const getAuthHeaders = (userType) => ({
  'Authorization': `Bearer ${canvasToken}`,
  'Content-Type': 'application/json'
});

// Function to get all calendar events
export const getCalendarEvents = async ({userType}) => {

// const API_URL = 'http://127.0.0.1:5000/calendar_events';


  try {
    const response = await axios.get(`/${userType}/appointments`, {
      headers: 
        getAuthHeaders(),
    });
    
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
  
};

// Function to get a specific calendar event
export const getCalendarEvent = async (eventId) => {
  try {
    const response = await axios.get(`/calendar_events/${eventId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    throw error;
  }
};

// Function to create a new calendar event
export const createCalendarEvent = async (data) => {
  try {
    const response = await axios.post(`/calendar_events`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Function to update an existing calendar event
export const updateCalendarEvent = async (eventId, data) => {
  try {
    const response = await axios.put(`/calendar_events/${eventId}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Function to delete a calendar event
export const deleteCalendarEvent = async (eventId) => {
  try {
    const response = await axios.delete(`/calendar_events/${eventId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};
