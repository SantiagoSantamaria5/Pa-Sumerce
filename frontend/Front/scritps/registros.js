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
        
        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
            throw new NetworkError('Error al procesar la solicitud', response.status);
        }

        const responseText = await response.text();  // Leer la respuesta como texto primero
        console.log("Respuesta del servidor:", responseText);  // Agregar log

        // Comprobar si la respuesta está vacía
        if (responseText.trim() === "") {
            throw new Error('Respuesta vacía del servidor');
        }

        // Verificar si el contenido es JSON
        if (contentType && contentType.includes('application/json')) {
            return JSON.parse(responseText);  // Parsear el JSON si es válido
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

function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


document.addEventListener('DOMContentLoaded', async () => {
    const fechaActual = getCurrentDate(); // Obtén la fecha actual
    try {
        const response = await sendRequest(`/registro/registros/${fechaActual}`);
        if (response.success) {
            populateTable(response.registros); // Llena la tabla con los datos obtenidos
        } else {
            showAlert(response.message, 'warning');
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        showAlert('Error al cargar los registros diarios.', 'danger');
    }
});

// Función para llenar la tabla con los datos obtenidos
function populateTable(registros) {
    const tableBody = document.getElementById('registrosDiariosTableBody');
    tableBody.innerHTML = ''; // Limpia la tabla antes de llenarla

    registros.forEach((registro) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registro.fecha}</td>
            <td>${registro.nombreProducto}</td>
            <td>${registro.cantidad}</td>
        `;
        tableBody.appendChild(row);
    });

    // Agregar botón de detalles al final
    const detallesRow = document.createElement('tr');
    detallesRow.innerHTML = `
        <td colspan="3" class="text-center">
            <button class="btn btn-primary" onclick="generatePDF('${getCurrentDate()}')">Ver Detalles</button>
        </td>
    `;
    tableBody.appendChild(detallesRow);
}

// Función para generar un PDF (simulada aquí)
function generatePDF(fecha) {
    window.open(`/api/registro/pdf/${fecha}`, '_blank');
}


