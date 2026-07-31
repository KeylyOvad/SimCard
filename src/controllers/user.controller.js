const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcrypt'); 

// Trae todos los usuarios registrados
const getUsers = async (req, res) => {
    try {
        const usuarios = await userRepository.getAllUsers();
        res.json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// Crea un nuevo usuario encriptando su contraseña
const createUser = async (req, res) => {
    try {
        const { nombres, apellidos, correo, contrasena, estado, id_rol } = req.body;
        
        // Valida campos estrictamente requeridos
        if (!nombres || !apellidos || !correo || !contrasena) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        // Valida duplicados ignorando mayúsculas y minúsculas
        const usuarioExistente = await userRepository.findByCorreo(correo);
        if (usuarioExistente) {
            return res.status(400).json({ 
                message: `El correo electrónico [${correo}] ya se encuentra registrado con otro usuario.` 
            });
        }

        // Hashea la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Acepta tanto 1, '1', 'Activo', o true como Activo
        const estadoNumero = (estado === 1 || estado === '1' || estado === 'Activo' || estado === true) ? 1 : 0;

        const nuevoUsuario = await userRepository.createUser({
            nombres,
            apellidos,
            correo,
            contrasena: hashedPassword,
            estado: estadoNumero,
            id_rol: id_rol ? Number(id_rol) : 2 
        });

        res.status(201).json(nuevoUsuario);
    } catch (error) {
        console.error(error);
        
        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry') || error.message.includes('unique constraint')) {
            return res.status(400).json({ message: 'El usuario o correo electrónico ya se encuentra registrado.' });
        }

        res.status(500).json({ message: `Error al crear usuario: ${error.message}` });
    }
};

// Actualiza un usuario existente por su id
const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { nombres, apellidos, correo, contrasena, estado, id_rol } = req.body;

        if (!nombres || !apellidos || !correo) {
            return res.status(400).json({ message: 'Nombres, apellidos y correo son obligatorios' });
        }

        // Validación de duplicados al editar
        const usuarioConEsteCorreo = await userRepository.findByCorreo(correo);
        
        if (usuarioConEsteCorreo && String(usuarioConEsteCorreo.id_usuario) !== String(id)) {
            return res.status(400).json({ 
                message: `No se puede actualizar. El correo [${correo}] ya está siendo usado por otro usuario.` 
            });
        }

        // Evalúa si se envió una nueva contraseña para volver a hashear
        let hashedPassword = null;
        if (contrasena && contrasena.trim() !== '') {
             hashedPassword = await bcrypt.hash(contrasena, 10);
        }

        // Normaliza el estado para la Base de Datos (acepta 1, '1', 'Activo', true)
        const estadoNumero = (estado === 1 || estado === '1' || estado === 'Activo' || estado === true) ? 1 : 0;

        const actualizado = await userRepository.updateUser(id, {
            nombres,
            apellidos,
            correo,
            contrasena: hashedPassword, 
            estado: estadoNumero,
            id_rol: id_rol ? Number(id_rol) : undefined 
        });

        if (!actualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
        }

        res.json({ message: 'Usuario actualizado correctamente', usuarioId: id });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry') || error.message.includes('unique constraint')) {
            return res.status(400).json({ message: 'No se puede actualizar. El correo ingresado ya pertenece a otro usuario.' });
        }

        res.status(500).json({ message: `Error al actualizar usuario: ${error.message}` });
    }
};

// Elimina un usuario del sistema usando su id
const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const eliminado = await userRepository.deleteUser(id);
        
        if (!eliminado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente', id_usuario: id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

module.exports = { 
    getUsers, 
    createUser,
    updateUser, 
    deleteUser 
};