const userRepository = require('../repositories/user.repository');

const bcrypt = require('bcrypt'); 

const getUsers = async (req, res) => {
    try {
    const usuarios = await userRepository.getAllUsers();
    res.json(usuarios);
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

const createUser = async (req, res) => {
    try {
    const { nombres, apellidos, correo, contrasena, estado } = req.body;
    
     if (!nombres || !apellidos || !correo || !contrasena) {
     return res.status(400).json({ message: 'Faltan datos' });
    }

const hashedPassword = await bcrypt.hash(contrasena, 10);

const estadoNumero = estado === 'Activo' ? 1 : 0;

const nuevoUsuario = await userRepository.createUser({
      nombres,
      apellidos,
      correo,
      contrasena: hashedPassword,
      estado: estadoNumero
     });

    res.status(201).json(nuevoUsuario);
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear usuario' });
    }
};

const deleteUser = async (req, res) => {
    try {
    const id = req.params.id;
    const eliminado = await userRepository.deleteUser(id);
    if (!eliminado) {
       return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado correctamente' });

    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

module.exports = { 
  getUsers, 
  createUser,
  deleteUser 
};