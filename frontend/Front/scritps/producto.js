const API_BASE_URL = 'http://localhost:5000/api';
let ingrediente = []; // Variable global para almacenar los insumos

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

// Función para cargar los ingredientes desde el inventario
async function cargarIngredientes() {
    try {
        const response = await sendRequest('/inventario', 'GET');
        
        // Verificar si la respuesta contiene los ingredientes (ya que no existe 'data')
        if (!response || response.length === 0) {
            throw new Error('No se encontraron ingredientes');
        }

        const selectIngredientes = document.querySelectorAll('#SelectIngrediente');
        
        selectIngredientes.forEach(select => {
            select.innerHTML = '<option value="">Seleccione el ingrediente</option>';
            
            // Iteramos sobre los resultados directamente, sin la propiedad 'data'
            response.forEach(ingrediente => {
                const option = document.createElement('option');
                option.value = ingrediente.Id;
                option.textContent = ingrediente.nombre;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        alert('No se pudieron cargar los ingredientes');
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
    
    // Obtener datos del formulario
    const nombreProducto = document.getElementById('nombrePan').value.trim();
    
    // Recopilar ingredientes
    const ingredientesContainer = document.getElementById('ingredientesContainer');
    const ingredientesDivs = ingredientesContainer.querySelectorAll('div');
    
    const ingredientes = [];
    
    ingredientesDivs.forEach(div => {
        const select = div.querySelector('select');
        const inputGramos = div.querySelector('input[type="number"]');
        
        const ingredienteId = select.value;
        const gramos = inputGramos.value;
        
        if (ingredienteId && gramos) {
            ingredientes.push({
                ingrediente: select.options[select.selectedIndex].text,
                idIngrediente: ingredienteId,
                gramos: parseInt(gramos)
            });
        }
    });
    
    // Validaciones
    if (!nombreProducto) {
        alert('Por favor, ingrese el nombre del producto');
        return;
    }
    
    if (ingredientes.length === 0) {
        alert('Debe agregar al menos un ingrediente');
        return;
    }
    
    // Obtener los precios de los ingredientes (simulación de precios desde la base de datos)
    let precioTotal = 0;
    for (let i = 0; i < ingredientes.length; i++) {
        try {
            const ingredienteData = await sendRequest(`/inventario/${ingredientes[i].idIngrediente}`, 'GET');
            const precioPorGramo = ingredienteData.precio;  // Suponiendo que tienes un campo `precio` en tu inventario
            precioTotal += ingredientes[i].gramos * precioPorGramo;
        } catch (error) {
            console.error('Error al obtener el precio del ingrediente:', error);
            alert('No se pudo obtener el precio de los ingredientes');
            return;
        }
    }
    
    // Preparar datos para enviar
    const datosProducto = {
        nombre: nombreProducto,
        ingredientes: ingredientes,
        precio: precioTotal
    };
    
    try {
        const response = await fetch('/producto/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosProducto)
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            alert('Producto guardado exitosamente');
            // Limpiar formulario
            document.getElementById('addPanForm').reset();
            // Eliminar campos de ingredientes extra
            const ingredientesContainer = document.getElementById('ingredientesContainer');
            while (ingredientesContainer.children.length > 1) {
                ingredientesContainer.removeChild(ingredientesContainer.lastChild);
            }
        } else {
            throw new Error(resultado.message || 'Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
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
