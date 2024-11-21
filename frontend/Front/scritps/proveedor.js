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

/**
 * Muestra una alerta estilizada con Bootstrap.
 * @param {string} message - Mensaje a mostrar.
 * @param {string} type - Tipo de alerta (success, danger, warning, info, etc.).
 * @param {number} duration - Duración en milisegundos antes de que desaparezca automáticamente (opcional).
 */
function showAlert(message, type = 'info', duration = 5000) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    const container = document.getElementById('alert-container');
    container.appendChild(alert);

    if (duration > 0) {
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, duration);
    }
}

/**
 * Realiza una solicitud al servidor.
 * @param {string} endpoint - Ruta del API.
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE).
 * @param {object|null} body - Cuerpo de la solicitud (opcional).
 */

// Función simplificada para realizar solicitudes al backend
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
        const data = contentType && contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof data === 'object' ? data.message : data;
            throw new NetworkError(message || 'Error en la solicitud', response.status);
        }

        return data;
    } catch (error) {
        console.error('Error completo:', error);
        if (error instanceof NetworkError) {
            throw error;
        }
        throw new NetworkError('Error de conexión con el servidor.', 500);
    }
}

// Función para validar campos del formulario
function validateField(value, fieldName, options = {}) {
    if (!value || value.toString().trim() === '') {
        throw new Error(`El campo ${fieldName} es requerido.`);
    }

    if (options.numeric && isNaN(value)) {
        throw new Error(`El campo ${fieldName} debe ser numérico.`);
    }

    if (options.phone) {
        const phoneRegex = /^\+?[\d\s-]{10,15}$/;
        if (!phoneRegex.test(value)) {
            throw new Error(`El formato del ${fieldName} no es válido.`);
        }
    }
}



// Manejador del formulario de proveedores (reemplazar el existente)
document.getElementById('addProveedorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        empresa: document.getElementById('empresa').value.trim(),
        telefono: document.getElementById('numero').value.trim(),
        horarios: document.getElementById('horarios').value.trim(),
    };

    try {
        validateField(formData.nombre, 'Nombre');
        validateField(formData.apellido, 'Apellido');
        validateField(formData.empresa, 'Empresa');
        validateField(formData.telefono, 'Teléfono', { phone: true });
        validateField(formData.horarios, 'Horarios');

        const response = await sendRequest('/proveedor/crear', 'POST', formData);

        showAlert(response.message || 'Proveedor guardado exitosamente.', 'success');
        document.getElementById('addProveedorForm').reset();
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al guardar proveedor:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Guardar';
    }
});

// Obtener y cargar proveedores desde el backend
async function cargarProveedores() {
    try {
        const { success, data } = await sendRequest('/proveedor/ver', 'GET');

        if (!success) throw new Error('No se pudieron obtener los proveedores.');

        const tableBody = document.getElementById('proveedoresTableBody');
        tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        data.forEach(({ Id, nombre, apellido, empresa, telefono, horarios }) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${nombre}</td>
                <td>${apellido}</td>
                <td>${empresa}</td>
                <td>${telefono}</td>
                <td>${horarios}</td>
                <td>
                    <button class="btn btn-warning btn-sm" 
                        onclick="editarProveedor(${Id}, '${nombre}', '${apellido}', '${empresa}', '${telefono}', '${horarios}')">
                        Editar
                    </button>
                    <button class="btn btn-danger btn-sm" 
                        onclick="eliminarProveedor(${Id})">
                        Eliminar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        showAlert('Proveedores cargados correctamente.', 'info', 3000);
    } catch (error) {
        showAlert('Error al cargar proveedores.', 'danger');
        console.error('Error al cargar proveedores:', error);
    }
}

// Función para eliminar un proveedor
async function eliminarProveedor(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        try {
            const response = await sendRequest(`/proveedor/eliminar/${id}`, 'DELETE');

            if (response.success) {
                showAlert('Proveedor eliminado con éxito.', 'success');
                cargarProveedores();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            showAlert(`Error al eliminar el proveedor: ${error.message}`, 'danger');
            console.error('Error al eliminar proveedor:', error);
        }
    }
}


// Cargar los datos de un proveedor en el formulario
function editarProveedor(id, nombre, apellido, empresa, numero, horarios) {
    document.getElementById('nombre').value = nombre;
    document.getElementById('apellido').value = apellido;
    document.getElementById('empresa').value = empresa;
    document.getElementById('numero').value = numero;
    document.getElementById('horarios').value = horarios;

    document.getElementById('modificarProveedorForm').dataset.proveedorId = id;
}

// Enviar los datos actualizados al servidor
document.getElementById('modificarProveedorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = e.target.dataset.proveedorId;
    const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        empresa: document.getElementById('empresa').value.trim(),
        telefono: document.getElementById('numero').value.trim(),
        horarios: document.getElementById('horarios').value.trim(),
    };

    try {
        const response = await sendRequest(`/proveedor/actualizar/${id}`, 'PUT', formData);

        if (response.success) {
            showAlert('Proveedor actualizado con éxito.', 'success');
            cargarProveedores();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        showAlert(`Error al actualizar el proveedor: ${error.message}`, 'danger');
        console.error('Error al actualizar proveedor:', error);
    }
});

// Cargar los proveedores al cargar la página
document.addEventListener('DOMContentLoaded', cargarProveedores);

