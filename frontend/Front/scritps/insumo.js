
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

// Función simplificada para realizar solicitudes al backend
async function sendRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit', // Cambiado a 'omit' para pruebas iniciales
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log('Sending request to:', `${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Log de la respuesta para debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        // Intentar obtener el cuerpo de la respuesta
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            throw new NetworkError(
                typeof data === 'object' ? data.message || 'Error desconocido' : data,
                response.status
            );
        }

        return data; // Asegúrate de devolver siempre la data
    } catch (error) {
        console.error('Error completo:', error);
        if (error instanceof NetworkError) {
            throw error;
        }
        throw new NetworkError('Error de conexión con el servidor', 500);
    }
}


document.getElementById('addInsumoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        nombre: document.getElementById('nombre').value,
        cantidad: document.getElementById('cantidad').value,
        fechaAdquisicion: document.getElementById('fechaAdquisicion').value,
        fechaVencimiento: document.getElementById('fechaVencimiento').value,
        valorUnitario: document.getElementById('valorUnitario').value
    };

    try {
        // Validaciones
        validateField(formData.nombre, 'Nombre');
        validateField(formData.cantidad, 'Cantidad', { numeric: true });
        validateField(formData.fechaAdquisicion, 'Fecha de adquisición');
        validateField(formData.fechaVencimiento, 'Fecha de vencimiento');
        validateField(formData.valorUnitario, 'Valor unitario', { numeric: true });

        // Validación adicional de fechas
        if (new Date(formData.fechaVencimiento) <= new Date(formData.fechaAdquisicion)) {
            throw new Error('La fecha de vencimiento debe ser posterior a la fecha de adquisición');
        }

        const response = await sendRequest('/inventario/crear', 'POST', formData);
        alert(response.message);
        document.getElementById('addInsumoForm').reset();
    } catch (error) {
        alert(`Error: ${error.message}`);
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
        console.error('Error al cargar los insumos:', error);
        alert('Hubo un problema al cargar los insumos.');
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
        alert('Por favor, complete todos los campos.');
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
            alert('Insumo actualizado correctamente.');
        }

        // Opcional: recargar los insumos para reflejar los cambios en el select
        await cargarInsumos();
    } catch (error) {
        console.error('Error al actualizar el insumo:', error);
        alert(`Hubo un problema al actualizar el insumo: ${error.message}`);
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
        alert('Por favor, seleccione un insumo para eliminar.');
        return;
    }

    if (!confirm('¿Está seguro de que desea eliminar este insumo? Esta acción no se puede deshacer.')) {
        return; // El usuario canceló la acción
    }

    try {
        // Llamar a la API para eliminar el insumo
        const response = await sendRequest(`/inventario/eliminar/${insumoId}`, 'DELETE');

        // Mostrar un mensaje de éxito
        alert(`Insumo eliminado: ${response.message || 'Se eliminó correctamente el insumo.'}`);

        // Recargar la lista de insumos para reflejar los cambios
        await cargarInsumos();
    } catch (error) {
        console.error('Error al eliminar el insumo:', error);
        alert(`Hubo un problema al eliminar el insumo: ${error.message}`);
    }
}
