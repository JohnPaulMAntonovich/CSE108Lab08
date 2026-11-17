import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Sends one request with the login token. Throws with the backend's message on failure.
async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || data?.detail || `Request failed (HTTP ${response.status})`);
  }
  return data;
}

export default function StudentView() {
  const { refresh, logout } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('mine'); // 'mine' = Your Courses, 'add' = Add Courses
  const [myCourses, setMyCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null); // course being added/dropped

  // Load both lists: the student's courses and every course offered.
  const loadCourses = async (studentId) => {
    const [mine, all] = await Promise.all([
      request(`/api/students/${studentId}/courses`),
      request('/api/courses'),
    ]);
    setMyCourses(mine.courses);
    setAllCourses(all);
  };

  useEffect(() => {
    refresh().then((result) => {
      if (result == null || result.role !== 'student') {
        navigate('/');
        return;
      }
      setUser(result);
      loadCourses(result.person_id).catch((err) => setError(err.message));
    });
  }, []);

  const signoff = async () => {
    await logout();
    navigate('/');
  };

  const addCourse = async (courseId) => {
    setError('');
    setBusyId(courseId);
    try {
      await request(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      await loadCourses(user.person_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const dropCourse = async (courseId) => {
    setError('');
    setBusyId(courseId);
    try {
      await request(`/api/courses/${courseId}/enroll/${user.person_id}`, { method: 'DELETE' });
      await loadCourses(user.person_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return null;

  const myCourseIds = new Set(myCourses.map((course) => course.id));
  const rows = tab === 'mine' ? myCourses : allCourses;
  const hasTime = rows.some((course) => course.time);

  // Add Courses column: drop if enrolled, add if seats are left, nothing if full.
  const actionButton = (course) => {
    if (myCourseIds.has(course.id)) {
      return (
        <button type="button" className="icon-button drop" aria-label={`Drop ${course.course_code}`}
          disabled={busyId === course.id} onClick={() => dropCourse(course.id)}>-</button>
      );
    }
    if (course.available_seats > 0) {
      return (
        <button type="button" className="icon-button add" aria-label={`Add ${course.course_code}`}
          disabled={busyId === course.id} onClick={() => addCourse(course.id)}>+</button>
      );
    }
    return null;
  };

  return (
    <div className="app-frame">
      <header className="app-header">
        <span className="app-welcome">Welcome {user.full_name.split(' ')[0]}!</span>
        <h1 className="app-title">ACME University</h1>
        <button type="button" className="link-button app-signout" onClick={signoff}>Sign out</button>
      </header>

      <main className="panel">
        <div className="tabs">
          <button type="button" className={tab === 'mine' ? 'tab active' : 'tab'} onClick={() => setTab('mine')}>
            Your Courses
          </button>
          <button type="button" className={tab === 'add' ? 'tab active' : 'tab'} onClick={() => setTab('add')}>
            Add Courses
          </button>
        </div>

        <div className="panel-body">
          {error && <p className="message error">{error}</p>}
          {tab === 'mine' && myCourses.length === 0 && (
            <p className="message">You are not enrolled in any courses yet.</p>
          )}
          {rows.length > 0 && (
            <table className="acme-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Teacher</th>
                  {hasTime && <th>Time</th>}
                  <th>Students Enrolled</th>
                  {tab === 'add' && <th>Add class</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((course) => (
                  <tr key={course.id}>
                    <td>
                      {course.course_code}
                      <span className="course-subtitle">{course.course_name}</span>
                    </td>
                    <td>{course.teacher_name}</td>
                    {hasTime && <td>{course.time}</td>}
                    <td>{course.enrolled}/{course.capacity}</td>
                    {tab === 'add' && <td className="action-cell">{actionButton(course)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}