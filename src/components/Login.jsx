import { useState, useEffect, createContext, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import './../App.css';

export default function Login() {
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const { login, refresh } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refresh().then(async (result) => {
      if (result != null) {
        if (result.role === 'student') {
          navigate('/StudentView');
        } else if (result.role === 'teacher') {
          navigate('/TeacherView');
        }
      }
    });
  }, []);

  const onSubmit = async (formData) => {
    setError('');

    try {
      const loginAttempt = await login(formData.username, formData.password);

      if (loginAttempt === 401 ) {
        setError('Invalid Username or Password');
        return;
      } else if (loginAttempt === 500) {
        setError('Internal Server Error');
      }

      if (loginAttempt.user.role === 'student') {
        navigate('/StudentView');
      } else if (loginAttempt.user.role === 'teacher') {
        navigate('/TeacherView');
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="login-area">
        <div className="wave">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <form className="login" onSubmit={handleSubmit(onSubmit)}>
          <h2>Login</h2>
          {errors.username && <span className="red-error" style={{ color: "red" }}>Username is required</span>}
          <input
            className="text-input"
            type="username"
            {...register('username', { required: true })}
            placeholder="Username"
          />

          {errors.password && <span className="red-error" style={{ color: "red" }}>Password is required</span>}


          <input
            className="text-input"
            type="password"
            {...register('password', { required: true })}
            placeholder="Password"
          />

          <span className="red-error" style={{ color: "red" }}>{ error }</span>

          <input type="submit" />
        </form>
      </div>
    </>
  );
}
