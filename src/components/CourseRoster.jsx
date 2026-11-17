import { useEffect, useState } from "react";

// One course's roster (Lab 8 slide 10): back arrow, Student Name | Grade,
// and every grade is editable.
//
// Props (all passed in by TeacherPage):
//   course    - the course object the teacher clicked
//   teacherId - the logged-in teacher's person_id
//   request   - TeacherPage's request function (adds the login token)
//   onBack    - returns to the "Your Courses" table
export default function CourseRoster({ course, teacherId, request, onBack }) {
  const [students, setStudents] = useState(null); // null = still loading
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load the students and their grades for this course.
  // Response: { course_id, course_name, students: [{ student_id, name, email, grade, updated_at }] }
  // grade is null if the teacher hasn't set one yet.
  useEffect(() => {
    let ignore = false;
    request(`/api/teachers/${teacherId}/courses/${course.id}/grades`)
      .then((data) => {
        if (!ignore) setStudents(data.students);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [request, teacherId, course.id]);

  // Save one grade, then update that student's row with the saved value.
  // The backend only accepts a number from 0 to 100 (a string like "88" gets a 400).
  async function saveGrade(student, grade) {
    setError("");
    setNotice("");
    try {
      const result = await request(
        `/api/teachers/${teacherId}/courses/${course.id}/students/${student.student_id}/grade`,
        { method: "POST", body: JSON.stringify({ grade }) }
      );
      setStudents((current) =>
        current.map((s) =>
          s.student_id === student.student_id ? { ...s, grade: result.grade } : s
        )
      );
      setNotice(`Saved ${student.name}: ${result.grade}`);
    } catch (err) {
      setError(`${student.name}: ${err.message}`);
      throw err; // lets GradeCell mark the cell as failed
    }
  }

  return (
    <>
      <div className="panel-bar">
        <button type="button" className="back-button" onClick={onBack} aria-label="Back to your courses">
          &#8592;
        </button>
        <span className="panel-title">{course.course_code}</span>
      </div>

      <div className="panel-body">
        {error && <p className="message error">{error}</p>}
        {students === null && !error && <p className="message">Loading students...</p>}
        {students && students.length === 0 && (
          <p className="message">No students are enrolled in this course.</p>
        )}

        {students && students.length > 0 && (
          <>
            <table className="acme-table roster-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.student_id}>
                    <td>{student.name}</td>
                    <td>
                      <GradeCell
                        student={student}
                        onSave={saveGrade}
                        onInvalid={() => {
                          setNotice("");
                          setError(`${student.name}: Grade must be a number from 0 to 100.`);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="hint">Click a grade to edit it. Press Enter or click away to save, Esc to cancel.</p>
          </>
        )}

        {notice && <p className="message success">{notice}</p>}
      </div>
    </>
  );
}

// A grade that looks like plain table text until clicked (the mockup's "Editable" cell).
// Saves when the teacher presses Enter or clicks away; Esc puts the old value back.
function GradeCell({ student, onSave, onInvalid }) {
  const savedText = student.grade === null ? "" : String(student.grade);
  const [text, setText] = useState(savedText);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | invalid

  // When the saved grade changes (after a successful save), show it.
  useEffect(() => {
    setText(savedText);
  }, [savedText]);

  async function commit() {
    const trimmed = text.trim();

    // Nothing to save: unchanged, or cleared (the backend can't delete a grade).
    if (trimmed === "" || (savedText !== "" && Number(trimmed) === Number(savedText))) {
      setText(savedText);
      return;
    }

    const grade = Number(trimmed);
    if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
      setStatus("invalid");
      onInvalid();
      return;
    }

    setStatus("saving");
    try {
      await onSave(student, grade);
      setStatus("saved");
    } catch {
      setStatus("invalid");
    }
  }

  return (
    <input
      className={`grade-input ${status}`}
      type="number"
      min="0"
      max="100"
      step="any"
      placeholder="--"
      aria-label={`Grade for ${student.name}`}
      value={text}
      disabled={status === "saving"}
      onChange={(e) => {
        setText(e.target.value);
        setStatus("idle");
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur(); // blur triggers commit
        if (e.key === "Escape") {
          setText(savedText);
          setStatus("idle");
          const input = e.currentTarget;
          setTimeout(() => input.blur(), 0); // blur after the reset so nothing saves
        }
      }}
    />
  );
}