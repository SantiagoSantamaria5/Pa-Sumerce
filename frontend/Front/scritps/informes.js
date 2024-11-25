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
    // Cargar los datos de inventario al cargar la página
    cargarInventario();

    // Configurar el botón de "Generar PDF"
    const generatePDFButton = document.getElementById('generatePDF');
    if (generatePDFButton) {
        generatePDFButton.addEventListener('click', generarPDF);
    }
});

/**
 * Cargar el inventario desde el servidor y rellenar la tabla.
 */
async function cargarInventario() {
    try {
        // Solicitar datos del inventario
        const inventario = await sendRequest('/inventario', 'GET');
        
        // Referencia al cuerpo de la tabla
        const tableBody = document.getElementById('inventarioTableBody');
        tableBody.innerHTML = ''; // Limpiar contenido previo

        // Rellenar la tabla con los datos
        inventario.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHTML(item.nombre)}</td>
                <td>${item.cantidad}</td>
                <td>${new Date(item.fechaAdquisicion).toLocaleDateString()}</td>
                <td>${new Date(item.fechaVencimiento).toLocaleDateString()}</td>
                <td>${item.valorUnitario.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
            `;
            tableBody.appendChild(row);
        });

        showAlert('Inventario cargado exitosamente.', 'success');
    } catch (error) {
        showAlert(error.message || 'Error al cargar el inventario.', 'danger');
        console.error('Error al cargar inventario:', error);
    }
}

function generarPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        // Color gradiente personalizado
        const gradientColors = {
            start: '#fde0c1',
            end: '#eb955c'
        };

        // Ruta del logo
        const logoPath = "../images/kirby.png";
        const logoWidth = 50;
        const logoHeight = 20;

        const img = new Image();
        img.src = logoPath;
        img.onload = () => {
            // Configuración de estilos personalizados
            pdf.setFillColor(gradientColors.start);
            pdf.rect(0, 0, 210, 297, 'F'); // Fondo completo con gradiente de color

            // Agregar logo con sombra
            pdf.setDrawColor(100);
            pdf.setLineWidth(0.5);
            pdf.addImage(img, 'JPEG', 10, 10, logoWidth, logoHeight);
            
            // Título con estilo
            pdf.setTextColor(50);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(18);
            pdf.text('Informe de Inventario', 70, 25);

            // Recuadro de fecha con diseño
            pdf.setDrawColor(0);
            pdf.setFillColor(gradientColors.end);
            pdf.setTextColor(255);
            pdf.rect(140, 10, 60, 10, 'FD');
            pdf.setFontSize(10);
            pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 145, 17);

            // Configuración de tabla
            const headers = ["Nombre", "Cantidad", "Fecha Adquisición", "Fecha Vencimiento", "Valor Unitario"];
            const tableData = [];
            
            const tableRows = document.querySelectorAll('#inventarioTableBody tr');
            tableRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = Array.from(cells).map(cell => cell.textContent.trim());
                tableData.push(rowData);
            });

            // Generar tabla con estilos
            pdf.autoTable({
                head: [headers],
                body: tableData,
                startY: 40,
                theme: 'striped', // Opciones: 'plain', 'striped', 'grid'
                headStyles: {
                    fillColor: gradientColors.end,
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: '#f3f3f3'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3
                },
                columnStyles: {
                    0: { fontStyle: 'bold' } // Nombre en negrita
                }
            });

            // Pie de página
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text('Informe generado automáticamente', 10, 287);
            pdf.text(`Página 1 de 1`, 180, 287);

            // Generar y abrir PDF
            const pdfURL = pdf.output('bloburl');
            const newTab = window.open(pdfURL, '_blank');
            
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


