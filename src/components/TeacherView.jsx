import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import TeacherPage from './TeacherPage.jsx';

export default function TeacherView() {
  const { token, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    refresh().then((result) => {
      if (result == null || result.role !== 'teacher') {
        navigate('/');
      } else {
        setUser(result);
      }
    });
  }, []);

  if (!user) return null;

  return (
    <TeacherPage
      user={user}
      token={token}
      onSignOut={async () => {
        await logout();
        navigate('/');
      }}
    />
  );
}
