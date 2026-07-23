const reporteRepository = require('../repositories/reporte.repository');
const ExcelJS = require('exceljs');

exports.descargarExcel = async (req, res) => {
    try {
        // Obtiene los datos de la base de datos
        const datos = await reporteRepository.obtenerDatosParaExcel();

        
     if (!datos || datos.length === 0) {
    return res.status(404).json({
        message: 'No existen registros para exportar'
    });
    }

        
        // Crea el libro y la hoja de calculo Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('SIMCARDS CENS');

        // Define las columnas del reporte con sus llaves correspondientes
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

        // Ciclo para agregar los datos y aplicar los estilos por celda
        datos.forEach((item, index) => {
            
            // Limpia los saltos de linea en las observaciones
            const observacionLimpia = item.observacion 
                ? item.observacion.toString().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
                : '';

            // Inserta la fila con el formato adecuado
            const row = worksheet.addRow({
                num_linea: isNaN(item.num_linea) ? item.num_linea : Number(item.num_linea),
                num_sim: item.num_sim ? item.num_sim.toString() : '',
                operador: item.operador,
                responsable: item.responsable,
                destino: item.destino,
                estado: item.estado,
                ubicacion: item.ubicacion,
                tipo_sim: item.tipo_sim,
                plan: item.plan,
                capacidad: item.capacidad,
                cod_pin: item.cod_pin,
                cod_puk: item.cod_puk,
                ips: item.ips,
                apns: item.apns,
                observacion: observacionLimpia
            });

            // Determina el color de fondo intercalado para las filas
            const esPar = index % 2 === 0;
            const fondoCeldaColor = esPar ? 'F9FAFB' : 'FFFFFF';

            // Fuerza la columna N° SIM a ser tratada como texto ya que al descargarse lo hace como hexadecimal 
            row.getCell(2).numFmt = '@';

            // Aplica fuentes bordes y alineaciones a cada celda de la fila
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF333333' } };
                
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

                // Formato condicional de colores de acuerdo al valor del Estado
                if (colNumber === 6) {
                    const est = cell.value?.toString().trim().toLowerCase();
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

        // Aplica estilos personalizados a la fila de cabeceras 
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

        // Agrega filtros automaticos a los encabezados
        worksheet.autoFilter = { from: 'A1', to: 'O1' };

        // Calcula el ancho automatico de las columnas segun el contenido ya que hay varias datos que tiene muchos caracteres
        worksheet.columns.forEach((column) => {
            let maxLen = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const cellLen = cell.value ? cell.value.toString().length : 0;
                if (cellLen > maxLen) maxLen = cellLen;
            });
            if (column.key === 'observacion') {
                column.width = 50;
            } else {
                column.width = maxLen < 12 ? 16 : (maxLen > 45 ? 45 : maxLen + 5);
            }
        });

        // Congela la primera fila y habilita las lineas de cuadricula
        worksheet.views = [{ state: 'frozen', ySplit: 1 }]; 
        worksheet.showGridLines = true; 

        // Configura las cabeceras HTTP de descarga y envia el archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_SIMCARDS_CENS.xlsx');

        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error("Error al generar Excel:", error);
        res.status(500).json({ message: "Error interno al generar el reporte" });
    }
};