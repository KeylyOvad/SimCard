const operadorRepository = require('../repositories/operador.repository');

// Solicita al repositorio el listado completo de operadores activos
const getOperadores = async () => {
    return await operadorRepository.getAllOperadores();
};

// Envia los datos del nuevo operador al repositorio para su creacion
const createOperador = async (operador) => {
     return await operadorRepository.createOperador(operador);
};

// Gestiona la actualizacion de un operador enviando su id y los nuevos datos
const updateOperador = async (id, operador) => {
    return await operadorRepository.updateOperador(id, operador);
};

// Ejecuta la eliminacion de un operador a traves de su id en el repositorio
const deleteOperador = async (id) => {
 return await operadorRepository.deleteOperador(id);
};

module.exports = {
  getOperadores,
  createOperador,
  updateOperador,
  deleteOperador
};