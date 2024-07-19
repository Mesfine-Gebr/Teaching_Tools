
import React, { useEffect, useState, useContext } from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import { UserContext } from "../context/UserContext";
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
    getCalendarEvents,
    createCalendarEvent as createEventService,
    updateCalendarEvent as updateEventService,
    deleteCalendarEvent as deleteEventService
} from '../services/CalendarService';
import ErrorBoundary from './ErrorBoundary';

const localizer = momentLocalizer(moment);

const Calendar = () => {
    const { user } = useContext(UserContext);
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '', location_name: '', description: '' });
    const [selectedEvent, setSelectedEvent] = useState(null);
    
    // Fetch events when user contex change
    useEffect(() => {
        console.log('User context value:', user);
        if (user) {
            fetchEvents();
        }
    }, [user]);

    // Fetch events from backend and transform data
    const fetchEvents = async () => {
        try {
            const data = await getCalendarEvents({ userType: user.account_type });
            const transformedEvents = data[`${user.account_type}_appointments`].map(event => ({
                id: event.appointment_id,
                title: event.name,
                start: new Date(event.date + 'T' + event.start_time),
                end: new Date(event.date + 'T' + event.end_time),
                allDay: false,
                description: event.notes,
                location: event.physical_location,
                url: event.meeting_url
            }));
            console.log('Fetched and transformed events:', transformedEvents);
            setEvents(transformedEvents);
        } catch (error) {
            console.error('Failed to fetch events', error);
        }
    };

    const handleCreateEvent = async () => {
        try {
            await createEventService(newEvent);
            fetchEvents();
            setNewEvent({ title: '', start: '', end: '', location_name: '', description: '' }); // Clear input fields after creating event
        } catch (error) {
            console.error('Failed to create event', error);
        }
    };

    const handleUpdateEvent = async () => {
        try {
            await updateEventService(selectedEvent.id, selectedEvent);
            fetchEvents();
        } catch (error) {
            console.error('Failed to update event', error);
        }
    };

    const handleDeleteEvent = async () => {
        try {
            await deleteEventService(selectedEvent.id);
            fetchEvents();
        } catch (error) {
            console.error('Failed to delete event', error);
        }
    };

    const eventTooltip = ({ event }) => (
        <div>
            <strong>{event.title}</strong>
            {/* <div>{moment(event.start).format('MMM D, YYYY')}</div> */}
            <div>{moment(event.start).format('h:mm A')} to {moment(event.end).format('h:mm A')}</div>
            <div>{event.location}</div>
            <div>{event.description}</div>
            <div>{event.meeting_url}</div>
            {/* <button onClick={() => setSelectedEvent(event)}>Edit</button>
            <button onClick={handleDeleteEvent}>Delete</button> */}
        </div>
    );

    return (
        <ErrorBoundary>
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ color: 'purple', fontWeight: 'bold', marginTop: '20px', fontSize: '34px' }}><strong>CANVAS CALENDAR SCHEDULER</strong></h1>

                {console.log('Events to be rendered:', events)} {/* Added line */}
                {events && (
                    <BigCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        defaultView={Views.MONTH}
                        views={['day', 'week', 'month']}
                        style={{ height: 1200, width: 2100 }}
                        selectable
                        onSelectEvent={(event) => setSelectedEvent(event)}
                        onSelectSlot={(slotInfo) => {
                            setNewEvent({
                                ...newEvent,
                                start: slotInfo.start,
                                end: slotInfo.end
                            });
                        }}
                        components={{
                            event: eventTooltip
                        }}
                    />
                )}
                <h2>Create New Event</h2>
                <div>
                    <input type="text" placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                    <input type="datetime-local" placeholder="Start Time" value={newEvent.start} onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })} />
                    <input type="datetime-local" placeholder="End Time" value={newEvent.end} onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })} />
                    <input type="text" placeholder="Location" value={newEvent.location_name} onChange={(e) => setNewEvent({ ...newEvent, location_name: e.target.value })} />
                    <input type="text" placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
                    <button onClick={handleCreateEvent}>Create Event</button>
                    {selectedEvent && (
                        <div>

                            <button onClick={handleUpdateEvent}>Update Event</button>
                            <button onClick={handleDeleteEvent}>Delete Event</button>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Calendar;









// import React, { useEffect, useState, useContext } from 'react';
// import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
// import { UserContext } from "../context/UserContext";
// import moment from 'moment';
// import 'react-big-calendar/lib/css/react-big-calendar.css';
// import {
//     getCalendarEvents,
//     createCalendarEvent as createEventService,
//     updateCalendarEvent as updateEventService,
//     deleteCalendarEvent as deleteEventService
// } from '../services/CalendarService';
// import ErrorBoundary from './ErrorBoundary';

// const localizer = momentLocalizer(moment);

// const Calendar = () => {
//     const { user } = useContext(UserContext);
//     const [events, setEvents] = useState([]);
//     const [newEvent, setNewEvent] = useState({ title: '', start: '', end: '', location_name: '', description: '' });
//     const [selectedEvent, setSelectedEvent] = useState(null);

//     useEffect(() => {
//         console.log('User context value:', user);
//         if (user) {
//             fetchEvents();
//         }
//     }, [user]);
    

//     const fetchEvents = async () => {
//         try {
//             const data = await getCalendarEvents({ userType: user.account_type });
//             const transformedEvents = data[`${user.account_type}_appointments`].map(event => ({
//                 id: event.appointment_id,
//                 title: event.name,
//                 start: new Date(event.date + 'T' + event.start_time),
//                 end: new Date(event.date + 'T' + event.end_time),
//                 allDay: false,
//                 description: event.notes,
//                 location: event.physical_location,
//                 url: event.meeting_url
//             }));
//             console.log('Fetched and transformed events:', transformedEvents);
//             setEvents(transformedEvents);
//         } catch (error) {
//             console.error('Failed to fetch events', error);
//         }
//     };

//     const handleCreateEvent = async () => {
//         try {
//             await createEventService(newEvent);
//             fetchEvents();
//             setNewEvent({ title: '', start: '', end: '', location_name: '', description: '' }); // Clear input fields after creating event
//         } catch (error) {
//             console.error('Failed to create event', error);
//         }
//     };

//     const handleUpdateEvent = async () => {
//         try {
//             await updateEventService(selectedEvent.id, selectedEvent);
//             fetchEvents();
//         } catch (error) {
//             console.error('Failed to update event', error);
//         }
//     };

//     const handleDeleteEvent = async () => {
//         try {
//             await deleteEventService(selectedEvent.id);
//             fetchEvents();
//         } catch (error) {
//             console.error('Failed to delete event', error);
//         }
//     };

//     const eventTooltip = ({ event }) => (
//         <div>
//             <strong>{event.title}</strong>
//             <div>{moment(event.start).format('MMM D, YYYY')}</div>
//             <div>{moment(event.start).format('h:mm A')} to {moment(event.end).format('h:mm A')}</div>
//             <div>{event.location}</div>
//             <div>{event.description}</div>
//             <button onClick={() => setSelectedEvent(event)}>Edit</button>
//             <button onClick={handleDeleteEvent}>Delete</button>
//         </div>
//     );

//     return (
//         <ErrorBoundary>
//         <div style={{ textAlign: 'center' }}>
//             <h1 style={{ color: 'purple', fontWeight: 'bold' }}><strong>CANVAS CALENDAR</strong></h1>

//             {console.log('Events to be rendered:', events)} {/* Added line */}
//             {events && (
           
//             <BigCalendar
//                 localizer={localizer}
//                 events={events}
//                 startAccessor="start"
//                 endAccessor="end"
//                 defaultView={Views.MONTH}
//                 views={['day', 'week', 'month']}
//                 style={{ height: 900, width: 2100 }}
//                 selectable
//                 onSelectEvent={(event) => setSelectedEvent(event)}
//                 onSelectSlot={(slotInfo) => {
//                     setNewEvent({
//                         ...newEvent,
//                         start: slotInfo.start,
//                         end: slotInfo.end
//                     });
//                 }}
//                 tooltipAccessor={() => eventTooltip}
//             />
           
//         )}
//             <h2>Create New Event</h2>
//             <div>
//                 <input type="text" placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
//                 <input type="datetime-local" placeholder="Start Time" value={newEvent.start} onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })} />
//                 <input type="datetime-local" placeholder="End Time" value={newEvent.end} onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })} />
//                 <input type="text" placeholder="Location" value={newEvent.location_name} onChange={(e) => setNewEvent({ ...newEvent, location_name: e.target.value })} />
//                 <input type="text" placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
//                 <button onClick={handleCreateEvent}>Create Event</button>
//                 {selectedEvent && (
//                     <div>
//                         <button onClick={handleUpdateEvent}>Update Event</button>
//                         <button onClick={handleDeleteEvent}>Delete Event</button>
//                     </div>
//                 )}
//             </div>
//         </div>
//         </ErrorBoundary>
//     );
// };

// export default Calendar;











