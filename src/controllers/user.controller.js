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

// Crea un nuevo usuario encriptando su contrasena
const createUser = async (req, res) => {
    try {
        const { nombres, apellidos, correo, contrasena, estado, id_rol } = req.body;
        
        // Valida campos estrictamente requeridos
        if (!nombres || !apellidos || !correo || !contrasena) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        // 🔍 VALIDACIÓN DE DUPLICADOS MANUAL (Ignorando Mayúsculas/Minúsculas usando tu repositorio)
        const usuarioExistente = await userRepository.findByCorreo(correo);
        if (usuarioExistente) {
            return res.status(400).json({ 
                message: `El correo electrónico [${correo}] ya se encuentra registrado con otro usuario.` 
            });
        }

        // Hashea la contrasena y mapea el estado a valor numerico
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        const estadoNumero = estado === 'Activo' ? 1 : 0;

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
        
        // Respaldo por si la base de datos bloquea algún otro duplicado no controlado
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

        // 🔍 VALIDACIÓN DE DUPLICADOS AL EDITAR
        const usuarioConEsteCorreo = await userRepository.findByCorreo(correo);
        
        // Si el correo ya existe, pero pertenece a UN ID DIFERENTE al que estamos editando... bloqueamos el paso.
        if (usuarioConEsteCorreo && String(usuarioConEsteCorreo.id_usuario) !== String(id)) {
            return res.status(400).json({ 
                message: `No se puede actualizar. El correo [${correo}] ya está siendo usado por otro usuario.` 
            });
        }

        // Evalua si se envio una nueva contrasena para volver a hashear
        let hashedPassword = null;
        if (contrasena && contrasena.trim() !== '') {
             hashedPassword = await bcrypt.hash(contrasena, 10);
        }

        const estadoNumero = estado === 'Activo' ? 1 : 0;

        const actualizado = await userRepository.updateUser(id, {
            nombres,
            apellidos,
            correo,
            contrasena: hashedPassword, // Si viene con texto se cambia, si es null tu repositorio usa el query sin password
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