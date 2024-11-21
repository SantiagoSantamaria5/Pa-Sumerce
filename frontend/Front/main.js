// Configuración global
const API_BASE_URL = 'http://localhost:5000/api';

// Utilidad para manejar errores de red
class NetworkError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'NetworkError';
    }
}

// Función simplificada para realizar solicitudes al backend
async function sendRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit', // Cambiado a 'omit' para pruebas iniciales
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log('Sending request to:', `${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Log de la respuesta para debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        // Intentar obtener el cuerpo de la respuesta
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new NetworkError(
                typeof data === 'object' ? data.message : data,
                response.status
            );
        }

        return data;
    } catch (error) {
        console.error('Error completo:', error);
        if (error instanceof NetworkError) {
            throw error;
        }
        throw new NetworkError('Error de conexión con el servidor', 500);
    }
}

// Manejador del formulario de login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const submitButton = e.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Iniciando sesión...';
        messageDiv.textContent = '';
        messageDiv.className = '';

        console.log('Intentando login con:', { username });
        const data = await sendRequest('/login', 'POST', { username, password });
        
        console.log('Respuesta de login:', data);
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            window.location.href = '/menu.html';
        } else {
            throw new Error('No se recibió el token de autenticación');
        }
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        messageDiv.textContent = error.message || 'Error al iniciar sesión';
        messageDiv.className = 'message error';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Ingresar';
    }
});


// Manejador del formulario de insumos
