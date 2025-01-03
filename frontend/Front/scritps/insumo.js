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

document.addEventListener('DOMContentLoaded', () => {
    // Asegurarte de que las funciones de carga de insumos y proveedores se ejecuten de forma independiente
    cargarInsumos();
    cargarProveedor();

    const form = document.getElementById('addInsumoForm');
if (form) {
    form.addEventListener('submit', async function (event) {
        event.preventDefault();
       
        const nombre = document.getElementById('nombre').value.trim();
        const cantidad = parseFloat(document.getElementById('cantidad').value);
        const idProveedor = document.getElementById('proveedorSelect').value;
        const fechaAdquisicion = document.getElementById('fechaAdquisicion').value;
        const fechaVencimiento = document.getElementById('fechaVencimiento').value;
        const valorUnitario = parseFloat(document.getElementById('valorUnitario').value);
    
        console.log({ nombre, cantidad, idProveedor, fechaAdquisicion, fechaVencimiento, valorUnitario });
    
        try {
            if (!nombre) throw new Error('El nombre es obligatorio.');
            if (isNaN(cantidad) || cantidad <= 0) throw new Error('La cantidad debe ser un número positivo.');
            if (!idProveedor) throw new Error('Por favor, seleccione un proveedor.');
            if (!fechaAdquisicion || !fechaVencimiento) throw new Error('Las fechas son obligatorias.');
            if (new Date(fechaAdquisicion) > new Date(fechaVencimiento)) throw new Error('La fecha de adquisición no puede ser posterior a la de vencimiento.');
            if (isNaN(valorUnitario) || valorUnitario <= 0) throw new Error('El valor unitario debe ser un número positivo.');
    
            const result = await sendRequest('/inventario/crear', 'POST', {
                nombre,
                cantidad,
                idProveedor,
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
}

});

async function cargarInsumos() {
    try {
        // Solicitar los insumos al servidor
        const response = await sendRequest('/inventario', 'GET');
        
        // Check if the response has a data property and it's an array
        insumos = response.data && Array.isArray(response.data) ? response.data : [];
        
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


// Modifica la función actualizarInsumo para incluir más logs
async function actualizarInsumo(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const insumoId = document.getElementById('insumoSelect').value;
    const nombre = document.getElementById('nombre').value;
    const cantidad = document.getElementById('cantidad').value;
    const idProveedor = document.getElementById('proveedorSelect').value;
    const fechaAdquisicion = document.getElementById('fechaAdquisicion').value;
    const fechaVencimiento = document.getElementById('fechaVencimiento').value;
    const valorUnitario = document.getElementById('valorUnitario').value;

    // Log para debug
    console.log('Datos a enviar:', {
        insumoId,
        nombre,
        cantidad,
        idProveedor,
        fechaAdquisicion,
        fechaVencimiento,
        valorUnitario
    });

    // Validación
    if (!insumoId || !nombre || !cantidad || !idProveedor || !fechaAdquisicion || !fechaVencimiento || !valorUnitario) {
        showAlert('Por favor, complete todos los campos.', 'danger');
        return;
    }

    const updatedInsumo = {
        nombre,
        cantidad: parseFloat(cantidad),
        idProveedor: parseInt(idProveedor),
        fechaAdquisicion,
        fechaVencimiento,
        valorUnitario: parseFloat(valorUnitario)
    };

    try {
        const response = await sendRequest(`/inventario/actualizar/${insumoId}`, 'PUT', updatedInsumo);
        console.log('Respuesta del servidor:', response); // Para debug
        
        if (response && response.success) {
            showAlert('Insumo actualizado exitosamente', 'success');
            
            // Recargar la lista de insumos
            await cargarInsumos(); 
            
            // Reiniciar el formulario
            const form = document.getElementById('modifyInsumoForm');
            if (form) {
                form.reset();
            }
            
            // Reiniciar el select de insumos a la opción por defecto
            const insumoSelect = document.getElementById('insumoSelect');
            if (insumoSelect) {
                insumoSelect.value = '';
            }
            
            // Reiniciar el select de proveedores a la opción por defecto
            const proveedorSelect = document.getElementById('proveedorSelect');
            if (proveedorSelect) {
                proveedorSelect.value = '';
            }
            
        } else {
            showAlert(response.message || 'Error al actualizar el insumo', 'danger');
        }
    } catch (error) {
        console.error('Error en la actualización:', error);
        showAlert(error.message || 'Error al actualizar el insumo', 'danger');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    cargarInsumos();
    cargarProveedor();
    
    // Configurar el formulario de modificación
    const form = document.getElementById('modifyInsumoForm');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Formulario enviado'); // Para debug
            
            try {
                await actualizarInsumo(event);
            } catch (error) {
                console.error('Error al actualizar:', error);
                showAlert('Error al actualizar el insumo', 'danger');
            }
        });
    }

    // Configurar el select de insumos
    const select = document.getElementById('insumoSelect');
    if (select) {
        select.addEventListener('change', cargarInsumo);
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