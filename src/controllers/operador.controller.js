 const operadorRepository = require('../repositories/operador.repository');

const getOperadores = async (req, res) => {
    try {
    const operadores = await operadorRepository.getAllOperadores();
    res.json(operadores);
 }  catch (error) {
    console.error('Error al obtener operadores:', error);
    res.status(500).json({ error: error.message });
 }
};

const createOperador = async (req, res) => {
    try {
    const nuevo = await operadorRepository.createOperador(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear operador:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateOperador = async (req, res) => {
    try {
    const actualizado = await operadorRepository.updateOperador(req.params.id, req.body);
    res.json(actualizado);
    } catch (error) {
    console.error('Error al actualizar operador:', error);
    res.status(500).json({ error: error.message });
 }
};

const deleteOperador = async (req, res) => {
    try {
    await operadorRepository.deleteOperador(req.params.id);
    res.json({ message: 'Operador eliminado correctamente' });
    } catch (error) {
    console.error('Error al eliminar operador:', error);
    res.status(500).json({ error: error.message });
 }
};

module.exports = {
  getOperadores,
  createOperador,
  updateOperador,
  deleteOperador
};