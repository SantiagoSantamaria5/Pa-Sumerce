
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


// Función simplificada para realizar solicitudes al backend
document.getElementById('addInsumoForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const cantidad = parseFloat(document.getElementById('cantidad').value);
    const proveedorId = document.getElementById('proveedorSelect').value;
    const fechaAdquisicion = document.getElementById('fechaAdquisicion').value;
    const fechaVencimiento = document.getElementById('fechaVencimiento').value;
    const valorUnitario = parseFloat(document.getElementById('valorUnitario').value);

    try {
        if (!nombre) throw new Error('El nombre es obligatorio.');
        if (isNaN(cantidad) || cantidad <= 0) throw new Error('La cantidad debe ser un número positivo.');
        if (!proveedorId) throw new Error('Por favor, seleccione un proveedor.');
        if (!fechaAdquisicion || !fechaVencimiento) throw new Error('Las fechas son obligatorias.');
        if (new Date(fechaAdquisicion) > new Date(fechaVencimiento)) throw new Error('La fecha de adquisición no puede ser posterior a la de vencimiento.');
        if (isNaN(valorUnitario) || valorUnitario <= 0) throw new Error('El valor unitario debe ser un número positivo.');

        const result = await sendRequest('/inventario/crear', 'POST', {
            nombre,
            cantidad,
            proveedorId,
            fechaAdquisicion,
            fechaVencimiento,
            valorUnitario,
        });

        if (result.success) {
            showAlert('Insumo creado con éxito.', 'success');
            document.getElementById('addInsumoForm').reset();
        } else {
            showAlert(`Error al crear insumo: ${result.message}`, 'danger');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al enviar el formulario:', error);
    }
});



async function cargarInsumos() {
    try {
        // Solicitar los insumos al servidor
        insumos = await sendRequest('/inventario', 'GET'); // Asigna el valor a la variable global insumos
        
        // Obtener el select donde se cargarán los insumos
        const insumoSelect = document.getElementById('insumoSelect');
        insumoSelect.innerHTML = '<option value="">Seleccione un insumo</option>'; // Limpiar el select antes de llenarlo

        // Renderizar cada insumo como opción en el select
        insumos.forEach(insumo => {
            const option = document.createElement('option');
            option.value = insumo.Id; // Usamos el Id del insumo
            option.textContent = `${insumo.nombre}`; // Muestra el nombre y la cantidad
            insumoSelect.appendChild(option);
        });
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al cargar los insumos:', error);
    }
}


// Cargar los datos del insumo seleccionado
// Cargar los datos del insumo seleccionado
function cargarInsumo() {
    const insumoId = document.getElementById('insumoSelect').value;

    // Asegúrate de que se haya seleccionado un insumo
    if (insumoId === "") {
        return; // No hacer nada si no se ha seleccionado un insumo
    }

    // Buscar el insumo seleccionado en los datos cargados
    const insumoSeleccionado = insumos.find(insumo => insumo.Id == insumoId);

    if (insumoSeleccionado) {
        // Convertir las fechas al formato correcto (YYYY-MM-DD)
        const fechaAdquisicion = new Date(insumoSeleccionado.fechaAdquisicion).toISOString().split('T')[0];
        const fechaVencimiento = new Date(insumoSeleccionado.fechaVencimiento).toISOString().split('T')[0];

        // Rellenar los campos del formulario con los datos del insumo
        document.getElementById('nombre').value = insumoSeleccionado.nombre;
        document.getElementById('cantidad').value = insumoSeleccionado.cantidad;
        document.getElementById('fechaAdquisicion').value = fechaAdquisicion;
        document.getElementById('fechaVencimiento').value = fechaVencimiento;
        document.getElementById('valorUnitario').value = insumoSeleccionado.valorUnitario;
    }
}

