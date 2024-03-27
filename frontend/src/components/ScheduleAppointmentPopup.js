/* ScheduleAppointmentPopup.js
 * Last Edited: 3/24/24
 *
 * UI Popup shown when student presses "Schedule New Meeting"
 * in their "Courses" tab. Gives the student access to see
 * their courses and respective programs
 *
 * Known bugs:
 * -
 *
 */

import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext.js";
import { ScheduleMeeting } from "react-schedule-meeting";
import { format } from "date-fns";
import { getCookie } from "../utils/GetCookie.js";
import Appointment from "./Appointment.js";

const ScheduleAppointmentPopup = ({ onClose, functions }) => {
  // General Variables
  const { user } = useContext(UserContext);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedTimeslot, setSelectedTimeslot] = useState(null);
  const [selectedTimeDuration, setSelectedTimeDuration] = useState(0);
  const [availableTimeslots, setAvailableTimeslots] = useState([]);
  const [programDescriptions, setProgramDescriptions] = useState({});
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("");

  // Load Variables
  const [initialLoad, setInitialLoad] = useState(true);
  const [isCourseVisible, setIsCourseVisible] = useState(false);
  const [isPopupGrown, setPopupGrown] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showAppointmentPanel, setShowAppointmentPanel] = useState(false);
  const [showPopup, setShowPopup] = useState(true);

  // Course Data Variables
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [allCourseData, setAllCourseData] = useState([]);
  const [selectedCourseData, setSelectedCourseData] = useState({
    id: "",
    course_name: "",
    programs: [],
  });

  ////////////////////////////////////////////////////////
  //               Fetch Get Functions                  //
  ////////////////////////////////////////////////////////

  // fetch all appointment-based programs for the student's courses
  const fetchAllStudentCourses = async () => {
    if (user.account_type !== "student") return;

    try {
      const response = await fetch(`/student/programs/appointment-based`, {
        credentials: "include",
      });

      const fetchedCourseList = await response.json();
      setAllCourseData(fetchedCourseList);
    } catch (error) {
      console.error("Error fetching all student courses:", error);
    }
  };

  // fetches all of the descriptions for each program in a course
  const fetchProgramDetails = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `/course/programs/${encodeURIComponent(selectedCourseId)}`,
        {
          credentials: "include",
        }
      );
      const fetchedData = await response.json();
      const programDetails = fetchedData.map((program) => ({
        id: program.id,
        description: program.description,
      }));
      setProgramDescriptions(programDetails);
    } catch (error) {
      console.error("Error fetching program details:", error);
    }
  };

  // when selectedProgramId or selectedCourseId change,
  // if they are real values, fetch the available appointments
  // for the program
  useEffect(() => {
    if (selectedProgramId && selectedCourseId !== "") {
      fetch(
        `/student/appointments/available/${encodeURIComponent(
          selectedProgramId
        )}/${encodeURIComponent(selectedCourseId)}`
      )
        .then((response) => response.json())
        .then((data) => {
          // if there is real data
          if (data.available_appointments.length > 0) {
            const timeslots = data.available_appointments
              .filter((appointment) => appointment.status === "posted")
              .map((appointment) => ({
                startTime: new Date(
                  `${appointment.date}T${appointment.start_time}`
                ),
                endTime: new Date(
                  `${appointment.date}T${appointment.end_time}`
                ),
                id: appointment.appointment_id,
              }));

            // set available timeslots to all available appointments
            setAvailableTimeslots(timeslots);

            // set the duration of the timeslots (all timeslots should have the same duration)
            if (timeslots) {
              const startDate = new Date(timeslots[0].startTime);
              const endDate = new Date(timeslots[0].endTime);
              const timeDifference = endDate - startDate;
              const minutes = Math.floor(timeDifference / (1000 * 60));
              setSelectedTimeDuration(minutes);
            }
          } else {
            window.alert("No available appointments at this time.");
          }
        })
        .catch((error) => console.error("Error:", error));
    }
  }, [selectedProgramId, selectedCourseId]);

  ////////////////////////////////////////////////////////
  //               Fetch Post Functions                 //
  ////////////////////////////////////////////////////////

  // called when a student clicks to reserve an appointment
  // after fetch, will update page based on backend response
  const bookAppointment = () => {
    if (selectedTimeslot) {
      const appointmentID = selectedTimeslot.availableTimeslot.id;
      const appointmentData = {
        notes: appointmentNotes,
      };
      const csrfToken = getCookie("csrf_access_token");
      let isHandledError = false; // flag to indicate if the error has been handled

      fetch(
        `/student/appointments/reserve/${encodeURIComponent(
          appointmentID
        )}/${encodeURIComponent(selectedCourseId)}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify(appointmentData),
        }
      )
        .then((response) => {
          if (!response.ok) {
            if (response.status === 409) {
              alert("Sorry, this appointment is no longer available.");
              setSelectedProgramId(""); // Reset the program id
              setShowAppointmentPanel(false);
              setShowCalendar(false);
              isHandledError = true; // Mark this error as handled
              return; // Return early to avoid further processing
            }
            throw new Error("Failed to reserve appointment");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            setAppointmentStatus(data.status);
            setBookingConfirmed(true);
            // reload page
            functions.reloadAppointments();
          }
        })
        .catch((error) => {
          if (!isHandledError) {
            // Check if the error has not been handled
            console.error("Error:", error);
            alert("Failed to book the session. Please try again.");
            setSelectedProgramId(""); // Reset the program id
            setShowAppointmentPanel(false);
            setShowCalendar(false);
          }
        });
    }
  };

  ////////////////////////////////////////////////////////
  //                 Handler Functions                  //
  ////////////////////////////////////////////////////////

  // shows appointment when a time slot has been selected by user
  const handleStartTimeSelect = (startTimeEventEmit) => {
    setSelectedTimeslot(startTimeEventEmit); // Update the selected timeslot state
    setShowAppointmentPanel(true);
  };

  // hides appointment when the user deselects a time slot
  const cancelSelectedSlot = () => {
    selectedTimeslot.resetSelectedTimeState();
    setShowAppointmentPanel(false);
    setAppointmentNotes("");
  };

  // resets all popup UI and select variables when user clicks on the X in the Appointment.js screen
  const resetBooking = () => {
    setBookingConfirmed(false);
    setSelectedProgramId("");
    setShowCalendar(false);
    setShowAppointmentPanel(false);
    setSelectedTimeslot(null);
    setAppointmentNotes("");
    setShowPopup(false);
  };

  // called when user clicks to change selected course
  const handleCourseChange = (e) => {
    if (!e.target.value) {
      setIsCourseVisible(false);
      setSelectedCourseId(e.target.value);
      return;
    }

    const selectedCourse = parseInt(e.target.value);

    // set the selected course ID
    setSelectedCourseId(selectedCourse);

    // update course info displayed on page to selectedCourseId
    updateSelectedCourseData(selectedCourse);

    setIsCourseVisible(true);

    if (isPopupGrown && showCalendar) {
      setSelectedProgramId("");
      setAvailableTimeslots([]);
      setShowCalendar(false);
      setPopupGrown(false);
    }
  };

  // called when user clicks to change selected program in a course
  const handleProgramChange = (e) => {
    if (!e) {
      return;
    }

    let selectedProgram = parseInt(e.target.value);

    // if no program selected, set to default
    if (!selectedProgram) {
      selectedProgram = -1;
    }

    // set the selected program ID
    setSelectedProgramId(selectedProgram);

    if (e.target.value === "") {
      setSelectedProgramId("");
      setAvailableTimeslots([]);
      setPopupGrown(false);
      setShowCalendar(false);
    } else {
      setPopupGrown(true);
      setShowCalendar(true);
    }

    setSelectedTimeslot(null); // Reset the selected timeslot when changing type
    setShowAppointmentPanel(false);
  };

  // update the selectedCourseData based on a courseId
  const updateSelectedCourseData = (courseId) => {
    if (!courseId) {
      setSelectedCourseData({});
      return;
    }

    // look for course in allCourseData
    const selectedCourse = allCourseData.find(
      (course) => course.id === courseId
    );

    // if course found:
    if (selectedCourse) {
      // update selectedCourseData with selectedCourse
      setSelectedCourseData(selectedCourse);
    }
  };

  ////////////////////////////////////////////////////////
  //               UseEffect Functions                  //
  ////////////////////////////////////////////////////////

  // on initial page load, fetchAllStudentCourses()
  useEffect(() => {
    if (!initialLoad) {
      fetchAllStudentCourses();
    }
    setInitialLoad(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoad, user]);

  // when selectedCourseId changes, set it and fetchProgramDetails() if a real value
  useEffect(() => {
    setSelectedCourseId(selectedCourseId);
    if (selectedCourseId !== "" && selectedCourseId) {
      fetchProgramDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  // when the booking is confirmed and showPopup is set to false
  // close out of schedule meeting popup
  useEffect(() => {
    if (!showPopup) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPopup]);

  ////////////////////////////////////////////////////////
  //                 Render Functions                   //
  ////////////////////////////////////////////////////////

  // If booking is confirmed, render the Appointment component, otherwise render the booking UI
  if (bookingConfirmed) {
    return (
      <Appointment
        program_name={
          selectedCourseData.programs.find(
            (name) => name.id === selectedProgramId
          )?.name || ""
        }
        selectedTimeslot={selectedTimeslot}
        notes={appointmentNotes}
        meetingURL={
          selectedCourseData.programs.find(
            (meeting_url) => meeting_url.id === selectedProgramId
          )?.meeting_url || "No URL for this meeting."
        }
        location={
          selectedCourseData.programs.find(
            (location) => location.id === selectedProgramId
          )?.physical_location || "No in-person location for this meeting."
        }
        resetBooking={resetBooking}
        status={appointmentStatus}
      />
    );
  }

  // HTML for webpage
  return (
    <div
      className={
        isPopupGrown
          ? "fixed top-1/2 left-1/2 w-3/5 transform -translate-x-1/2 -translate-y-1/2 bg-popup-gray border border-gray-300 shadow-md p-6 relative"
          : "fixed top-1/2 left-1/2 w-1/4 transform -translate-x-1/2 -translate-y-1/2 bg-popup-gray border border-gray-300 shadow-md p-6 relative"
      }
    >
      <button
        className="absolute top-1 right-1 cursor-pointer fas fa-times"
        onClick={onClose}
      ></button>
      <div className="flex flex-col p-5 m-auto">
        <div className="flex items-center">
          <h1 className="whitespace-nowrap">
            <strong>Course:</strong>
          </h1>
          <select
            className="border border-light-gray rounded ml-2 mt-1"
            id="course-dropdown"
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e)}
          >
            <option key={-1} value="-1">
              Select...
            </option>
            {allCourseData.map((course) => (
              <option key={course.id} value={course.id}>
                {course.course_name}
              </option>
            ))}
          </select>
        </div>
        {isCourseVisible && (
          <div className="flex flex-col mt-3">
            <div id="dropdown" className="flex flex-row">
              <h1 className="whitespace-nowrap">
                <strong>Program:</strong>
              </h1>
              <select
                className="border border-light-gray rounded ml-2"
                id="course-dropdown"
                value={selectedProgramId}
                onChange={(e) => handleProgramChange(e)}
              >
                <option key={-1} value="">
                  Select...
                </option>
                {selectedCourseData.programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2">
              {programDescriptions.length > 0 && selectedProgramId !== "" && (
                <div>
                  <label className="font-bold">Description: </label>
                  <p>
                    {programDescriptions.find(
                      (desc) => desc.id === selectedProgramId
                    )?.description || "No Description"}
                  </p>
                </div>
              )}
            </div>
            <div className="flex">
              {showCalendar && (
                <div className="w-4/5">
                  <ScheduleMeeting
                    borderRadius={10}
                    primaryColor="#4b2e83"
                    eventDurationInMinutes={selectedTimeDuration}
                    availableTimeslots={availableTimeslots}
                    onStartTimeSelect={handleStartTimeSelect}
                  />
                </div>
              )}
              {showAppointmentPanel && selectedTimeslot && (
                <div className="rounded shadow-2xl w-1/3 m-4">
                  <div className="m-5">
                    <h3 className="text-center pb-5 font-bold">
                      Appointment Details
                    </h3>
                    <p className="pb-2">
                      <b>Name</b>:{" "}
                      {selectedCourseData.programs.find(
                        (name) => name.id === selectedProgramId
                      )?.name || ""}
                    </p>
                    <p className="pb-2">
                      <b>Date</b>: {format(selectedTimeslot.startTime, "PPPP")}
                    </p>
                    <p className="pb-2">
                      <b>Time</b>: {format(selectedTimeslot.startTime, "p")} -{" "}
                      {format(selectedTimeslot.availableTimeslot.endTime, "p")}{" "}
                      (PST)
                    </p>
                    <p className="pb-2">
                      <b>Duration:</b> {selectedTimeDuration} minutes
                    </p>
                    <label>
                      <b>Notes</b> (optional):
                    </label>
                    <textarea
                      className="w-full border border-light-gray"
                      id="appointmentNotes"
                      value={appointmentNotes}
                      onChange={(e) => setAppointmentNotes(e.target.value)}
                      placeholder="Please share anything that will help us prepare for the meeting."
                    />
                    <div
                      id="button-container"
                      className="flex flex-row justify-end"
                    >
                      <button
                        onClick={bookAppointment}
                        className="bg-purple text-white p-2 rounded mr-3 mt-5 "
                      >
                        Confirm
                      </button>
                      <button
                        onClick={cancelSelectedSlot}
                        className="bg-purple text-white p-2 rounded mt-5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleAppointmentPopup;