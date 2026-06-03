const cargaExcelRepository = require('../repositories/carga-excel.repository');
const db = require('../config/db'); // Importamos la base de datos para resolver los IDs reales
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
            const filasJSON = xlsx.utils.sheet_to_json(datosHoja, { raw: false });

            if (filasJSON.length === 0) {
                fs.unlinkSync(req.file.path); 
                return res.status(400).json({ message: 'El archivo Excel seleccionado no contiene filas de datos.' });
            }

            // Solicitamos una conexión a la base de datos para hacer las traducciones de texto a ID
            const connection = await db.getConnection();
            
            // Función auxiliar interna para buscar el ID de un texto en cualquier tabla parametrizada
            const obtenerIdDesdeTexto = async (tabla, columnaNombre, valorTexto) => {
                if (!valorTexto) return 1; // Si la celda del Excel está vacía, asigna el ID 1 por defecto
                try {
                    const [rows] = await connection.execute(
                        `SELECT id FROM ${tabla} WHERE UPPER(${columnaNombre}) LIKE ? LIMIT 1`,
                        [`%${valorTexto.trim().toUpperCase()}%`]
                    );
                    return rows.length > 0 ? rows[0].id : 1; // Si no encuentra coincidencia exacta, usa el ID 1
                } catch (err) {
                    return 1; // Resguardo para evitar que el bucle se rompa por un fallo de consulta
                }
            };

            const datosNormalizados = [];

            // Procesamos cada fila del Excel convirtiendo sus textos en IDs de Base de Datos
            for (let i = 0; i < filasJSON.length; i++) {
                const fila = filasJSON[i];

                // Extraemos los valores del Excel mapeando las columnas tal cual las tienes escritas
                const numLinea = fila['Nº Línea'];
                const txtOperador = fila['Operador'];
                const numSim = fila['Serial Sim Card'];
                const txtPlan = fila['Plan'];
                const txtCapacidad = fila['Capacidad'];
                const txtResponsable = fila['Responsable'];
                const txtDestino = fila['Destino'];
                const txtEstado = fila['Estado'];
                
                // Si la fila no contiene el número de línea o el serial de la SIM, la saltamos de forma segura
                if (!numLinea || !numSim) continue;

                // 🔄 TRADUCCIÓN TÉCNICA: Buscamos qué ID numérico representa cada texto del Excel
                const idOperador = await obtenerIdDesdeTexto('operadores', 'nombre', txtOperador);
                const idPlan = await obtenerIdDesdeTexto('planes', 'nombre', txtPlan);
                const idCapacidad = await obtenerIdDesdeTexto('capacidades', 'nombre', txtCapacidad); // Revisa si tu tabla se llama 'capacidades' o 'capacidad'
                const idResponsable = await obtenerIdDesdeTexto('responsables', 'nombre', txtResponsable);
                const idDestino = await obtenerIdDesdeTexto('ubicaciones', 'nombre', txtDestino); // Traduce destinos contra tu tabla de ubicaciones
                const idEstado = await obtenerIdDesdeTexto('estados', 'nombre', txtEstado);

                // Armamos el objeto estructurado con puros IDs numéricos listos para MySQL
                datosNormalizados.push({
                    num_linea: numLinea.toString().trim(),
                    operador: idOperador,       
                    num_sim: numSim.toString().trim().replace(/[\s\.-]/g, ''), // Limpieza de espacios en el serial
                    plan: idPlan,               
                    capacidad: idCapacidad,     
                    responsable: idResponsable, 
                    destino: idDestino,         
                    estado: idEstado            
                });
            }

            connection.release(); // Liberamos la conexión de búsqueda de forma limpia

            // Enviamos los datos perfectamente traducidos a IDs hacia el repositorio SQL
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
                message: 'Fallo crítico al resolver las equivalencias del Excel con los IDs de la base de datos.',
                error: error.message 
            });
        }
    }
}

module.exports = new CargaExcelController();