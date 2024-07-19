import json
import os
from .http_calls import httpCalls as http

class canvas_services():
    def __init__(self):
        self.message = "Hello from MyClass!"

    def getAllCalendar():
        added_url = "calendar_events?all_events=true"
        response = http.httpGet(added_url)
        if response == "Error":
            return "Error"
        return response.json()

    def getCalendarEvents(parameters):
        added_url = "calendar_events?all_events=true" 
        response = http.httpGet(added_url)
        if response == "Error":
            return "Error"
        return response.json()

    def getCalendarEvent(eventID):
        added_url = "calendar_events/" + str(eventID)
        response = http.httpGet(added_url)
        if response == "Error":
            return "Error"
        return response.json()

    def createCalendarEvent(data):
        added_url = "calendar_events"
        response = http.httpPostWithData(added_url, data)
        if response == "Error":
            return "Error"
        return response.json()

    def updateCalendarEvent(eventID, data):
        added_url = "calendar_events/" + str(eventID)
        response = http.httpPutWithData(added_url, data)
        if response == "Error":
            return "Error"
        return response.json()

    def deleteCalendarEvent(eventID):
        added_url = "calendar_events/" + str(eventID)
        response = http.httpDelete(added_url)
        if response == "Error":
            return "Error"
        return response