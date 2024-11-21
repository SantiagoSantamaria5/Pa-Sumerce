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

async function cargarIngredientes() {
    try {
        const response = await sendRequest('/inventario', 'GET');
        
        // Asegurarnos de que la respuesta sea un array de ingredientes
        if (!Array.isArray(response) || response.length === 0) {
            throw new Error('No se encontraron ingredientes');
        }

        const selectIngredientes = document.querySelectorAll('#SelectIngrediente');
        
        selectIngredientes.forEach(select => {
            select.innerHTML = '<option value="">Seleccione el ingrediente</option>';
            
            // Iteramos sobre los ingredientes y agregamos las opciones al select
            response.forEach(ingrediente => {
                const option = document.createElement('option');
                option.value = ingrediente.Id;  // Usamos el Id del ingrediente
                option.textContent = ingrediente.nombre;  // Nombre del ingrediente
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        showAlert('No se pudieron cargar los ingredientes', 'danger');
    }
}

// Función para agregar un nuevo campo de ingrediente
function agregarCampoIngrediente() {
    const contenedor = document.getElementById('ingredientesContainer');
    
    const nuevoCampo = document.createElement('div');
    nuevoCampo.className = 'd-flex align-items-center mb-2';
    
    // Select de ingredientes
    const select = document.createElement('select');
    select.className = 'form-select me-2';
    select.innerHTML = document.querySelector('#SelectIngrediente').innerHTML;
    
    // Input de gramos
    const inputGramos = document.createElement('input');
    inputGramos.type = 'number';
    inputGramos.className = 'form-control me-2';
    inputGramos.placeholder = 'Gramos';
    inputGramos.required = true;
    
    // Botón de eliminar
    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'btn btn-danger btn-sm';
    botonEliminar.textContent = '❌';
    botonEliminar.onclick = () => nuevoCampo.remove();
    
    nuevoCampo.appendChild(select);
    nuevoCampo.appendChild(inputGramos);
    nuevoCampo.appendChild(botonEliminar);
    
    contenedor.appendChild(nuevoCampo);
}

// Función para guardar el producto
async function guardarProducto(event) {
    event.preventDefault();
    
    const nombreProducto = document.getElementById('nombrePan').value.trim();
    const PrecioU = parseFloat(document.getElementById('precioUnitario').value.trim());
    
    const ingredientesDivs = document.getElementById('ingredientesContainer').querySelectorAll('div');
    
    const ingredientes = [];
    
    ingredientesDivs.forEach(div => {
        const select = div.querySelector('select');
        const inputGramos = div.querySelector('input[type="number"]');
    
        const idInventario = select.value;
        const cantidad = parseInt(inputGramos.value);
    
        if (idInventario && cantidad) {
            ingredientes.push({
                idInventario: parseInt(idInventario),
                cantidad: cantidad,
            });
        }
    });
    

    if (ingredientes.length === 0) {
        showAlert('Debe agregar al menos un ingrediente', 'warning');
        return;
    }

    const datosProducto = {
        Nombre: nombreProducto, // Asegúrate de usar el campo correcto
        PrecioTotal: PrecioU,   // Cambia 'PrecioU' a 'PrecioTotal'
        ingredientes: ingredientes.map(ing => ({
            idInventario: parseInt(ing.idInventario), // Asegúrate de que sea un número
            cantidad: parseFloat(ing.cantidad),      // Asegúrate de que sea un número decimal
        }))
    };
    
    
    try {
        const response = await sendRequest('/producto/agregar', 'POST', datosProducto);
        
        if (response.success) {
            showAlert('Producto guardado exitosamente', 'success');
            document.getElementById('addPanForm').reset();
            const ingredientesContainer = document.getElementById('ingredientesContainer');
            while (ingredientesContainer.children.length > 1) {
                ingredientesContainer.removeChild(ingredientesContainer.lastChild);
            }
        } else {
            throw new Error(response.message || 'Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message, 'danger');
    }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar ingredientes al cargar la página
    cargarIngredientes();
    
    // Botón para añadir ingrediente
    const btnAgregarIngrediente = document.getElementById('addIngredientBtn');
    btnAgregarIngrediente.addEventListener('click', agregarCampoIngrediente);
    
    // Formulario de guardado
    const formProducto = document.getElementById('addPanForm');
    formProducto.addEventListener('submit', guardarProducto);
});