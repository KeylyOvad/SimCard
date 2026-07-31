const reporteRepository = require('../repositories/reporte.repository');
const ExcelJS = require('exceljs');

exports.descargarExcel = async (req, res) => {
    try {
        // Consulta los datos desde el repositorio
        const datos = await reporteRepository.obtenerDatosParaExcel();

        // Validacion por si no hay registros para exportar
        if (!datos || datos.length === 0) {
            return res.status(404).json({
                message: 'No existen registros para exportar'
            });
        }

        // Creacion de la instancia del libro de Excel y la hoja de trabajo
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('SIMCARDS CENS');

        // Definicion de las columnas con sus encabezados y claves
        worksheet.columns = [
            { header: 'N° LINEA', key: 'num_linea' },
            { header: 'N° SIM', key: 'num_sim' },
            { header: 'OPERADOR', key: 'operador' },
            { header: 'RESPONSABLE', key: 'responsable' },
            { header: 'DESTINO', key: 'destino' },
            { header: 'ESTADO', key: 'estado' },
            { header: 'UBICACION', key: 'ubicacion' },
            { header: 'TIPOSIM', key: 'tipo_sim' },
            { header: 'PLAN', key: 'plan' },
            { header: 'CAPACIDAD', key: 'capacidad' },
            { header: 'PIN', key: 'cod_pin' },
            { header: 'PUK', key: 'cod_puk' },
            { header: 'IP', key: 'ips' },
            { header: 'APN', key: 'apns' },
            { header: 'OBSERVACION', key: 'observacion' }
        ];

        // Iteracion sobre cada registro para insertar las filas
        datos.forEach((item, index) => {
            // Limpia saltos de linea y espacios duplicados en las observaciones
            const observacionLimpia = item.observacion 
                ? String(item.observacion).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
                : '';

            // Mapeo e insercion de los datos en la fila
            const row = worksheet.addRow({
                num_linea: isNaN(item.num_linea) ? item.num_linea : Number(item.num_linea),
                num_sim: item.num_sim ? String(item.num_sim) : '',
                operador: item.operador || '',
                responsable: item.responsable || '',
                destino: item.destino || '',
                estado: item.estado || '',
                ubicacion: item.ubicacion || '',
                tipo_sim: item.tipo_sim || '',
                plan: item.plan || '',
                capacidad: item.capacidad || '',
                cod_pin: item.cod_pin ? String(item.cod_pin) : '',
                cod_puk: item.cod_puk ? String(item.cod_puk) : '',
                ips: item.ips || 'SIN IP',
                apns: item.apns || 'SIN APN',
                observacion: observacionLimpia
            });

            // Determina color de fondo alternado para filas pares e impares
            const esPar = index % 2 === 0;
            const fondoCeldaColor = esPar ? 'F9FAFB' : 'FFFFFF';

            // Formato explicito de texto para campos numericos largos o con ceros a la izquierda
            row.getCell(2).numFmt = '@';
            row.getCell(11).numFmt = '@';
            row.getCell(12).numFmt = '@';

            // Aplicacion de estilos celda por celda
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
                
                // Ajuste de alineacion especial para observaciones 
                if (colNumber === 15) {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
                } else {
                    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false, indent: 1 };
                }
                
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fondoCeldaColor } };

                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };

                // Estilo condicional para la columna ESTADO 
                if (colNumber === 6) {
                    const est = cell.value ? String(cell.value).trim().toLowerCase() : '';
                    cell.alignment = { vertical: 'middle', horizontal: 'center' };

                    if (est === 'activa') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
                        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '065F46' }, bold: true };
                    } else if (est === 'desactivada' || est === 'inactiva') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
                        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '991B1B' }, bold: true };
                    } else if (est) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0F2FE' } };
                        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '0369A1' }, bold: true };
                    }
                }
            });
        });

        // Estilos para la fila de encabezados
        const headerRow = worksheet.getRow(1);
        headerRow.height = 32;
        
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E79' } };
            cell.font = { name: 'Segoe UI', bold: true, size: 11, color: { argb: 'FFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { 
                bottom: { style: 'medium', color: { argb: '111827' } }, 
                right: { style: 'thin', color: { argb: '4B5563' } } 
            };
        });

        // Habilita filtros automaticos en el encabezado
        worksheet.autoFilter = { from: 'A1', to: 'O1' };

        // Ajuste dinamico del ancho de las columnas según su contenido
        worksheet.columns.forEach((column) => {
            let maxLen = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const valStr = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
                if (valStr.length > maxLen) maxLen = valStr.length;
            });
            if (column.key === 'observacion') {
                column.width = 50;
            } else {
                column.width = maxLen < 12 ? 16 : (maxLen > 45 ? 45 : maxLen + 5);
            }
        });

        worksheet.views = [{ state: 'frozen', ySplit: 1 }]; 
        worksheet.showGridLines = true; 

        // Configuracion de cabeceras HTTP para la descarga del archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_SIMCARDS_CENS.xlsx');

        // Transmisión del archivo al cliente
        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error("Error al generar Excel:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error interno al generar el reporte" });
        }
    }
};