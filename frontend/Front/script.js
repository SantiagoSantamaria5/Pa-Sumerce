document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    // Mock authentication - replace this with real backend calls when deploying
    try {
        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock credentials for testing
        if (username === 'admin' && password === 'admin123') {
            messageDiv.textContent = '¡Inicio de sesión exitoso!';
            messageDiv.className = 'message success';
            
            // Store user session
            localStorage.setItem('user', JSON.stringify({
                id: 1,
                username: 'admin',
                nombre: 'Administrador',
                apellido: 'Sistema',
                permisos: 'admin',
                area: 'Sistemas'
            }));

            // Redirect after successful login (uncomment when ready)
            // window.location.href = '/dashboard.html';
        } else {
            messageDiv.textContent = 'Usuario o contraseña incorrectos';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Error en el sistema';
        messageDiv.className = 'message error';
        console.error('Error:', error);
    }
});