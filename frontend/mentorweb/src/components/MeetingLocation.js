/* MeetingLocation.js
 * Last Edited: 3/9/24
 *
 * Entry Field UI for the physical_location, virtual_link,
 * and class_recordings_link for programs
 *
 * Known bugs:
 * - Set Office Location label for the object is outdated
 *
 */

export default function MeetingLocation({
  isCourseInfoProgram,
  functions,
  data,
}) {
  ////////////////////////////////////////////////////////
  //                 Handler Functions                  //
  ////////////////////////////////////////////////////////

  // passing entry of location and links for programs
  // back to Program.js
  const handleInputChange = (e) => {
    functions.inputChangeFunction({
      target: {
        name: e.target.name,
        value: e.target.value,
      },
    });
  };

  ////////////////////////////////////////////////////////
  //                 Render Functions                   //
  ////////////////////////////////////////////////////////

  // HTML for webpage
  // conditional rendering of boxes if isClassLocation is true or not
  return (
    <div className={isCourseInfoProgram ? "w-2/3 m-auto" : "w-full m-auto"}>
      <div
        className={
          isCourseInfoProgram
            ? "flex flex-col p-5 border border-light-gray rounded-md shadow-md mt-5"
            : "flex flex-row p-5 border border-light-gray rounded-md shadow-md m-auto mt-5 justify-between"
        }
      >
        <div className="flex">
          <label className="whitespace-nowrap font-bold text-2xl mb-2">
            Set Program Location:
          </label>
        </div>
        <div
          className={
            isCourseInfoProgram
              ? "flex flex-row items-center mb-2"
              : "flex flex-row items-center mb-1"
          }
        >
          <label
            className={
              isCourseInfoProgram
                ? "whitespace-nowrap"
                : "whitespace-nowrap ml-2"
            }
          >
            In-Person Location:
          </label>
          <input
            className="border border-light-gray ml-2 w-40 hover:bg-gray"
            name={"physical_location"}
            value={data.physical_location ?? ""}
            onChange={handleInputChange}
            onBlur={functions.saveChangeFunction}
          />
        </div>
        <div
          className={
            isCourseInfoProgram
              ? "flex flex-row items-center mb-2"
              : "flex flex-row items-center mb-1"
          }
        >
          <label className={"whitespace-nowrap"}>Virtual Meeting Link:</label>
          <input
            className="border border-light-gray ml-2 w-40 hover:bg-gray"
            name={"virtual_link"}
            value={data.virtual_link ?? ""}
            onChange={handleInputChange}
            onBlur={functions.saveChangeFunction}
          />
        </div>

        {isCourseInfoProgram && (
          <div>
            <label className="whitespace-nowrap">Course Recordings Link:</label>
            <input
              className="border border-light-gray ml-2 w-40 hover:bg-gray"
              name="class_recordings_link"
              value={data.class_recordings_link ?? ""}
              onChange={handleInputChange}
              onBlur={functions.saveChangeFunction}
            />
          </div>
        )}
      </div>
    </div>
  );
}
