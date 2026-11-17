import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] =  useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return response.status;
    } else {
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      setToken(data.access_token);
      return data;
    }
  };

  const refresh = async () => {
    try {
      const currentToken = localStorage.getItem('access_token');

      if (!currentToken) {
        setToken(null);
        return null;
      }

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(error);

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('access_token');
          setToken(null);
        }


        return null;
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } finally {
      localStorage.removeItem('access_token');
      setToken(null);

    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout, refresh, loading }}>
      {!loading && children }
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
