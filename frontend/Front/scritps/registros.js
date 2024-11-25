const API_BASE_URL = 'http://localhost:5000/api';
let ingredientes = [];

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
        
        if (!response.ok) {
            throw new NetworkError('Error al procesar la solicitud', response.status);
        }

        const responseText = await response.text();
        console.log("Respuesta del servidor:", responseText);

        if (responseText.trim() === "") {
            throw new Error('Respuesta vacía del servidor');
        }

        if (contentType && contentType.includes('application/json')) {
            return JSON.parse(responseText);
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
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
}

// Función para obtener registros por fecha específica
async function getRegistrosPorFecha(fecha) {
    try {
        const data = await sendRequest(`/registro/registros/${fecha}`, 'GET');
        const tableBody = document.getElementById('registrosDiariosTableBody');
        tableBody.innerHTML = '';

        if (!data.success || !data.registros || data.registros.length === 0) {
            showAlert('No hay registros disponibles para esta fecha.', 'warning');
            return;
        }

        data.registros.forEach(registro => {
            const fechaFormateada = formatearFecha(registro.fecha);
            const cantidad = registro.Cantidad || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${fechaFormateada}</td>
                <td>${registro.nombreProducto}</td>
                <td>${cantidad.toLocaleString('es-ES')}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al obtener los registros:', error);
        showAlert('No se pudieron obtener los registros de producción.', 'danger');
    }
}

// Función para obtener registros mensuales
async function getRegistrosMensuales() {
    try {
        const data = await sendRequest('/registro/registros/mes', 'GET');
        const tableBody = document.getElementById('registrosMensualesTableBody');
        tableBody.innerHTML = '';

        if (!data.success || !data.registros || data.registros.length === 0) {
            showAlert('No hay registros mensuales disponibles.', 'warning');
            return;
        }

        data.registros.forEach(registro => {
            const fechaFormateada = formatearFecha(registro.fecha);
            const cantidad = registro.cantidadTotal || 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${fechaFormateada}</td>
                <td>${registro.nombreProducto}</td>
                <td>${cantidad.toLocaleString('es-ES')}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al obtener los registros mensuales:', error);
        showAlert('No se pudieron obtener los registros mensuales.', 'danger');
    }
}

// Función actualizada para obtener registros anuales
async function getRegistrosAnuales() {
    try {
        const data = await sendRequest('/registro/registros/anual', 'GET');
        const tableBody = document.getElementById('registrosAnualesTableBody');
        tableBody.innerHTML = '';

        if (!data.success || !data.registros || data.registros.length === 0) {
            showAlert('No hay registros anuales disponibles.', 'warning');
            return;
        }

        data.registros.forEach(registro => {
            const row = document.createElement('tr');
            const fechaFormateada = formatearFecha(new Date()); // Fecha actual para el registro anual
            
            row.innerHTML = `
                <td>${fechaFormateada}</td>
                <td>${registro.nombreProducto}</td>
                <td>${registro.cantidadTotal.toLocaleString('es-ES')}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error al obtener los registros anuales:', error);
        showAlert('No se pudieron obtener los registros anuales.', 'danger');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const url = window.location.href;
    const fechaActual = getCurrentDate();

    if (url.includes('registroMensual.html')) {
        getRegistrosMensuales();
    } else if (url.includes('registroAnual.html')) {
        getRegistrosAnuales();
    } else {
        getRegistrosPorFecha(fechaActual);
    }
});