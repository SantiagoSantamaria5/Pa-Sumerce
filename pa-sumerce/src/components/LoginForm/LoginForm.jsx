import React from 'react';
import './LoginForm.css';
import { FaUserAstronaut } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
    

export const LoginForm = () => {
  return (
    <div className='wrapper'>
        <form action="">
            <h1>Login </h1>
          {// cuadro de Usuario
           }
            <div className="input-box"> 
                <input type="text" placeholder="Ingresa tu usuario" required/>
                <FaUserAstronaut className='icon' />
            </div>
            {//cuadro de contraseña 
            }   
            <div className="input-box"> 
                <input type="password" placeholder="Ingresa tu contraseña" required/>
                <FaLock className='icon' />
            </div>  
            {//recuerdame y Olvide mi contraseña
            }
            <div className="remember-forgot">
                <label> <input type='checkbox' /> Recuerdame </label>
                <a href='#'> Olvide mi Contraseña :c </a>
            </div>

            <button type='Sybmit'> Ingresar </button>

            <div className="register-link">
                <p>No posees una cuenta? <a href='#'> Registrar </a></p>
            </div>
        </form>
    </div>
  )
}
