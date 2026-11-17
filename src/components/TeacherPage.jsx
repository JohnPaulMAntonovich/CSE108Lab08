import { useCallback, useEffect, useState } from "react";
import CourseRoster from "./CourseRoster";

const API_BASE = "";

// Sends one request to the Flask backend with the login token attached.
// Returns the JSON body, or throws an Error with the backend's message.
async function apiRequest(token, path, options = {}) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // fetch only throws when the request never got a response (CORS or network)
    throw new Error("Could not reach the backend (CORS or network error).");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // the backend uses "error" on course/grade routes and "detail" on login routes
    throw new Error(data?.error || data?.detail || `Request failed (HTTP ${response.status})`);
  }
  return data;
}

// Teacher view from Lab 8 (slides 9 and 10).
//
// App.js renders this after a teacher logs in:
//   <TeacherPage user={user} token={token} onSignOut={handleSignOut} />
//
//   user      - the "user" object from the login response:
//               { username, full_name, role, person_id }
//               person_id is this teacher's ID in every teacher URL
//   token     - the "access_token" from the login response
//   onSignOut - App.js function that clears the saved login and shows the login page
export default function TeacherPage({ user, token, onSignOut }) {
  const teacherId = user.person_id;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openCourse, setOpenCourse] = useState(null); // null = show course list

  // useCallback keeps the same function between renders (until the token
  // changes), so effects that depend on it don't re-run every render.
  const request = useCallback(
    (path, options) => apiRequest(token, path, options),
    [token]
  );

  // Load the teacher's courses once when the page opens.
  useEffect(() => {
    let ignore = false; // stops a late response from updating after unmount
    request(`/api/teachers/${teacherId}/courses`)
      .then((data) => {
        if (!ignore) setCourses(data.courses);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [request, teacherId]);

  async function handleSignOut() {
    try {
      await request("/api/auth/logout", { method: "POST" }); // invalidates the token on the server
    } catch {
      // sign out locally even if the server call fails
    }
    onSignOut();
  }

  return (
    <div className="app-frame">
      <header className="app-header">
        <span className="app-welcome">Welcome {user.full_name}!</span>
        <h1 className="app-title">ACME University</h1>
        <button type="button" className="link-button app-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      <main className="panel">
        {openCourse ? (
          <CourseRoster
            course={openCourse}
            teacherId={teacherId}
            request={request}
            onBack={() => setOpenCourse(null)}
          />
        ) : (
          <>
            <div className="panel-bar">
              <span className="panel-title">Your Courses</span>
            </div>
            <div className="panel-body">
              {error && <p className="message error">{error}</p>}
              {loading && <p className="message">Loading courses...</p>}
              {!loading && !error && courses.length === 0 && (
                <p className="message">You are not teaching any courses.</p>
              )}
              {courses.length > 0 && <CourseTable courses={courses} onOpen={setOpenCourse} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// "Your Courses" table: Course Name (click to open), Teacher, Time, Students Enrolled.
function CourseTable({ courses, onOpen }) {
  // The backend has no meeting-time field yet. The Time column shows up
  // automatically once courses come back with a "time" value.
  const hasTime = courses.some((course) => course.time);

  return (
    <table className="acme-table">
      <thead>
        <tr>
          <th>Course Name</th>
          <th>Teacher</th>
          {hasTime && <th>Time</th>}
          <th>Students Enrolled</th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => (
          <tr key={course.id}>
            <td>
              <button type="button" className="link-button" onClick={() => onOpen(course)}>
                {course.course_code}
              </button>
              <span className="course-subtitle">{course.course_name}</span>
            </td>
            <td>{course.teacher_name}</td>
            {hasTime && <td>{course.time}</td>}
            <td>
              {course.enrolled}/{course.capacity}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}