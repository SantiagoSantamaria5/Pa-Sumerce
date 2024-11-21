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
                typeof data === 'object' ? data.message : data,
                response.status
            );
        }

        return data;
    } catch (error) {
        console.error('Error completo:', error);
        if (error instanceof NetworkError) {
            throw error;
        }
        throw new NetworkError('Error de conexión con el servidor', 500);
    }
}

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



// Manejador del formulario de proveedores (reemplazar el existente)
document.getElementById('addProveedorForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido: document.getElementById('apellido').value,
        empresa: document.getElementById('empresa').value,
        telefono: document.getElementById('numero').value,
        horarios: document.getElementById('horarios').value
    };

    try {
        // Validaciones
        validateField(formData.nombre, 'Nombre');
        validateField(formData.apellido, 'Apellido');
        validateField(formData.empresa, 'Empresa');
        validateField(formData.telefono, 'Teléfono', { phone: true });
        validateField(formData.horarios, 'Horarios');

        // Usar la función sendRequest en lugar de fetch directo
        const response = await sendRequest('/proveedor/crear', 'POST', formData);
         
        alert(response.message || 'Proveedor guardado exitosamente');
        document.getElementById('addProveedorForm').reset();
    } catch (error) {
        console.error('Error al guardar proveedor:', error);
        alert(`Error: ${error.message}`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Guardar!';
    }
});


// Obtener y cargar proveedores desde el backend
// Obtener y cargar proveedores desde el backend
async function cargarProveedores() {
    try {
        // Solicitar los proveedores al servidor
        const { success, data } = await sendRequest('/proveedor/ver', 'GET'); // Llamar al endpoint usando sendRequest
        
        if (!success) throw new Error('No se pudieron obtener los proveedores');

        const tableBody = document.getElementById('proveedoresTableBody');
        tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

        // Renderizar cada proveedor en la tabla
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
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        alert('Hubo un problema al cargar los proveedores.');
    }
}


// Función para eliminar un proveedor
async function eliminarProveedor(id) {  
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este proveedor?');
    if (confirmDelete) {
        try {
            // Realizar la solicitud DELETE a la API para eliminar el proveedor
            const response = await sendRequest(`/proveedor/eliminar/${id}`, 'DELETE');
            
            // Verificar la respuesta usando response en lugar de success
            if (response.success) {
                alert('Proveedor eliminado con éxito');
                cargarProveedores(); // Recargar la lista de proveedores después de eliminar
            } else {
                alert(`Error al eliminar el proveedor: ${response.message}`);
            }
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            alert('Hubo un problema al eliminar el proveedor: ' + error.message);
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

    // Guardar el ID del proveedor en un atributo del formulario
    document.getElementById('modificarProveedorForm').dataset.proveedorId = id;
}

// Enviar los datos actualizados al servidor
document.getElementById('modificarProveedorForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = e.target.dataset.proveedorId; // ID del proveedor a actualizar
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const empresa = document.getElementById('empresa').value;
    const numero = document.getElementById('numero').value;
    const horarios = document.getElementById('horarios').value;

    try {
        // Enviar datos actualizados al servidor usando sendRequest
        const response = await sendRequest(`/proveedor/actualizar/${id}`, 'PUT', { nombre, apellido, empresa, numero, horarios });

        if (!response.success) throw new Error(response.message);

        alert('Proveedor actualizado con éxito');
        cargarProveedores(); // Recargar la tabla
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        alert('No se pudo actualizar el proveedor.');
    }
});

// Cargar los proveedores al cargar la página
window.onload = () => {
    cargarInsumos();
    // Agrega otras funciones que necesites cargar al inicio
};

