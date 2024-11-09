document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            messageDiv.textContent = '¡Inicio de sesión exitoso!';
            messageDiv.className = 'message success';
            // Aquí puedes redirigir al usuario a la página principal
            // window.location.href = '/dashboard.html';
        } else {
            messageDiv.textContent = 'Usuario o contraseña incorrectos';
            messageDiv.className = 'message error';
        }
    } catch (error) {
        messageDiv.textContent = 'Error al conectar con el servidor';
        messageDiv.className = 'message error';
        console.error('Error:', error);
    }
});