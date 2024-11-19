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
        console.log('Enviando solicitud a:', `${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // Verificar el estado de la respuesta
        console.log('Estado de la respuesta:', response.status);

        // Intentar obtener el cuerpo de la respuesta
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Si la respuesta no es exitosa, lanzamos un error con los datos recibidos
        if (!response.ok) {
            console.error('Error de red:', data);
            throw new NetworkError(
                typeof data === 'object' ? data.message : data,
                response.status
            );
        }

        console.log('Datos de la respuesta:', data);  // Mostrar los datos para ver qué devuelve el servidor
        return data;
    } catch (error) {
        console.error('Error de red:', error);
        if (error instanceof NetworkError) {
            throw error;
        }
        throw new NetworkError('Error de conexión con el servidor', 500);
    }
}
// Manejador del formulario de login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    const submitButton = e.target.querySelector('button[type="submit"]');

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Iniciando sesión...';
        messageDiv.textContent = '';
        messageDiv.className = '';

        console.log('Intentando login con:', { username });
        const data = await sendRequest('/login', 'POST', { username, password });
        
        console.log('Respuesta de login:', data);
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            window.location.href = '/menu.html';
        } else {
            throw new Error('No se recibió el token de autenticación');
        }
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        messageDiv.textContent = error.message || 'Error al iniciar sesión';
        messageDiv.className = 'message error';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Ingresar';
    }
});


// Manejador del formulario de insumos
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


// Cargar los detalles del insumo seleccionado
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
        // Rellenar los campos del formulario con los datos del insumo
        document.getElementById('nombre').value = insumoSeleccionado.nombre;
        document.getElementById('cantidad').value = insumoSeleccionado.cantidad;
        document.getElementById('fechaAdquisicion').value = insumoSeleccionado.fechaAdquisicion;
        document.getElementById('fechaVencimiento').value = insumoSeleccionado.fechaVencimiento;
        document.getElementById('valorUnitario').value = insumoSeleccionado.valorUnitario;
    }
}


// Función para actualizar un insumo
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

        console.log('Response from server:', response);  // Ver la respuesta completa para debugging

        if (response.success) {
            alert('Insumo actualizado correctamente.');
        } else {
            alert(`Error al actualizar el insumo: ${response.message || 'Desconocido'}`);
        }
    } catch (error) {
        console.error('Error al actualizar el insumo:', error);
        alert(`Hubo un problema al actualizar el insumo: ${error.message}`);
    }
}


async function eliminarInsumo() {
    const insumoId = document.getElementById('insumoSelect').value;

    // Validar que se haya seleccionado un insumo
    if (!insumoId) {
        alert('Por favor, seleccione un insumo para eliminar.');
        return;
    }

    if (confirm('¿Está seguro de que desea eliminar este insumo?')) {
        try {
            const response = await sendRequest(`/inventario/eliminar/${insumoId}`, 'DELETE');
            
            console.log('Respuesta del servidor después de eliminar el insumo:', response);  // Ver la respuesta completa

            // Verificar si la respuesta contiene el campo 'success'
            if (response.success) {
                alert('Insumo eliminado correctamente.');
                document.getElementById('insumoSelect').innerHTML = '<option value="">Seleccione un insumo</option>';
                cargarInsumos();  // Recargar los insumos después de eliminar
            } else {
                // Si no tiene 'success', mostrar el mensaje recibido
                alert('Error al eliminar el insumo. Respuesta inesperada:', response);
            }
        } catch (error) {
            console.error('Error al eliminar el insumo:', error);
            alert('Hubo un problema al eliminar el insumo.');
        }
    }
}


// Manejar el evento de envío del formulario para modificar un insumo
document.getElementById('modifyInsumoForm')?.addEventListener('submit', actualizarInsumo);

// Llamar a la función cargarInsumos al cargar la página
window.onload = cargarInsumos;

// Función de validación (agregada al inicio del archivo)
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


