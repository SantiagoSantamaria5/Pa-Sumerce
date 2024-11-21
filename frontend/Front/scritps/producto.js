
document.getElementById('addPanForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombrePan = document.getElementById('nombrePan').value;
    const ingredientes = [];
    const ingredientInputs = document.querySelectorAll('#ingredientInputs select, #ingredientInputs input[type="number"]');

    for (let i = 0; i < ingredientInputs.length; i += 2) {
        const ingrediente = ingredientInputs[i].value;
        const gramos = ingredientInputs[i + 1].value;
        if (ingrediente && gramos) {
            ingredientes.push({ ingrediente, gramos });
        }
    }

    // Solicitar el precio antes de guardar
    const precio = prompt("Ingrese el precio del pan:");
    if (precio === null || precio.trim() === "") {
        alert("El precio es requerido. No se guardará el pan.");
        return; // Salir si no se proporciona precio
    }

    try {
        const response = await fetch('http://localhost:5000/api/pan/agregar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre: nombrePan, ingredientes: ingredientes })
        });

        if (!response.ok) {
            throw new Error('Error al guardar el pan');
        }

        const result = await response.json();
        alert('Pan agregado exitosamente: ' + result.nombre);
        
        // Guardar el precio en el localStorage
        localStorage.setItem('precioPan', precio);

        document.getElementById('addPanForm').reset();
        document.getElementById('ingredientesContainer').innerHTML = `
            <label class="form-label">Ingredientes (gramos)</label>
            <div class="d-flex align-items-center" id="ingredientInputs">
                <select class="form-select" id="SelectIngrediente" onchange="cargarIngrediente()">
                    <option value="">Seleccione el ingrediente</option>
                </select>
                <input type="number" class="form-control me-2" placeholder="Gramos" required>
                <button type="button" class="btn btn-danger btn-sm removeIngredientBtn" style="display: none;">❌</button>
            </div>
        `;
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

document.getElementById('addIngredientBtn').addEventListener('click', () => {
    const newIngredientSelect = document.createElement('select');
    newIngredientSelect.className = 'form-select me-2';
    newIngredientSelect.innerHTML = `
        <option value="">Seleccione el ingrediente</option>
        <option value="Ingrediente1">Ingrediente 1</option>
        <option value="Ingrediente2">Ingrediente 2</option>
        <option value="Ingrediente3">Ingrediente 3</option>
    `;

    const newGramsInput = document.createElement('input');
    newGramsInput.type = 'number';
    newGramsInput.className = 'form-control me-2';
    newGramsInput.placeholder = 'Gramos';
    newGramsInput.required = true;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-sm removeIngredientBtn';
    removeBtn.textContent = '❌';

    const ingredientContainer = document.createElement('div');
    ingredientContainer.className = 'd-flex align-items-center my-2';
    ingredientContainer.appendChild(newIngredientSelect);
    ingredientContainer.appendChild(newGramsInput);
    ingredientContainer.appendChild(removeBtn);

    document.getElementById('ingredientesContainer').appendChild(ingredientContainer);

    removeBtn.addEventListener('click', () => {
        ingredientContainer.remove();
    });
});