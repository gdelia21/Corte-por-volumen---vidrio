// --- CONSTANTES DE CÁLCULO ---
// Factores de conversión: botellas por HL (AHORA BASADO EN VOLUMEN FÍSICO REAL)
// 1 HL = 100,000 cc
const BOTTLES_PER_HL_FACTOR = {
    1000: 100000 / 1000,  // 100000cc (1 HL) / 1000cc/botella = 100 botellas/HL
    970: 100000 / 970,    // 100000cc (1 HL) / 970cc/botella = ~103.09 botellas/HL
    925: 100000 / 925     // 100000cc (1 HL) / 925cc/botella = ~108.11 botellas/HL
};

// Constantes de botellas en línea (definidas por el usuario)
const BOTTLES_IN_LINE_DESPAL = 40000; // Lo que hay en la línea desde despaletizadora a llenadora
const BOTTLES_FOR_WASHER_CUT = 27000; // Factor para dejar de hacer hueco en lavadora

// --- FUNCIÓN PRINCIPAL DE CÁLCULO ---
function calculate_cut_points(bottle_volume_cc, hl_ultimo_TP, bottles_filler_opening) {
    if (!(bottle_volume_cc in BOTTLES_PER_HL_FACTOR)) {
        throw new Error(`Volumen de botella no soportado: ${bottle_volume_cc}cc. Los volúmenes soportados son ${Object.keys(BOTTLES_PER_HL_FACTOR).join(', ')}.`);
    }

    const bottles_per_hl = BOTTLES_PER_HL_FACTOR[bottle_volume_cc];

    // Cálculo del CORTE EN DESPALETIZADORA
    // Cantidad de botellas a llenar con el volumen del último tanque
    const bottles_to_fill_from_hl = hl_ultimo_TP * bottles_per_hl;
    
    // Total de botellas en llenadora (al inicio + las que vienen del tanque)
    const total_bottles_in_filler = bottles_filler_opening + bottles_to_fill_from_hl;
    
    // CORTE EN DESPALETIZADORA
    const cut_point_despaletizadora = total_bottles_in_filler - BOTTLES_IN_LINE_DESPAL;

    // Cálculo del DEJAR DE HACER HUECO EN LAVADORA
    const cut_point_lavadora = cut_point_despaletizadora - BOTTLES_FOR_WASHER_CUT;

    return {
        lavadora: cut_point_lavadora,
        despaletizadora: cut_point_despaletizadora
    };
}

// --- OBTENER ELEMENTOS DEL DOM ---
const bottleVolumeSelect = document.getElementById('bottleVolume');
const hlLastTankInput = document.getElementById('hlLastTank');
const bottlesFillerOpeningInput = document.getElementById('bottlesFillerOpening');
const calculateButton = document.getElementById('calculateButton');
const clearButton = document.getElementById('clearButton');
const printButton = document.getElementById('printButton');

const cutPointWasherResult = document.getElementById('cutPointWasherResult');
const cutPointDepalResult = document.getElementById('cutPointDepalResult');
const errorMessageDiv = document.getElementById('errorMessage');
const bottleTypeConfirmation = document.getElementById('bottleTypeConfirmation');

// --- FUNCIONES DE UTILIDAD ---

function showErrorMessage(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
}

function hideErrorMessage() {
    errorMessageDiv.textContent = '';
    errorMessageDiv.style.display = 'none';
}

// Función para actualizar la confirmación visual del tipo de botella
function updateBottleTypeConfirmation() {
    bottleTypeConfirmation.textContent = `Seleccionado: BOTELLAS ${bottleVolumeSelect.value}cc`;
}

// Función para restablecer los resultados a su estado inicial
function resetResultsDisplay() {
    cutPointWasherResult.innerHTML = 'Dejar de hacer hueco en lavadora a las: Esperando datos...';
    cutPointDepalResult.innerHTML = 'Corte en despaletizadora a las: Esperando datos...';
    // Los colores de texto ya están definidos en CSS por la clase result-number
}

// --- EVENT LISTENERS ---

// Event Listener para el botón de cálculo
calculateButton.addEventListener('click', () => {
    hideErrorMessage(); // Ocultar cualquier error previo
    resetResultsDisplay(); // Restablecer los resultados antes de un nuevo cálculo

    const bottleVolume = parseInt(bottleVolumeSelect.value);
    const hlLastTank = parseFloat(hlLastTankInput.value);
    const bottlesFillerOpening = parseFloat(bottlesFillerOpeningInput.value);

    // Validaciones de entrada
    if (isNaN(bottleVolume) || ![1000, 970, 925].includes(bottleVolume)) {
        showErrorMessage('Por favor, selecciona un volumen de botella válido (1000cc, 970cc o 925cc).');
        return;
    }
    if (isNaN(hlLastTank) || hlLastTank <= 0) {
        showErrorMessage('Por favor, ingresa un valor válido y positivo para HL del Último Tanque.');
        return;
    }
    if (isNaN(bottlesFillerOpening) || bottlesFillerOpening < 0) {
        showErrorMessage('Por favor, ingresa un valor válido para Botellas en Llenadora.');
        return;
    }

    try {
        const results = calculate_cut_points(bottleVolume, hlLastTank, bottlesFillerOpening);
        
        // Mostrar los dos resultados con el número en color diferente
        cutPointWasherResult.innerHTML = `Dejar de hacer hueco en lavadora a las: <span class="result-number">${Math.round(results.lavadora).toLocaleString('es-AR')}</span> botellas`;
        cutPointDepalResult.innerHTML = `Corte en despaletizadora a las: <span class="result-number">${Math.round(results.despaletizadora).toLocaleString('es-AR')}</span> botellas`;

    } catch (error) {
        showErrorMessage(`Error en el cálculo: ${error.message}`);
        cutPointWasherResult.innerHTML = 'Dejar de hacer hueco en lavadora a las: <span class="result-number error-text">Error</span>';
        cutPointDepalResult.innerHTML = 'Corte en despaletizadora a las: <span class="result-number error-text">Error</span>';
        // Añadir una clase de error también al número si lo deseas, o solo al mensaje general.
        // Por ahora, solo el mensaje general de error mostrará el texto en rojo.
    }
});

// Event Listener para el botón de limpiar campos
clearButton.addEventListener('click', () => {
    bottleVolumeSelect.value = '1000'; // Reset a un valor por defecto
    hlLastTankInput.value = '';
    bottlesFillerOpeningInput.value = '';
    resetResultsDisplay(); // Limpiar ambos resultados
    hideErrorMessage();
    updateBottleTypeConfirmation(); // Actualizar confirmación al limpiar
});

// Event Listener para el botón de imprimir
printButton.addEventListener('click', () => {
    window.print(); // Esta función activa el diálogo de impresión del navegador
});

// Event Listener para el cambio de selección de volumen de botella
bottleVolumeSelect.addEventListener('change', updateBottleTypeConfirmation);

// Inicializar el estado de la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    resetResultsDisplay(); // Mensajes iniciales en los resultados
    updateBottleTypeConfirmation(); // Establecer la confirmación inicial
});