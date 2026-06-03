const cargaExcelRepository = require('../repositories/carga-excel.repository');
const xlsx = require('xlsx');
const fs = require('fs');

class CargaExcelController {

    async procesarArchivoSims(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Error de transmisión: No se recibió ningún archivo Excel.' });
            }

            const workbook = xlsx.readFile(req.file.path);
            const primeraHoja = workbook.SheetNames[0]; 
            const datosHoja = workbook.Sheets[primeraHoja];
            
            // raw: false asegura que lea los números de teléfono, seriales y capacidades como texto puro strings
            const filasJSON = xlsx.utils.sheet_to_json(datosHoja, { raw: false });

            if (filasJSON.length === 0) {
                fs.unlinkSync(req.file.path); 
                return res.status(400).json({ message: 'El archivo Excel seleccionado no contiene filas de datos.' });
            }

            // Normalizamos el JSON mapeando los nombres exactos de las columnas de tu Excel a propiedades fijas
            const datosNormalizados = filasJSON.map((fila) => {
                return {
                    // Mapeo uno a uno de las columnas con caracteres especiales del Excel
                    num_linea: fila['Nº Línea'] ? fila['Nº Línea'].toString().trim() : null,
                    operador: fila['Operador'] ? fila['Operador'].toString().trim() : 'Sin Operador',
                    num_sim: fila['Serial Sim Card'] ? fila['Serial Sim Card'].toString().trim().replace(/[\s\.-]/g, '') : null,
                    plan: fila['Plan'] ? fila['Plan'].toString().trim() : 'Sin Plan',
                    capacidad: fila['Capacidad'] ? fila['Capacidad'].toString().trim() : 'N/A',
                    responsable: fila['Responsable'] ? fila['Responsable'].toString().trim() : 'Sin Responsable',
                    destino: fila['Destino'] ? fila['Destino'].toString().trim() : 'General',
                    estado: fila['Estado'] ? fila['Estado'].toString().trim() : 'Activa'
                };
            });

            // Pasamos el arreglo de objetos de texto limpio al repositorio
            const totalInsertados = await cargaExcelRepository.insertarSimsMasivo(datosNormalizados);

            fs.unlinkSync(req.file.path);

            return res.status(200).json({
                message: `Carga masiva completada exitosamente en el sistema CENS.`,
                registrosProcesados: totalInsertados
            });

        } catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            console.error('Error en CargaExcelController:', error);
            return res.status(500).json({ 
                message: 'Fallo crítico en el servidor al parsear el texto del Excel.',
                error: error.message 
            });
        }
    }
}

module.exports = new CargaExcelController();