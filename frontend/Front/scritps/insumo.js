// Configuración global
const API_BASE_URL = 'http://localhost:5000/api';
let insumos = []; // Variable global para almacenar los insumos

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
        
        // Añadir console.log para ver los headers
        console.log('Content-Type:', contentType);

        const data = contentType && contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        // Añadir console.log para ver los datos raw
        console.log('Datos recibidos:', data);

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

// Escapar caracteres peligrosos para prevenir XSS
function escapeHTML(text) {
    const element = document.createElement('div');
    element.innerText = text || '';
    return element.innerHTML;
}

async function cargarInsumos() {
    try {
        // Solicitar los insumos al servidor
        insumos = await sendRequest('/inventario', 'GET');
        
        // Obtener el select donde se cargarán los insumos
        const insumoSelect = document.getElementById('insumoSelect');
        if (!insumoSelect) return;

        insumoSelect.innerHTML = '<option value="">Seleccione un insumo</option>'; // Limpiar el select antes de llenarlo

        // Renderizar cada insumo como opción en el select
        insumos.forEach(insumo => {
            const option = document.createElement('option');
            option.value = insumo.Id; // Usamos el Id del insumo
            option.textContent = `${insumo.nombre} (Cantidad: ${insumo.cantidad})`; 
            insumoSelect.appendChild(option);
        });
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al cargar los insumos:', error);
    }
}

function cargarInsumo() {
    const insumoId = document.getElementById('insumoSelect').value;
    const insumoSelect = document.getElementById('insumoSelect');
    const nombreInput = document.getElementById('nombre');
    const cantidadInput = document.getElementById('cantidad');
    const proveedorSelect = document.getElementById('proveedorSelect');
    const fechaAdquisicionInput = document.getElementById('fechaAdquisicion');
    const fechaVencimientoInput = document.getElementById('fechaVencimiento');
    const valorUnitarioInput = document.getElementById('valorUnitario');

    // Asegúrate de que se haya seleccionado un insumo
    if (insumoId === "" || !nombreInput) {
        return; 
    }

    // Buscar el insumo seleccionado en los datos cargados
    const insumoSeleccionado = insumos.find(insumo => insumo.Id == insumoId);

    if (insumoSeleccionado) {
        // Convertir las fechas al formato correcto (YYYY-MM-DD)
        const fechaAdquisicion = new Date(insumoSeleccionado.fechaAdquisicion).toISOString().split('T')[0];
        const fechaVencimiento = new Date(insumoSeleccionado.fechaVencimiento).toISOString().split('T')[0];

        // Rellenar los campos del formulario con los datos del insumo
        nombreInput.value = insumoSeleccionado.nombre;
        cantidadInput.value = insumoSeleccionado.cantidad;
        proveedorSelect.value = insumoSeleccionado.idProveedor;
        fechaAdquisicionInput.value = fechaAdquisicion;
        fechaVencimientoInput.value = fechaVencimiento;
        valorUnitarioInput.value = insumoSeleccionado.valorUnitario;
    }
}

async function cargarProveedor() {
    try {
        const response = await sendRequest('/proveedor/ver', 'GET');

        const proveedorSelect = document.getElementById('proveedorSelect');
        if (!proveedorSelect) return;

        proveedorSelect.innerHTML = '<option value="">Seleccione el proveedor correspondiente</option>';

        if (response.data && Array.isArray(response.data)) {
            response.data.forEach(proveedor => {
                const option = document.createElement('option');
                option.value = proveedor.Id;
                option.textContent = `${escapeHTML(proveedor.nombre)} ${escapeHTML(proveedor.apellido)} (${escapeHTML(proveedor.empresa)})`;
                proveedorSelect.appendChild(option);
            });
        } else {
            throw new Error('Respuesta no válida al cargar proveedores');
        }
    } catch (error) {
        showAlert('Error al cargar proveedores.', 'danger');
        console.error(error);
    }
}
async function actualizarInsumo(event) {
    event.preventDefault();
    const insumoId = document.getElementById('insumoSelect').value;
    const nombre = document.getElementById('nombre').value;
    const cantidad = document.getElementById('cantidad').value;
    const IdProveedor = document.getElementById('proveedorSelect').value;
    const fechaAdquisicion = document.getElementById('fechaAdquisicion').value;
    const fechaVencimiento = document.getElementById('fechaVencimiento').value;
    const valorUnitario = document.getElementById('valorUnitario').value;

    if (!insumoId || !cantidad || !IdProveedor || !fechaAdquisicion || !fechaVencimiento || !valorUnitario) {
        showAlert('Por favor, complete todos los campos.', 'danger');
        return;
    }

    const updatedInsumo = {
        nombre: nombre,
        cantidad: cantidad,
        idProveedor: IdProveedor,
        fechaAdquisicion: fechaAdquisicion,
        fechaVencimiento: fechaVencimiento,
        valorUnitario: valorUnitario
    };

    try {
        const response = await sendRequest(`/inventario/actualizar/${insumoId}`, 'PUT', updatedInsumo);
        
      
        
        if (response && response.success) {
            showAlert('Insumo actualizado exitosamente', 'success');
            await cargarInsumos(); // Recargar la lista de insumos
        } else {
            showAlert(response.message || 'Error al actualizar el insumo', 'danger');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al actualizar el insumo:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verifica en qué página estás
    const deleteInsumoSelect = document.getElementById('insumoSelect');
    
    if (deleteInsumoSelect) {
        // Si estás en la página de eliminar insumos
        cargarInsumos();
    } else {
        // Lógica para otras páginas
        cargarInsumos();
        cargarProveedor();
        
        const form = document.getElementById('modifyInsumoForm');
        if (form) {
            form.addEventListener('submit', actualizarInsumo);
        }

        const select = document.getElementById('insumoSelect');
        if (select) {
            select.addEventListener('change', cargarInsumo);
        }
    }
});

// Añade una nueva función para eliminar insumo
async function eliminarInsumo() {
    const insumoId = document.getElementById('insumoSelect').value;

    if (!insumoId) {
        showAlert('Por favor, seleccione un insumo para eliminar.', 'danger');
        return;
    }

    try {
        const response = await sendRequest(`/inventario/eliminar/${insumoId}`, 'DELETE');
        
        showAlert('Insumo eliminado exitosamente', 'success');
        await cargarInsumos(); // Recargar la lista de insumos
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('Error al eliminar el insumo:', error);
    }
}