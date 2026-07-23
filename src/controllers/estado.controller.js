const estadoRepository = require('../repositories/estado.repository');

// Trae todos los estados registrados
const getEstados = async (req, res) => {
  try {
    const estados = await estadoRepository.getAllEstados();
    res.json(estados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo estado
const createEstado = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del estado es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    const existente = await estadoRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `El estado [${descripcionNormalizada}] ya se encuentra registrado.`
      });
    }

    const nuevo = await estadoRepository.createEstado({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nuevo);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un estado existente usando su id
const updateEstado = async (req, res) => {
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
        message: 'La descripción del estado es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    const existente = await estadoRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_estado) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. El estado [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizado = await estadoRepository.updateEstado(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Elimina un estado usando su id
const deleteEstado = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminado = await estadoRepository.deleteEstado(id);

    if (!eliminado) {
      return res.status(404).json({
        message: 'Estado no encontrado'
      });
    }

    res.json({
      message: 'Estado eliminado correctamente'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getEstados,
  createEstado,
  updateEstado,
  deleteEstado
};