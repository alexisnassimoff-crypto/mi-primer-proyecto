// Utilidades globales de FactuApp

function formatearMoneda(monto) {
    return '$' + monto.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatearFecha(fechaStr) {
    return new Date(fechaStr).toLocaleDateString('es-AR');
}
