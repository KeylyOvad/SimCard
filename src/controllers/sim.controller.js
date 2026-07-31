const simService = require('../services/sim.service');
const simRepository = require('../repositories/sim.repository');

// Limpia espacios en blanco
const limpiarTexto = (texto) => {
    if (texto === null || texto === undefined) return null;
    return String(texto).trim();
};

// Convierte a arreglo de textos validos
const extraerArregloStrings = (arr) => {
    if (!Array.isArray(arr)) return [];
    return Array.from(
        new Set(
            arr
                .filter(item => typeof item === 'string' || typeof item === 'number')
                .map(item => String(item).trim())
                .filter(Boolean)
       )
    );
};

// Obtiene la lista de todas las sim
const getSims = async (req, res) => {
    try {
        const sims = await simService.getSims();
        res.json(sims);
    } catch (error) {
        console.error('Error al obtener SIMs:', error.message);
        res.status(500).json({ message: 'Ocurrió un error interno al consultar las tarjetas SIM.' });
    }
};

// Obtiene una sim por id
const getSimById = async (req, res) => {
    try {
        const { id } = req.params;
        const simId = Number(id);
        
        // Valida que el id sea un numero entero
        if (!Number.isInteger(simId) || simId <= 0) {
            return res.status(400).json({ message: 'El ID provisto no es válido.' });
        }

        const sim = await simService.getSimById(simId);
        if (!sim) {
            return res.status(404).json({ message: 'SIM no encontrada' });
        }
        res.json(sim);
    } catch (error) {
        console.error('Error al obtener la SIM:', error.message);
        res.status(500).json({ message: 'Ocurrió un error interno al consultar el detalle de la SIM.' });
    }
};

// Registra una nueva SIM
const createSim = async (req, res) => {
    try {
        // Valida usuario autenticado
        const id_usuario_activo = req.user?.id;
        if (!id_usuario_activo) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        const {
            numeroSim, numeroLinea, tipoSimId, operadorId,
            planId, capacidadId, estadoId, responsableId,
            ubicacionId, destinoId, pin, puk
        } = req.body;

        // Valida campos obligatorios
        if (
            !numeroSim || !String(numeroSim).trim() ||
            !numeroLinea || !String(numeroLinea).trim() ||
            tipoSimId === "" || tipoSimId === undefined || tipoSimId === null ||
            operadorId === "" || operadorId === undefined || operadorId === null ||
            planId === "" || planId === undefined || planId === null ||
            capacidadId === "" || capacidadId === undefined || capacidadId === null ||
            estadoId === "" || estadoId === undefined || estadoId === null ||
            responsableId === "" || responsableId === undefined || responsableId === null ||
            ubicacionId === "" || ubicacionId === undefined || ubicacionId === null ||
            destinoId === "" || destinoId === undefined || destinoId === null
        ) {
            return res.status(400).json({
                message: 'Error de validación: Todos los parámetros estructurales del formulario son estrictamente obligatorios.'
            });
        }

        const simLimpio = String(numeroSim).trim();
        const lineaLimpia = String(numeroLinea).trim();

        // Valida que no exista la sim o Linea
        const simExistente = await simRepository.validarSimOLineaDuplicadaCrear(simLimpio, lineaLimpia);

        if (simExistente) {
            if (simExistente.num_sim === simLimpio) {
                return res.status(400).json({
                    message: `El número de SIM '${simLimpio}' ya se encuentra registrado en el sistema.`
                });
            }
            if (simExistente.num_linea === lineaLimpia) {
                return res.status(400).json({
                    message: `El número de línea '${lineaLimpia}' ya se encuentra registrado en el sistema.`
                });
            }
        }

        // Limpia arreglos de ip y apn
        const ipsLimpias = extraerArregloStrings(req.body.ip);
        const apnsLimpios = extraerArregloStrings(req.body.apn);

        // Valida ip duplicadas
        for (const ip of ipsLimpias) {
            const duplicada = await simRepository.validarIpDuplicadaCrear(ip);
            if (duplicada) {
                return res.status(400).json({
                    message: `La dirección IP ${ip} ya está registrada en la línea N° ${duplicada.num_linea}.`
                });
            }
        }

        const observacionLimpia = limpiarTexto(req.body.observacion);

        // Arma el objeto para guardar
        const payloadDTO = {
            numeroSim: simLimpio,
            numeroLinea: lineaLimpia,
            tipoSimId: Number(tipoSimId),
            operadorId: Number(operadorId),
            planId: Number(planId),
            capacidadId: Number(capacidadId),
            estadoId: Number(estadoId),
            responsableId: Number(responsableId),
            ubicacionId: Number(ubicacionId),
            destinoId: Number(destinoId),
            pin: pin ? String(pin).trim() : '0000',
            puk: puk ? String(puk).trim() : '00000000',
            observacion: observacionLimpia,
            ip: ipsLimpias,
            apn: apnsLimpios,
            id_user: id_usuario_activo
        };

        const nuevo = await simService.createSim(payloadDTO);
        res.status(201).json(nuevo);

    } catch (error) {
        console.error('Error al crear SIM:', error.message);
        res.status(500).json({ message: 'Error interno del servidor al procesar la creación de la tarjeta SIM.' });
    }
};

