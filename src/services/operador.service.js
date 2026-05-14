const operadorRepository = require('../repositories/operador.repository');

const getOperadores = async () => {
    return await operadorRepository.getAllOperadores();
};
const createOperador = async (operador) => {
     return await operadorRepository.createOperador(operador);
};
const updateOperador = async (id, operador) => {
    return await operadorRepository.updateOperador(id, operador);
};

const deleteOperador = async (id) => {
 return await operadorRepository.deleteOperador(id);
};

module.exports = {
  getOperadores,
  createOperador,
  updateOperador,
  deleteOperador
};
