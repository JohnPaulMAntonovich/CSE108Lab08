import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import heroImg from './assets/hero.png';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import Login from './components/Login.jsx';
import StudentView from './components/StudentView.jsx';
import TeacherView from './components/TeacherView.jsx';
import { AuthProvider } from './components/AuthContext.jsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/StudentView" element={<StudentView />} />
          <Route path="/TeacherView" element={<TeacherView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
