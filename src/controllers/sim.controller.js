const simService = require('../services/sim.service');
const jwt = require('jsonwebtoken'); // Importante para leer tu token de la captura

const getSims = async (req, res) => {
    try {
        const sims = await simService.getSims();
        res.json(sims);
    } catch (error) {
        console.error('Error al obtener SIMs:', error);
        res.status(500).json({ error: error.message });
    }
};

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

const createSim = async (req, res) => {
    try {
        // Lógica para capturar el usuario real
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        let id_usuario_activo = req.body.id_user || 1; 

        if (token) {
            const decoded = jwt.decode(token);
            // Probamos con id_usuario o id según como esté en tu BD
            id_usuario_activo = decoded.id_usuario || decoded.id || id_usuario_activo;
        }
        
        const nuevo = await simService.createSim({
            ...req.body,
            id_user: id_usuario_activo
        });
        
        res.status(201).json(nuevo);
    } catch (error) {
        console.error('Error al crear SIM:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateSim = async (req, res) => {
    try {
        // CAPTURA DEL USUARIO DESDE EL TOKEN
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        // Si no hay token, usamos el del body, y si no, el usuario 1 por defecto
        let id_usuario_activo = req.body.id_user || 1;

        if (token) {
            const decoded = jwt.decode(token);
            // Extraemos el ID real del usuario logueado
            id_usuario_activo = decoded.id_usuario || decoded.id || id_usuario_activo;
        }

        const actualizado = await simService.updateSim(req.params.id, {
            ...req.body,
            id_user: id_usuario_activo 
        });

        res.json(actualizado);
    } catch (error) {
        console.error('Error al actualizar SIM:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteSim = async (req, res) => {
    try {
        await simService.deleteSim(req.params.id);
        res.json({ message: 'SIM eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar SIM:', error);
        res.status(500).json({ error: error.message });
    }
};

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