const API_BASE_URL = 'http://localhost:5000/api';
let ingredientes = []; // Variable global para almacenar los insumos

// Utilidad para manejar errores de red
class NetworkError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'NetworkError';
    }
}

// Función para mostrar alertas
function showAlert(message, type = 'info', duration = 5000) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const container = document.getElementById('alert-container');
    if (container) {
        container.appendChild(alert);

        if (duration > 0) {
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }, duration);
        }
    }
}

document.getElementById('panSelect').addEventListener('change', (event) => {
    event.preventDefault();  // Previene cualquier comportamiento por defecto en este caso
});



// Función para realizar solicitudes al servidor
async function sendRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const contentType = response.headers.get('content-type');

        const responseText = await response.text();  // Leer la respuesta como texto primero
        console.log("Respuesta del servidor:", responseText);  // Agregar log

        // Comprobar si la respuesta está vacía
        if (responseText.trim() === "") {
            throw new Error('Respuesta vacía del servidor');
        }

        // Verificar si el contenido es JSON
        if (contentType && contentType.includes('application/json')) {
            const parsedResponse = JSON.parse(responseText);
            
            // If response is not successful, return the response instead of throwing an error
            if (!response.ok || parsedResponse.success === false) {
                return parsedResponse;
            }
            
            return parsedResponse;
        } else {
            throw new Error('La respuesta no es JSON');
        }
    } catch (error) {
        console.error('Error completo:', error);
        if (error instanceof NetworkError) {
            throw error;
        }
        throw new NetworkError('Error de conexión con el servidor.', 500);
    }
}

async function cargarProductos() {
    try {
        const productos = await sendRequest('/produccion/productos', 'GET');
        const select = document.getElementById('panSelect');

        productos.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.idProducto;
            option.textContent = producto.Nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showAlert('No se pudieron cargar los productos', 'danger');
    }
}

document.getElementById('registroNuevoForm').addEventListener('submit', async (event) => {
    event.preventDefault();  // Asegúrate de que la página no se recargue

    const idProducto = document.getElementById('panSelect').value;
    const cantidad = parseInt(document.querySelector('#registroNuevoForm input[type="number"]').value);

    if (!idProducto || !cantidad || cantidad <= 0) {
        showAlert('Seleccione un producto y cantidad válida', 'warning');
        return;
    }

    try {
        const response = await sendRequest('/produccion/guardar', 'POST', { idProducto, cantidad });

        if (response.success) {
            showAlert(`Registro registrada`, 'success');
            document.getElementById('registroNuevoForm').reset();
        } else {
            // This is the key change - directly show the error message from the server
            showAlert(response.message, 'danger');
        }
    } catch (error) {
        console.error('Error al registrar producción:', error);
        // Show the error message, prioritizing the specific message
        showAlert(error.message || 'Error al registrar producción:', 'danger');
    }
});

document.addEventListener('DOMContentLoaded', cargarProductos);
