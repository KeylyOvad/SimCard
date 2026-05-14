const capacidadRepository = require('../repositories/capacidad.repository');

const getCapacidades = async (req, res) => {
   try {
   const capacidades = await capacidadRepository.getAllCapacidades();
   res.json(capacidades);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

const createCapacidad = async (req, res) => {
   try {
   const nueva = await capacidadRepository.createCapacidad(req.body);
   res.status(201).json(nueva);
    } catch (error) {

    res.status(500).json({ error: error.message });
    }
};

const updateCapacidad = async (req, res) => {
   try {
    const actualizada = await capacidadRepository.updateCapacidad(req.params.id, req.body);
    res.json(actualizada);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const deleteCapacidad = async (req, res) => {
    try {
    await capacidadRepository.deleteCapacidad(req.params.id);
    res.json({ message: 'Capacidad eliminada correctamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCapacidades,
  createCapacidad,
  updateCapacidad,
  deleteCapacidad

};