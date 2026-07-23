const simRepository = require('../repositories/sim.repository');

// Solicita al repositorio el listado completo de todas las tarjetas sim activas
exports.getSims = async () => {
    return await simRepository.getAll();
};

// Obtiene la informacion detallada de una tarjeta SIM especifica mediante su id
exports.getSimById = async (id) => {
    return await simRepository.getById(id);
};

// Valida las reglas de negocio e inserta una nueva tarjeta sim en el sistema
exports.createSim = async (data) => {
   
    // Verifica que se incluyan los datos obligatorios de identificacion de la linea
    if (!data.numeroSim || !data.numeroLinea) {
        throw new Error("Número SIM y número de línea son obligatorios");
    }
    
    // Valida que el numero de sim no se encuentre ya registrado para evitar duplicados
    const existente = await simRepository.buscarPorSim(data.numeroSim);
    if (existente) {
        throw new Error("La SIM ya existe");
    }

    // Comprueba la longitud exacta requerida para el codigo pin
    if (data.pin && data.pin.length !== 4) {
        throw new Error("PIN debe tener 4 dígitos");
    }

    // Comprueba la longitud exacta requerida para el codigo puk
    if (data.puk && data.puk.length !== 8) {
        throw new Error("PUK debe tener 8 dígitos");
    }

    // Aplica una expresion regular para verificar que el formato de cada ip sea correcto
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;
    if (data.ip && data.ip.length > 0) {
        for (let ip of data.ip) {
            if (!ipRegex.test(ip)) {
                throw new Error(`IP inválida: ${ip}`);
            }
        }
    }

    // Valida el limite maximo de caracteres permitidos para el campo de observaciones
    if (data.observacion && data.observacion.length > 256) {
        throw new Error("Observación muy larga");
    }

    return await simRepository.crear(data);
};

// Valida las condiciones de actualizacion y aplica los cambios sobre la tarjeta sim
exports.updateSim = async (id, data) => {
    // Exige de manera obligatoria un motivo sustentable para realizar la modificacion
    if (!data.razonModificacion || data.razonModificacion.trim().length < 5) {
        throw new Error("Debe proporcionar una razón válida para la modificación (mínimo 5 caracteres)");
    }

    // Valida la longitud del pin omitiendo el valor por defecto
    if (data.pin && data.pin !== '0' && data.pin.length !== 4) {
        throw new Error("PIN debe tener 4 dígitos");
    }
    // Valida la longitud del puk  omitiendo el valor por defecto
    if (data.puk && data.puk !== '0' && data.puk.length !== 8) {
        throw new Error("PUK debe tener 8 dígitos");
    }

    return await simRepository.actualizar(id, data);
};

// Transmite la instruccion de eliminacion logica de la tarjeta sim seleccionada
exports.deleteSim = async (id) => {
    return await simRepository.eliminar(id);
};

// Solicita la bitacora de modificaciones asegurando que se provea un id valido
exports.getHistorial = async (id) => {
    if (!id) {
        throw new Error("El ID de la SIM es obligatorio para consultar el historial");
    }
    return await simRepository.getHistorial(id);
};