async function actualizarInsumo(event) {
    event.preventDefault();

    const insumoId = document.getElementById('insumoSelect').value;
    const nombre = document.getElementById('nombre').value;
    const cantidad = document.getElementById('cantidad').value;
    const fechaAdquisicion = document.getElementById('fechaAdquisicion').value;
    const fechaVencimiento = document.getElementById('fechaVencimiento').value;
    const valorUnitario = document.getElementById('valorUnitario').value;
    if (!insumoId || !cantidad || !fechaAdquisicion || !fechaVencimiento || !valorUnitario) {
        showAlert('Por favor, complete todos los campos.','danger');
        return;
    }

    const updatedInsumo = {
        nombre: nombre,
        cantidad: cantidad,
        fechaAdquisicion: fechaAdquisicion,
        fechaVencimiento: fechaVencimiento,
        valorUnitario: valorUnitario
    };

    try {
        // Actualizar el insumo usando sendRequest con método PUT
        const response = await sendRequest(`/inventario/actualizar/${insumoId}`, 'PUT', updatedInsumo);

        // Cambiar la lógica para manejar la respuesta adecuadamente
        if (response && response.message) {
            alert(`Insumo actualizado: ${response.message}`);
        } else {
            showAlert('Por favor, complete todos los campos.','success');
        }

        // Opcional: recargar los insumos para reflejar los cambios en el select
        await cargarInsumos();
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al actualizar el insumo:', error);
    }
}

// Manejar el evento de envío del formulario para modificar un insumo
document.getElementById('modifyInsumoForm')?.addEventListener('submit', actualizarInsumo);


// Función de validación
function validateField(value, fieldName, options = {}) {
    if (!value || value.toString().trim() === '') {
        throw new Error(`El campo ${fieldName} es requerido`);
    }
    
    if (options.numeric && isNaN(value)) {
        throw new Error(`El campo ${fieldName} debe ser numérico`);
    }
    
    if (options.phone) {
        const phoneRegex = /^\+?[\d\s-]{10,15}$/;
        if (!phoneRegex.test(value)) {
            throw new Error(`El formato del ${fieldName} no es válido`);
        }
    }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    cargarInsumos();
    
    const form = document.getElementById('modifyInsumoForm');
    if (form) {
        form.addEventListener('submit', actualizarInsumo);
    }

    const select = document.getElementById('insumoSelect');
    if (select) {
        select.addEventListener('change', cargarDetallesInsumo);
    }
});

async function eliminarInsumo() {
    const insumoId = document.getElementById('insumoSelect').value;

    if (!insumoId) {
        showAlert('Por favor, seleccione un insumo para eliminar.','danger');
        return;
    }

    if (!confirm('¿Está seguro de que desea eliminar este insumo? Esta acción no se puede deshacer.')) {
        return; // El usuario canceló la acción
    }

    try {
        // Llamar a la API para eliminar el insumo
        const response = await sendRequest(`/inventario/eliminar/${insumoId}`, 'DELETE');

        // Mostrar un mensaje de éxito
        showAlert(`Insumo eliminado: ${response.message || 'Se eliminó correctamente el insumo.'}`,'success');

        // Recargar la lista de insumos para reflejar los cambios
        await cargarInsumos();
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al eliminar los insumos:', error);
    }
}

async function cargarProveedor() {
    try {
        const response = await sendRequest('/proveedor/ver', 'GET');

        if (!response.success || !Array.isArray(response.data)) {
            throw new Error('No se pudieron cargar los proveedores.');
        }

        const proveedorSelect = document.getElementById('proveedorSelect');
        proveedorSelect.innerHTML = '<option value="">Seleccione el proveedor correspondiente</option>';

        response.data.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.Id;
            option.textContent = `${escapeHTML(proveedor.nombre)} ${escapeHTML(proveedor.apellido)} (${escapeHTML(proveedor.empresa)})`;
            proveedorSelect.appendChild(option);
        });

        showAlert('Proveedores cargados correctamente.', 'info', 3000);
    } catch (error) {
        showAlert('Error al cargar proveedores.', 'danger');
        console.error(error);
    }
}

// Escapar caracteres peligrosos para prevenir XSS
function escapeHTML(text) {
    const element = document.createElement('div');
    element.innerText = text || '';
    return element.innerHTML;
}


// Llama a cargarProveedor cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    cargarProveedor();
});

