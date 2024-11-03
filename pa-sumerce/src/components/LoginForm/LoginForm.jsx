import React, { useState } from 'react';
import './LoginForm.css';
import { FaUserAstronaut, FaLock } from "react-icons/fa";
import axios from 'axios';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      if (response.data.success) {
        setMessage('Inicio de sesión exitoso');
        // Puedes redirigir al usuario o guardar el estado de sesión aquí
      } else {
        setMessage('Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setMessage('Error en el servidor');
    }
  };

  return (
    <div className="wrapper d-flex justify-content-center align-items-center vh-100">
      <form className="p-4 border rounded shadow-sm" onSubmit={handleLogin}>
        <h1 className="mb-4 text-center">Login</h1>

        <div className="input-box mb-3 position-relative">
          <input
            type="text"
            className="form-control"
            placeholder="Ingresa tu usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <FaUserAstronaut className="icon position-absolute" />
        </div>

        <div className="input-box mb-3 position-relative">
          <input
            type="password"
            className="form-control"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FaLock className="icon position-absolute" />
        </div>

        <button type="submit" className="btn btn-primary w-100">Ingresar</button>

        {message && <p className="text-center mt-3">{message}</p>}
      </form>
    </div>
  );
};

export { LoginForm };
