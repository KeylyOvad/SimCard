const simRepository = require('../repositories/sim.repository');

exports.getSims = async () => {
    return await simRepository.getAll();
};

/**
 * NUEVA: Necesaria para que el Controller funcione y Angular vea la SIM antes de borrar
 */
exports.getSimById = async (id) => {
    return await simRepository.getById(id);
};

exports.createSim = async (data) => {
    if (!data.numeroSim || !data.numeroLinea) {
        throw new Error("Número SIM y número de línea son obligatorios");
    }
    
    const existente = await simRepository.buscarPorSim(data.numeroSim);
    if (existente) {
        throw new Error("La SIM ya existe");
    }

    if (data.pin && data.pin.length !== 4) {
        throw new Error("PIN debe tener 4 dígitos");
    }

    if (data.puk && data.puk.length !== 8) {
        throw new Error("PUK debe tener 8 dígitos");
    }

    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;
    if (data.ip && data.ip.length > 0) {
        for (let ip of data.ip) {
            if (!ipRegex.test(ip)) {
                throw new Error(`IP inválida: ${ip}`);
            }
        }
    }

    if (data.observacion && data.observacion.length > 256) {
        throw new Error("Observación muy larga");
    }

    return await simRepository.crear(data);
};

// CORRECCIÓN: Se cambió .update por .actualizar
exports.updateSim = async (id, data) => {
    // 1. Validamos que exista una razón para el historial
    if (!data.razonModificacion || data.razonModificacion.trim().length < 5) {
        throw new Error("Debe proporcionar una razón válida para la modificación (mínimo 5 caracteres)");
    }

    // 2. Reutilizamos las validaciones de PIN/PUK que ya tienes arriba (opcional pero recomendado)
    if (data.pin && data.pin !== '0' && data.pin.length !== 4) {
        throw new Error("PIN debe tener 4 dígitos");
    }
    if (data.puk && data.puk !== '0' && data.puk.length !== 8) {
        throw new Error("PUK debe tener 8 dígitos");
    }

    // 3. Si todo está bien, llamamos al repository
    return await simRepository.actualizar(id, data);
};

// CORRECCIÓN: Se cambió .delete por .eliminar
exports.deleteSim = async (id) => {
    return await simRepository.eliminar(id);
};

/**
 * Obtiene el historial de modificaciones llamando al repositorio
 */
exports.getHistorial = async (id) => {
    if (!id) {
        throw new Error("El ID de la SIM es obligatorio para consultar el historial");
    }
    return await simRepository.getHistorial(id);
};