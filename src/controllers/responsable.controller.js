const responsableRepository = require('../repositories/responsable.repository');

// Trae todos los responsables registrados
const getResponsables = async (req, res) => {
  try {
    const responsables = await responsableRepository.getAllResponsables();
    res.json(responsables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo responsable
const createResponsable = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del responsable es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe un responsable con esa misma descripción
    const existente = await responsableRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `El responsable [${descripcionNormalizada}] ya se encuentra registrado.`
      });
    }

    const nuevo = await responsableRepository.createResponsable({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nuevo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un responsable existente usando su id
const updateResponsable = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del responsable es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si el nombre ya pertenece a otro responsable diferente al que estamos editando
    const existente = await responsableRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_responsable) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. El responsable [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizado = await responsableRepository.updateResponsable(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina un responsable usando su id
const deleteResponsable = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminado = await responsableRepository.deleteResponsable(id);

    if (!eliminado) {
      return res.status(404).json({
        message: 'Responsable no encontrado'
      });
    }

    res.json({
      message: 'Responsable eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getResponsables,
  createResponsable,
  updateResponsable,
  deleteResponsable
};