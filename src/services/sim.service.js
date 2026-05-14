const simRepository = require('../repositories/sim.repository');

exports.getSims = async () => {
   return await simRepository.getAll();
};