const simService = require('../services/sim.service');
const simRepository = require('../repositories/sim.repository'); 


// Trae todas las sims registradas
const getSims = async (req, res) => {
    try {
        const sims = await simService.getSims();
        res.json(sims);
    } catch (error) {
        console.error('Error al obtener SIMs:', error);
        res.status(500).json({ error: error.message });
    }
};

// Busca una sim especifica usando su id
const getSimById = async (req, res) => {
    try {
        const { id } = req.params;
        const sim = await simService.getSimById(id);
        if (!sim) {
            return res.status(404).json({ message: 'SIM no encontrada' });
        }
        res.json(sim);
    } catch (error) {
        console.error('Error al obtener la SIM:', error);
        res.status(500).json({ error: error.message });
    }
};

// Crea una nueva sim con validaciones completas
const createSim = async (req, res) => {
    try {
        // Lee el token para saber que usuario esta haciendo el registro
     const id_usuario_activo = req.user.id;

        const { 
            numeroSim, numeroLinea, tipoSimId, operadorId, 
            planId, capacidadId, estadoId, responsableId, 
            ubicacionId, destinoId 
        } = req.body;

        // Valida que todos los campos obligatorios del formulario tengan datos
        if (
            !numeroSim || !String(numeroSim).trim() ||
            !numeroLinea || !String(numeroLinea).trim() ||
            tipoSimId === "" || !tipoSimId ||
            operadorId === "" || !operadorId ||
            planId === "" || !planId ||
            capacidadId === "" || !capacidadId ||
            estadoId === "" || !estadoId ||
            responsableId === "" || !responsableId ||
            ubicacionId === "" || !ubicacionId ||
            destinoId === "" || !destinoId
        ) {
            return res.status(400).json({ 
                message: 'Error de validacion: Todos los parametros estructurales del formulario son estrictamente obligatorios.' 
            });
        }
        
        // Limpia espacios en blanco y remueve duplicados de los arreglos de ip y apn
        const ipsLimpias = req.body.ip && Array.isArray(req.body.ip) 
            ? Array.from(new Set(req.body.ip.map(i => String(i).trim()))).filter(i => i !== '') 
            : [];
            
        const apnsLimpios = req.body.apn && Array.isArray(req.body.apn) 
            ? req.body.apn.map(a => String(a).trim()).filter(a => a !== '') 
            : [];

        // Verifica que las ip ingresadas no pertenezcan ya a otra sim activa ya que debe ser una ip unica para cada sim
        for (const ip of ipsLimpias) {
            const duplicada = await simRepository.validarIpDuplicadaCrear(ip);
            if (duplicada) {
                return res.status(400).json({ 
                    message: `La direccion IP ${ip} ya esta registrada en la linea N° ${duplicada.num_linea}.` 
                });
            }
        }

        const observacionLimpia = req.body.observacion && String(req.body.observacion).trim() !== '' 
            ? String(req.body.observacion).trim() 
            : null;

        // Guarda el registro enviando los datos procesados y limpios
        const nuevo = await simService.createSim({
            ...req.body,
            observacion: observacionLimpia,
            ip: ipsLimpias,
            apn: apnsLimpios,
            id_user: id_usuario_activo
        });
        
        res.status(201).json(nuevo);
    } catch (error) {
        console.error('Error al crear SIM:', error);
        res.status(500).json({ error: error.message });
    }
};

// Actualiza los datos de una sim y exige una razon de cambio
const updateSim = async (req, res) => {
    try {
        // Lee el token para saber que usuario realiza la modificacion
        const id_usuario_activo = req.user.id;

        const { 
            numeroSim, numeroLinea, tipoSimId, operadorId, 
            planId, capacidadId, estadoId, responsableId, 
            ubicacionId, destinoId, razonModificacion 
        } = req.body;

        // Valida campos obligatorios  que son los parametros y que la razon de cambio tenga un tamaño minimo
        if (
            !numeroSim || !String(numeroSim).trim() ||
            !numeroLinea || !String(numeroLinea).trim() ||
            tipoSimId === "" || !tipoSimId ||
            operadorId === "" || !operadorId ||
            planId === "" || !planId ||
            capacidadId === "" || !capacidadId ||
            estadoId === "" || !estadoId ||
            responsableId === "" || !responsableId ||
            ubicacionId === "" || !ubicacionId ||
            destinoId === "" || !destinoId ||
            !razonModificacion || String(razonModificacion).trim().length < 5
        ) {
            return res.status(400).json({ 
                message: 'Error de validacion: No se permiten campos o parametros obligatorios vacios para actualizar.' 
            });
        }

        const ipsLimpias = req.body.ip && Array.isArray(req.body.ip) 
            ? Array.from(new Set(req.body.ip.map(i => String(i).trim()))).filter(i => i !== '') 
            : [];
            
        const apnsLimpios = req.body.apn && Array.isArray(req.body.apn) 
            ? req.body.apn.map(a => String(a).trim()).filter(a => a !== '') 
            : [];

        // Valida duplicado de ip excluyendo a la misma sim que se esta editando
        for (const ip of ipsLimpias) {
            const duplicada = await simRepository.validarIpDuplicadaActualizar(ip, req.params.id);
            if (duplicada) {
                return res.status(400).json({ 
                    message: `La direccion IP ${ip} ya esta asignada a otra linea activa (Linea N° ${duplicada.num_linea}).` 
                });
            }
        }

        const observacionLimpia = req.body.observacion && String(req.body.observacion).trim() !== '' 
            ? String(req.body.observacion).trim() 
            : null;

        // Ejecuta la actualizacion de la tarjeta sim
        const actualizado = await simService.updateSim(req.params.id, {
            ...req.body,
            observacion: observacionLimpia,
            ip: ipsLimpias,
            apn: apnsLimpios,
            id_user: id_usuario_activo 
        });

        res.json(actualizado);
    } catch (error) {
        console.error('Error al actualizar SIM:', error);
        res.status(500).json({ error: error.message });
    }
};

// Elimina una sim por completo del sistema usando su id 
const deleteSim = async (req, res) => {
    try {
        const eliminada = await simService.deleteSim(req.params.id);
        if (!eliminada) {
            return res.status(404).json({
                message: 'SIM no encontrada'
            });
        }
        res.json({
            message: 'SIM eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar SIM:', error);
        res.status(500).json({
            error: error.message
        });
    }
};

// Obtiene el regristro de cambios de una sinm especifica
const getHistorial = async (req, res) => {
    try {
        const historial = await simService.getHistorial(req.params.id);
        res.json(historial);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
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