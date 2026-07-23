const multer = require('multer');

// Almacena los archivos en la memoria como buffers
const storage = multer.memoryStorage();

// Exporta la configuracion estableciendo un limite maximo de 10 megabytes por archivo
module.exports = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});