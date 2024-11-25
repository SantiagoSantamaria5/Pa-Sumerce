// Configuración global
const API_BASE_URL = 'http://localhost:5000/api';
let proveedores = []; // Variable global para almacenar los proveedores

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
        
        const data = contentType && contentType.includes('application/json')
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof data === 'object' ? data.message : data;
            throw new NetworkError(message || 'Error en la solicitud', response.status);
        }

        return data;
    } catch (error) {
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
    // Cargar los datos de proveedores al cargar la página
    cargarProveedores();

    // Configurar el botón de "Generar PDF"
    const generatePDFButton = document.getElementById('generatePDF');
    if (generatePDFButton) {
        generatePDFButton.addEventListener('click', generarPDF);
    }
});

/**
 * Cargar los proveedores desde el servidor y rellenar la tabla.
 */
async function cargarProveedores() {
    try {
        // Solicitar datos de los proveedores
        const { success, data } = await sendRequest('/proveedor/ver', 'GET');

        if (!success) throw new Error('No se pudieron obtener los proveedores.');

        // Referencia al cuerpo de la tabla
        const tableBody = document.getElementById('proveedoresTableBody');
        tableBody.innerHTML = ''; // Limpiar contenido previo

        // Rellenar la tabla con los datos de los proveedores
        data.forEach(({ Id, nombre, apellido, empresa, telefono, horarios }) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(nombre)}</td>
                <td>${escapeHTML(apellido)}</td>
                <td>${escapeHTML(empresa)}</td>
                <td>${escapeHTML(telefono)}</td>
                <td>${escapeHTML(horarios)}</td>
            `;
            tableBody.appendChild(row);
        });

        showAlert('Proveedores cargados correctamente.', 'info', 3000);
    } catch (error) {
        showAlert('Error al cargar proveedores.', 'danger');
        console.error('Error al cargar proveedores:', error);
    }
}

function generarPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();

        // Ruta del logo
        const logoPath = "../images/kirby.png";
        const logoWidth = 50; // Ancho del logo
        const logoHeight = 20; // Alto del logo

        // Crear una promesa para cargar el logo y generar el PDF
        const img = new Image();
        img.src = logoPath;

        img.onload = () => {
            // Agregar el logo al PDF
            pdf.addImage(img, 'JPEG', 10, 10, logoWidth, logoHeight);

            // Añadir título debajo del logo
            pdf.setFontSize(16);
            pdf.text('Informe de Proveedores', 70, 20); // Ajusta las coordenadas para centrar

            // Añadir un recuadro con la fecha de generación
            const today = new Date().toLocaleDateString();
            pdf.setDrawColor(0); // Negro
            pdf.setLineWidth(0.5);
            pdf.rect(140, 10, 60, 10); // x, y, width, height
            pdf.setFontSize(10);
            pdf.text(`Fecha: ${today}`, 145, 17); // Coordenadas dentro del recuadro

            // Crear un encabezado para la tabla
            const headers = ["Nombre", "Apellido", "Empresa", "Teléfono", "Horarios"];
            const tableData = [];

            // Obtener datos de la tabla de proveedores
            const tableRows = document.querySelectorAll('#proveedoresTableBody tr');
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = Array.from(cells).map(cell => cell.textContent.trim());
                tableData.push(rowData);
            });

            // Generar la tabla en el PDF
            pdf.autoTable({
                head: [headers],
                body: tableData,
                startY: 40, // Ajusta para evitar superposición con el encabezado
            });

            // Generar el URL del PDF
            const pdfURL = pdf.output('bloburl');

            // Abrir el PDF en una nueva pestaña
            const newTab = window.open(pdfURL, '_blank');

            // Verificar si el navegador bloqueó la ventana emergente
            if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
                showAlert('El navegador bloqueó la apertura de una nueva pestaña. Permite ventanas emergentes para esta página.', 'warning');
            } else {
                showAlert('PDF generado y abierto en una nueva pestaña.', 'success');
            }
        };

        img.onerror = () => {
            showAlert('Error al cargar el logo. Verifica la ruta.', 'danger');
        };
    } catch (error) {
        showAlert('Error al generar el PDF.', 'danger');
        console.error('Error al generar PDF:', error);
    }
}
