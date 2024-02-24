import React, { useState, useContext, useEffect, useCallback } from 'react';
import { UserContext } from '../context/UserContext.js';
import { getCookie } from '../utils/GetCookie.js';
import { Tooltip } from './Tooltip.js';
import WeeklyCalendar from './WeeklyCalendar.js';
import { ClassContext } from "../context/ClassContext.js";
import ChooseMeetingDatesPopup from './ChooseMeetingDatesPopup.js';
import MeetingLocation from './MeetingLocation.js';


export default function Program() {
  // General Variables
  const csrfToken = getCookie('csrf_access_token');
  const { user } = useContext(UserContext);
  const [changesMade, setChangesMade] = useState(false);
  const [boxShown, setBoxShown] = useState(false);
  const [isPopUpVisible, setPopUpVisible] = useState(false);

  // Load Variables
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [loadProgramTable, setLoadProgramTable] = useState(false);
  const [resetOfficeHoursTable, setResetOfficeHoursTable] = useState(false);
  const [loadLocRec, setLocRec] = useState(false);
  const [post, setPost] = useState(false);

  // Class Data Variables
  const [programName, setProgramName] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [allCourseData, setAllCourseData] = useState([]);
  const [selectedClassData, setSelectedClassData] = useState({
    id: '',
    class_name: '',
    programs: [],
  });

  const [selectedProgramData, setSelectedProgramData] = useState({
    id: '',
    type: '',
    description: '',
    duration: '',
    physical_location: '',
    virtual_link: '',
    auto_approve_appointments: true,
    max_daily_meetings: '',
    max_weekly_meetings: '',
    max_monthly_meetings: '',
  });

  const [showSaveCancelButtons, setShowSaveCancelButtons] = useState({
    class_id: true,
    type: true,
    description: true,
    duration: true,
    physical_location: true,
    virtual_link: true
  });

  // Times Data Variables
  const [allTimesData, setAllTimesData] = useState({});
  const [selectedProgramTimesData, setSelectedProgramTimesData] = useState({});

  


  ////////////////////////////////////////////////////////
  //               Fetch Data Functions                 //
  ////////////////////////////////////////////////////////

  // fetch from database: all courses the user is associated with
  // can make a new backend function to only get courseIds
  const fetchCourseList = async () => {
    if (user.account_type !== "mentor") return;
  
    try {
      const response = await fetch(`/mentor/courses`, {
        credentials: 'include',
      });
  
      const fetchedCourseList = await response.json();
  
      setAllCourseData(fetchedCourseList);
    } catch (error) {
      console.error("Error fetching course list:", error);
    }
  };

  // fetch from database: all times the a courseId is associated with
  const fetchTimesData = async (courseId) => {
    if (!courseId) {
      return;
    }

    try {
      const response = await fetch(`/course/times/${encodeURIComponent(courseId)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'FetchTimesData failed');
      }

      const fetchedCourseTimes = await response.json();

      if (fetchedCourseTimes !== null) {
        const tempData = fetchedCourseTimes
          .filter(item => item.type !== 'class_times')
          .reduce((acc, item) => {
            const programId = item.program_id;
            
            if (!acc[programId]) {
              acc[programId] = {};
            }
            
            acc[programId][item.day] = {
              start_time: item.start_time,
              end_time: item.end_time,
            };
      
            return acc;
          }, {});
      
        setAllTimesData(tempData);
      } else {
        setAllTimesData({});
      }
    } catch (error) {
      console.error("Error fetching time info:", error);
    }
  };


  const fetchSelectedProgramTimesData = async (programId) => {
    if (!programId || programId === '-1') {
      setSelectedProgramTimesData({});
      return;
    }

    try {
      const response = await fetch(`/program/times/${encodeURIComponent(programId)}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'FetchTimesData failed');
      }

      const fetchedProgramTimes = await response.json();
      
      if (fetchedProgramTimes !== null) {
        //setAllTimesData(fetchedProgramTimes);

        const tempData = fetchedProgramTimes
          .reduce((acc, item) => {
            acc[item.day] = {
              start_time: item.start_time,
              end_time: item.end_time
            };
            return acc;
          }, {});

          setSelectedProgramTimesData(tempData);
      } else {
        setSelectedProgramTimesData({});
      }
    } catch (error) {
      console.error("Error fetching time info:", error);
    }
  };



  ////////////////////////////////////////////////////////
  //               Post Data Functions                  //
  ////////////////////////////////////////////////////////

  // called when user clicks save changes button
  // saves all class and times details to database
  const handleSaveChanges = async () => {
    if (Object.keys(selectedProgramTimesData).length > 0) {
      setAllTimesData({...allTimesData, [selectedProgramId]: selectedProgramTimesData});
      setPost(true);
    }
    if (selectedProgramData) {
      postProgramToDatabase();
    }
  };

  useEffect(() => {
    if (post) {
      postClassDetailsToDatabase();
    }
  }, [post]);

  // handleSaveChanges helper: update ClassTimes or 
  // ClassInformation table in database for attached course
  const postClassDetailsToDatabase = async () => {
    try {
        await fetch(`/course/setTime/${encodeURIComponent(selectedClassData.id)}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
          },
          body: JSON.stringify(allTimesData),
        });

      setChangesMade(false); // Hide Save/Cancel Buttons
    } catch (error) {
      console.error('Error saving class details:', error);
    }
  };


  const postProgramToDatabase = async () => {
    try {
        await fetch(`/program/setDetails`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({data: selectedProgramData, course_id: selectedCourseId}),
      });

      setChangesMade(false); // Hide Save/Cancel Buttons
    } catch (error) {
      console.error('Error saving program type details:', error);
    }
  };



  ////////////////////////////////////////////////////////
  //                  Load Functions                    //
  ////////////////////////////////////////////////////////

  // main webpage load function
  // called when user clicks to change selected course
  const handleCourseChange = (e) => {
    if (!e) {
      return;
    }

    // reload courseIds with all courses
    fetchCourseList();

    const selectedCourse = parseInt(e.target.value);

    // change selectedCourseId
    setSelectedCourseId(selectedCourse);

    // update course info displayed on page to selectedCourseId
    updateCourseInfo(selectedCourse);

    setSelectedProgramId('-1');
    updateProgramInfo('-1');
    //fetchSelectedProgramTimesData();
    setSelectedProgramTimesData({});

    // update timesData to selectedCourseId
    fetchTimesData(selectedCourse);

    // flag to child objects to reload their information
    // with times data or selectedClassData
    reloadChildInfo();
    setChangesMade(false);
  };

  const handleProgramChange = (e) => {
    if (!e) {
      return;
    }

    let selectedProgram = parseInt(e.target.value);

    if (!selectedProgram) {
      selectedProgram = -1;
    }

    // change selectedCourseId
    setSelectedProgramId(selectedProgram);

    // update course info displayed on page to selectedCourseId
    updateProgramInfo(selectedProgram);

    // update timesData to selectedCourseId
    fetchSelectedProgramTimesData(selectedProgram);
    setSelectedProgramTimesData(selectedProgramTimesData[selectedProgram]);

    // flag to child objects to reload their information
    // with times data or selectedClassData
    setChangesMade(false);
  };


  // update the selectedClassData based on a courseId
  const updateCourseInfo = (courseId) => {
    if (!courseId) {
      setSelectedClassData({});
      return;
    }

    const selectedCourse = allCourseData.find(course => course.id === courseId);

    if (selectedCourse) {
      // Update selectedClassData with selectedCourse.id
      setSelectedClassData(selectedCourse);
    }
  };

  const updateProgramInfo = (programId) => {
    if (!programId || programId === '-1') {
      setSelectedProgramData({});
      return;
    }

    const selectedProgram = selectedClassData.programs.find(program => program.id === programId);

    if (selectedProgram) {
      // Update selectedClassData with selectedCourse.id
      setSelectedProgramData(selectedProgram);
    }
  };

  // called when information on the webpage needs to be reloaded
  // will flag to child objects to reload their information
  const reloadChildInfo = () => {
    setLoadProgramTable(!loadProgramTable);
  };



  ////////////////////////////////////////////////////////
  //               Local Data Functions                 //
  ////////////////////////////////////////////////////////

  // update classData with user input
  const handleInputChange = (e) => {
    if (!e || e.target.value === 'a') {
      return;
    }


    if (e.target.name === "duration") {
      if (Number(e.target.value) > 0) {
        let maxRecommendedTimeSplit = 1440;

        for (const data of Object.entries(selectedProgramTimesData)) {
          const startDate = new Date(`1970-01-01T${data[1].start_time}`);
          const endDate = new Date(`1970-01-01T${data[1].end_time}`);
      
          const timeDifference = endDate - startDate;
          const minutes = Math.floor(timeDifference / (1000 * 60));
          if (minutes < maxRecommendedTimeSplit) {
            maxRecommendedTimeSplit = minutes;
          }
        }

        if (e.target.value > maxRecommendedTimeSplit) {
          setTimeout(() => {
            window.alert("Time Split value is too large. Lower your time split");
          }, 10);
        }
      }
    }

    let newValue = e.target.value;

    // Handle the radio button specifically
    if (e.target.type === 'radio') {
      newValue = e.target.value === 'true'; // Convert the value to boolean
    }

    setSelectedProgramData({ ...selectedProgramData, [e.target.name]: newValue });

    const selectedCourse = selectedClassData.programs.find(
      (program) => program.id === selectedProgramData.id
    );

    // Update showButtons state
    setShowSaveCancelButtons((prevButtons) => ({
      ...prevButtons,
      [e.target.name]: e.target.value === selectedCourse[e.target.name],
    }));
  };

  const createProgramType = async () => {
    try {
      const payload = {
        name: programName,
        course_id: selectedCourseId
      };

      await fetch(`/course/add-program`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      setIsPageLoaded(false); // flag to reload page to add new program to dropdown selector
    } catch (error) {
      console.error("Error creating program:", error);
    }
  };

  // update timesData based on user entries
  const handleTimesChange = (e) => {
    if (!e) {
      return;
    }
  
    const tempType = e.type;
    const tempDay = e.name;
    const tempValue = e.value;
  
    // Create a new object to store the modified data
    let updatedTimesData = { ...selectedProgramTimesData };
  
    // Check if the day already exists in selectedProgramTimesData
    if (tempValue.length === 0) {
      // If e.value.length == 0, delete the day from selectedProgramTimesData
      if (updatedTimesData[tempDay]) {
        delete updatedTimesData[tempDay];
      }
    } else {
      // If the day exists, override its values; otherwise, create a new entry
      updatedTimesData = {
        ...updatedTimesData,
        [tempDay]: {
          start_time: tempValue[0],
          end_time: tempValue[1],
        },
      };
    }
  
    // Set the selectedProgramTimesData variable
    setSelectedProgramTimesData(updatedTimesData);
  };
  
  
  

  const handleLimitInputChange = (e) => {
    const { name, value } = e.target;
    let newLimitData = { ...selectedProgramData, [name]: parseInt(value, 10) || 0 };

    // Ensure daily limit doesn't exceed weekly or total limit
    if (name === 'max_daily_meetings') {
      if (newLimitData.max_daily_meetings > newLimitData.max_weekly_meetings) {
        newLimitData.max_weekly_meetings = newLimitData.max_daily_meetings;
      }
      if (newLimitData.max_daily_meetings > newLimitData.max_monthly_meetings) {
        newLimitData.max_monthly_meetings = newLimitData.max_daily_meetings;
      }
    }

    // Ensure weekly limit is between daily limit and total limit
    if (name === 'max_weekly_meetings') {
      if (newLimitData.max_weekly_meetings < newLimitData.max_daily_meetings) {
        newLimitData.max_daily_meetings = newLimitData.max_weekly_meetings;
      }
      if (newLimitData.max_weekly_meetings > newLimitData.max_monthly_meetings) {
        newLimitData.max_monthly_meetings = newLimitData.max_weekly_meetings;
      }
    }

    // Ensure total limit isn't less than daily or weekly limit
    if (name === 'max_monthly_meetings') {
      if (newLimitData.max_monthly_meetings < newLimitData.max_daily_meetings) {
        newLimitData.max_daily_meetings = newLimitData.max_monthly_meetings;
      }
      if (newLimitData.max_monthly_meetings < newLimitData.max_weekly_meetings) {
        newLimitData.max_weekly_meetings = newLimitData.max_monthly_meetings;
      }
    }

    setSelectedProgramData({
      ...selectedProgramData, 
      "max_daily_meetings": newLimitData.max_daily_meetings, 
      "max_weekly_meetings": newLimitData.max_weekly_meetings,
      "max_monthly_meetings": newLimitData.max_monthly_meetings,
    });
  };

  // handle to cancel webpage changes when user is done editing details
  const handleCancelChanges = () => {
    // Reset form data to initial meeting data
    updateCourseInfo(selectedClassData.id);
    updateProgramInfo(selectedProgramId);
    setResetOfficeHoursTable(true);
    reloadChildInfo();
    if (allTimesData[selectedProgramId]) {
      setSelectedProgramTimesData(allTimesData[selectedProgramId]);
    } else {
      setSelectedProgramTimesData({});
    }
    setChangesMade(false); // Reset changes made
  };

  const showBox = () => {
    if (boxShown) {
      // need to make work with save/cancel changes button
      handleInputChange({target: {name: 'duration', value: ''}});
      setBoxShown(false);
    } else {
      setBoxShown(true);
    }
  };



  ////////////////////////////////////////////////////////
  //               UseEffects Functions                 //
  ////////////////////////////////////////////////////////

  useEffect(() => {
    if (!isPageLoaded) {
      fetchCourseList();
      setIsPageLoaded(!isPageLoaded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPageLoaded, user]);

  useEffect(() => {
    reloadChildInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramTimesData]);

  // check if all values are same as original
  useEffect(() => {
    setChangesMade(
      !Object.values(showSaveCancelButtons).every((value) => value === true)
    );
  }, [showSaveCancelButtons]);

  useEffect(()=> {
    if (Number(selectedProgramData.duration) > 0) {
      setBoxShown(true);
    }
  }, [selectedProgramData]);

  /*handleInputChange({target: {name: 'duration', value: ''}});
      setSelectedProgramData({ ...selectedProgramData, duration: '' });*/

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== '-1') {
      updateCourseInfo(selectedCourseId);
    }
  }, [selectedCourseId, allCourseData]);

  useEffect(() => {
    //console.log(selectedClassData);
    //console.log(allTimesData);
    //console.log(allCourseData);
    //console.log(selectedProgramData);
    //console.log(selectedProgramTimesData);
  }, [selectedClassData, allTimesData, allCourseData, selectedProgramData, selectedProgramTimesData]);


  if (!user) {
    return <div>Loading user data...</div>;
  }

  // HTML for webpage
  return (
    <div>
      <div className="flex flex-col m-auto">
        <div className="w-3/4 p-5 m-auto">
          <div className="flex items-center">
            <h1>
              <strong>Select Course:</strong>
            </h1>
            <select
              className="border border-light-gray rounded ml-2"
              id="course-dropdown"
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e)}
            >
              <option key={-1} value="-1">
                Select...
              </option>
              {allCourseData.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.class_name}
                </option>
              ))}
            </select>
            <div className="flex flex-row items-center ml-5">
              <h1>
                <strong>Select Program type:</strong>
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
                {selectedClassData.programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.type}</option>
                ))}
              </select>
              <button
                className="font-bold border border-light-gray rounded-md shadow-md text-sm px-1 py-1 ml-4"
                onClick={createProgramType}
              >
                Create Program Type
              </button>
              <input
                className="border border-light-gray ml-2"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
              />
            </div>
          </div>
        </div>

        
        <div className="flex flex-col w-3/4 px-5 m-auto">
          <div className='py-5 border border-light-gray rounded-md shadow-md'>
            <div className="relative">
              <button className="font-bold border border-light-gray rounded-md shadow-md text-sm px-3 py-3 absolute inset-y-10 right-0 flex justify-center items-center mr-6">
                Auto Generate Details
              </button>
            </div>
            <h2 className="pb-10 text-center font-bold text-2xl">
              Class Availability
            </h2>

            
            <div className="flex flex-col">
              <div className="w-3/4 m-auto">
              <div className='flex flex-col p-5 border border-light-gray rounded-md shadow-md mt-5'>
                  <div>
                      <label className='font-bold'>Program Description &nbsp;</label>
                    <Tooltip text="Description of the program type related to meetings for a class.">
                      <span>ⓘ</span>
                    </Tooltip>

                  </div>
                  <textarea
                    className="border border-light-gray mt-3"
                    name="description"
                    value={selectedProgramData.description ?? ""}
                    //onChange={(event) => handleInputChange(event)}
                  />
                </div>
                {/* Office Hours Times */}

                <div className="flex-1 flex-col p-5 border border-light-gray rounded-md shadow-md mt-5">
                  <WeeklyCalendar
                    isClassTimes={false}
                    param={{
                      functionPassed: handleTimesChange,
                      loadPageFunction: setLoadProgramTable,
                      changesMade: setChangesMade,
                      resetFunction: setResetOfficeHoursTable,
                    }}
                    times={selectedProgramTimesData}
                    loadPage={loadProgramTable}
                    reset={resetOfficeHoursTable}
                    program_id={selectedProgramData.id}
                    program_type={selectedProgramData.type}
                  />
                </div>

                <div className="flex flex-row items-center mt-4">
                  <label className="whitespace-nowrap font-bold text-2xl">
                    Create Drop-Ins?
                  </label>
                  <input
                    type="checkbox"
                    id="myCheckbox"
                    class="form-checkbox h-6 w-7 text-blue-600 ml-2 mt-1"
                    checked={!boxShown}
                    onChange={showBox}
                  ></input>
                  {boxShown && (
                    <>
                      <label className="whitespace-nowrap ml-2">
                        Meeting Duration:
                      </label>
                      <input
                        className="border border-light-gray ml-1 mt-1"
                        name="duration"
                        value={selectedProgramData.duration}
                        onChange={(event) => {
                          const inputValue = event.target.value;
                          const numericValue = inputValue.replace(/[^0-9]/g, "a"); // Remove non-numeric characters
                          handleInputChange({
                            target: { name: "duration", value: numericValue },
                          });
                        }}
                      />
                    </>
                  )}
                  <button
                    className="ms-auto font-bold border border-light-gray rounded-md shadow-md text-sm px-2 py-2"
                    onClick={() => setPopUpVisible(!isPopUpVisible)}
                  >
                    Choose Meeting Dates
                  </button>
                </div>
              </div>
            </div>
          </div>
          <MeetingLocation
            isClassLocation={false}
            param={{
              functionPassed: handleInputChange,
              loadPageFunction: setLocRec,
              changesMade: setChangesMade,
            }}
            data={{
              physical_location: selectedProgramData.physical_location,
              virtual_link: selectedProgramData.virtual_link,
            }}
            loadPage={loadLocRec}
            changes={changesMade}
          />
          <div className="w-3/4 flex flex-row p-4 border border-light-gray rounded-md shadow-md m-auto mt-5">
            {user?.account_type === "mentor" && (
              <div className="w-1/2">
                <label className="font-bold text-lg">
                  Auto-Accept Meeting Requests?
                </label>
                <br />
                <label className="ml-2">
                  Yes
                  <input
                    className="mb-3 ml-1"
                    type="radio"
                    name="auto_approve_appointments"
                    value="true"
                    checked={selectedProgramData.auto_approve_appointments === true}
                    onChange={handleInputChange}
                  />
                </label>
                &nbsp;&nbsp;
                <label>
                  No
                  <input
                    className="ml-1"
                    type="radio"
                    name="auto_approve_appointments"
                    value="false"
                    checked={selectedProgramData.auto_approve_appointments === false}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
            )}
            {user?.account_type === "mentor" && (
              <div className="flex flex-col">
                <h2 className="font-bold text-lg">Set Meeting Limits</h2>
                <div className="flex flex-row justify-between">
                  <div className="flex flex-col mr-5">
                    <label>Daily Max</label>
                    <input
                      className="border border-light-gray w-28"
                      type="number"
                      name="max_daily_meetings"
                      min="1"
                      value={selectedProgramData.max_daily_meetings}
                      onChange={handleLimitInputChange}
                    />
                  </div>
                  <div className="flex flex-col mr-5">
                    <label>Weekly Max</label>
                    <input
                      className="border border-light-gray w-28"
                      type="number"
                      name="max_weekly_meetings"
                      min="1"
                      value={selectedProgramData.max_weekly_meetings}
                      onChange={handleLimitInputChange}
                    />
                  </div>
                  <div className="flex flex-col">
                    <label>Total Max</label>
                    <input
                      className="border border-light-gray w-28"
                      type="number"
                      name="max_monthly_meetings"
                      min="1"
                      value={selectedProgramData.max_monthly_meetings}
                      onChange={handleLimitInputChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

       
        
        
        <div className='w-3/4 m-auto'>
        
        </div>
        {changesMade && (
              <div className="flex flex-row justify-end my-5">
                <button
                  className="bg-purple text-white rounded-md p-2 mr-2 hover:text-gold"
                  onClick={handleSaveChanges}
                >
                  Save Class Changes
                </button>
                <button
                  className="bg-purple text-white rounded-md p-2 hover:text-gold"
                  onClick={handleCancelChanges}
                >
                  Discard Class Changes
                </button>
              </div>
            )}
      </div>

      {isPopUpVisible && (
        <div className='absolute inset-0 z-10'>
          <ChooseMeetingDatesPopup
            onClose={() => setPopUpVisible(false)}
            data={selectedProgramTimesData}
            id={selectedCourseId}
            duration={selectedProgramData.duration}
            physical_location={selectedProgramData.physical_location}
            program_id={selectedProgramId}
            program_name={selectedProgramData.type}
          />
        </div>
   
      )}
    </div>
  );
}