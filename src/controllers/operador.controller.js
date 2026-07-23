const operadorRepository = require('../repositories/operador.repository');

// Trae todos los operadores registrados
const getOperadores = async (req, res) => {
  try {
    const operadores = await operadorRepository.getAllOperadores();
    res.json(operadores);
  } catch (error) {
    console.error('Error al obtener operadores:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crea un nuevo operador
const createOperador = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({
        message: 'La descripción del operador es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si ya existe un operador con esa misma descripción
    const existente = await operadorRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (existente) {
      return res.status(400).json({
        message: `El operador [${descripcionNormalizada}] ya se encuentra registrado.`
      });
    }

    const nuevo = await operadorRepository.createOperador({
      descripcion: descripcionNormalizada
    });

    res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear operador:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualiza un operador existente usando su id
const updateOperador = async (req, res) => {
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
        message: 'La descripción del operador es obligatoria'
      });
    }

    const descripcionNormalizada = descripcion.trim();

    // Valida si el nombre ya pertenece a otro operador diferente al que estamos editando
    const existente = await operadorRepository.findByDescripcion(
      descripcionNormalizada
    );

    if (
      existente &&
      String(existente.id_operador) !== String(id)
    ) {
      return res.status(400).json({
        message: `No se puede actualizar. El operador [${descripcionNormalizada}] ya existe.`
      });
    }

    const actualizado = await operadorRepository.updateOperador(id, {
      descripcion: descripcionNormalizada
    });

    res.json(actualizado);

  } catch (error) {
    console.error('Error al actualizar operador:', error);
    res.status(500).json({ error: error.message });
  }
};

// Elimina un operador usando su id
const deleteOperador = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: 'ID inválido'
      });
    }

    const eliminado = await operadorRepository.deleteOperador(id);

    if (!eliminado) {
      return res.status(404).json({
        message: 'Operador no encontrado'
      });
    }

    res.json({
      message: 'Operador eliminado correctamente'
    });

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