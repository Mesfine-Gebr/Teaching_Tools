
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from .canvasCalls import canvas_services
from .models import Event, Appointment

# Define a Blueprint for calendar-related endpoints
calendar = Blueprint('calendar', __name__)


# Retrieve calendar events
@calendar.route('/calendar_events', methods=['GET'])
 
def get_calendar_events():
    # Extract query parameters from the request
    parameters = request.args.to_dict()
    # Call canvas_services to fetch calendar events
    response = canvas_services.getCalendarEvents(parameters)
    if response == "Error":
        return jsonify({'error': 'Failed to fetch calendar events'}), 500
    return jsonify(response), 200

# Retrieve a specific calendar event by ID
@calendar.route('/calendar_events/<int:event_id>', methods=['GET'])

def get_calendar_event(event_id):
    # Call canvas_services to fetch a specific calendar event by its ID
    response = canvas_services.getCalendarEvent(event_id)
    if response == "Error":
        return jsonify({'error': 'Failed to fetch calendar event'}), 500
    return jsonify(response), 200

# Create a new calendar event
@calendar.route('/calendar_events', methods=['POST'])
def create_calendar_event():
    # Extract JSON data from the request
    data = request.json
    # Call canvas_services to create a new calendar event
    response = canvas_services.createCalendarEvent(data)
    if response == "Error":
        return jsonify({'error': 'Failed to create calendar event'}), 500
    return jsonify(response), 201

#Update an existing calendar event by ID
@calendar.route('/calendar_events/<int:event_id>', methods=['PUT'])
def update_calendar_event(event_id):
    # Extract JSON data from the request
    data = request.json
    # Call canvas_services to update an existing calendar event by its ID
    response = canvas_services.updateCalendarEvent(event_id, data)
    if response == "Error":
        return jsonify({'error': 'Failed to update calendar event'}), 500
    return jsonify(response), 200

# Delete a calendar event by ID
@calendar.route('/calendar_events/<int:event_id>', methods=['DELETE'])
def delete_calendar_event(event_id):
    # Call canvas_services to delete a calendar event by its ID
    response = canvas_services.deleteCalendarEvent(event_id)
    if response == "Error":
        return jsonify({'error': 'Failed to delete calendar event'}), 500
    return jsonify({'message': 'Event deleted successfully'}), 200


