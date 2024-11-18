document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const submitButton = e.target.querySelector('button[type="submit"]');

    // Deshabilitar el botón y mostrar estado de carga
    submitButton.disabled = true;
    submitButton.textContent = 'Iniciando sesión...';
    messageDiv.textContent = '';

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            messageDiv.textContent = '¡Inicio de sesión exitoso!';
            messageDiv.className = 'message success';
            
            // Guardar datos del usuario
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirigir al dashboard (descomentar cuando esté listo)
            window.location.href = '/menu.html';
        } else {
            messageDiv.textContent = data.message || 'Error en el inicio de sesión';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.textContent = error.message || 'Error de conexión con el servidor';
        messageDiv.className = 'message error';
    } finally {
        // Restaurar el botón
        submitButton.disabled = false;
        submitButton.textContent = 'Ingresar';
    }
});