// Actualiza una sim existente
const updateSim = async (req, res) => {
    try {
        // Valida usuario autenticado
        const id_usuario_activo = req.user?.id;
        if (!id_usuario_activo) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        // Valida id de la sim
        const simId = Number(req.params.id);
        if (!Number.isInteger(simId) || simId <= 0) {
            return res.status(400).json({ message: 'El ID provisto no es válido.' });
        }

        const {
            numeroSim, numeroLinea, tipoSimId, operadorId,
            planId, capacidadId, estadoId, responsableId,
            ubicacionId, destinoId, razonModificacion, pin, puk
        } = req.body;

        // Valida campos obligatorios y razon de cambio
        if (
            !numeroSim || !String(numeroSim).trim() ||
            !numeroLinea || !String(numeroLinea).trim() ||
            tipoSimId === "" || tipoSimId === undefined || tipoSimId === null ||
            operadorId === "" || operadorId === undefined || operadorId === null ||
            planId === "" || planId === undefined || planId === null ||
            capacidadId === "" || capacidadId === undefined || capacidadId === null ||
            estadoId === "" || estadoId === undefined || estadoId === null ||
            responsableId === "" || responsableId === undefined || responsableId === null ||
            ubicacionId === "" || ubicacionId === undefined || ubicacionId === null ||
            destinoId === "" || destinoId === undefined || destinoId === null ||
            !razonModificacion || String(razonModificacion).trim().length < 5
        ) {
            return res.status(400).json({
                message: 'Error de validación: No se permiten campos vacíos o razón de modificación inferior a 5 caracteres.'
            });
        }

        const simLimpio = String(numeroSim).trim();
        const lineaLimpia = String(numeroLinea).trim();

        // Valida duplicados en otras sim
        const simExistente = await simRepository.validarSimOLineaDuplicadaActualizar(simLimpio, lineaLimpia, simId);

        if (simExistente) {
            if (simExistente.num_sim === simLimpio) {
                return res.status(400).json({
                    message: `El número de SIM '${simLimpio}' ya pertenece a otra tarjeta activa.`
                });
            }
            if (simExistente.num_linea === lineaLimpia) {
                return res.status(400).json({
                    message: `El número de línea '${lineaLimpia}' ya pertenece a otra tarjeta activa.`
                });
            }
        }

        // Limpia arreglos
        const ipsLimpias = extraerArregloStrings(req.body.ip);
        const apnsLimpios = extraerArregloStrings(req.body.apn);

        // Valida ip  duplicadas en otras sim
        for (const ip of ipsLimpias) {
            const duplicada = await simRepository.validarIpDuplicadaActualizar(ip, simId);
            if (duplicada) {
                return res.status(400).json({
                    message: `La dirección IP ${ip} ya está asignada a otra línea activa (Línea N° ${duplicada.num_linea}).`
                });
            }
        }

        const observacionLimpia = limpiarTexto(req.body.observacion);
        const razonLimpia = limpiarTexto(razonModificacion);

        // Arma el objeto para actualizar
        const payloadDTO = {
            numeroSim: simLimpio,
            numeroLinea: lineaLimpia,
            tipoSimId: Number(tipoSimId),
            operadorId: Number(operadorId),
            planId: Number(planId),
            capacidadId: Number(capacidadId),
            estadoId: Number(estadoId),
            responsableId: Number(responsableId),
            ubicacionId: Number(ubicacionId),
            destinoId: Number(destinoId),
            pin: pin ? String(pin).trim() : '0000',
            puk: puk ? String(puk).trim() : '00000000',
            observacion: observacionLimpia,
            razonModificacion: razonLimpia,
            ip: ipsLimpias,
            apn: apnsLimpios,
            id_user: id_usuario_activo
        };

        const actualizado = await simService.updateSim(simId, payloadDTO);
        res.json(actualizado);

    } catch (error) {
        console.error('Error al actualizar SIM:', error.message);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la tarjeta SIM.' });
    }
};

// Elimina una sim por id
const deleteSim = async (req, res) => {
    try {
        const { id } = req.params;
        const simId = Number(id);

        // Valida id
        if (!Number.isInteger(simId) || simId <= 0) {
            return res.status(400).json({ message: 'El ID provisto no es válido.' });
        }

        const eliminada = await simService.deleteSim(simId);
        if (!eliminada) {
            return res.status(404).json({ message: 'SIM no encontrada' });
        }
        res.json({ message: 'SIM eliminada correctamente' });

    } catch (error) {
        console.error('Error al eliminar SIM:', error.message);
        res.status(500).json({ message: 'Error interno del servidor al intentar eliminar la SIM.' });
    }
};

// Obtiene el historial de cambios de una sim
const getHistorial = async (req, res) => {
    try {
        const { id } = req.params;
        const simId = Number(id);

        // Valida id
        if (!Number.isInteger(simId) || simId <= 0) {
            return res.status(400).json({ message: 'El ID provisto no es válido.' });
        }

        const historial = await simService.getHistorial(simId);
        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error.message);
        res.status(500).json({ message: 'Ocurrió un error interno al consultar el historial.' });
    }
};

module.exports = {
    getSims,
    getSimById,
    createSim,
    updateSim,
    deleteSim,
    getHistorial
};