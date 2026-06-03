const reporteRepository = require('../repositories/reporte.repository');
const ExcelJS = require('exceljs');

exports.descargarExcel = async (req, res) => {
    try {
        const datos = await reporteRepository.obtenerDatosParaExcel();
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('SIMCARDS CENS');

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

        datos.forEach((item) => {
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
                observacion: item.observacion
            });

            row.getCell(2).numFmt = '@';

            row.eachCell((cell, colNumber) => {
                cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
                cell.border = {
                    bottom: { style: 'hair', color: { argb: 'D9D9D9' } },
                    right: { style: 'thin', color: { argb: 'F2F2F2' } }
                };

                if (colNumber === 6) {
                    const est = cell.value?.toString().trim().toLowerCase();
                    if (est === 'activa') {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2F0D9' } };
                        cell.font = { color: { argb: '385623' }, bold: true };
                    } else if (est) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FBE2D5' } };
                        cell.font = { color: { argb: '843C0C' }, bold: true };
                    }
                }
            });
        });

        
        const headerRow = worksheet.getRow(1);
        headerRow.height = 30;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '92D050' } };
            cell.font = { bold: true, size: 12, color: { argb: '000000' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = { bottom: { style: 'medium' }, right: { style: 'thin' } };
        });

        
        worksheet.autoFilter = { from: 'A1', to: 'O1' };

        worksheet.columns.forEach((column) => {
            let maxLen = 0;
            column.eachCell({ includeEmpty: true }, (cell) => {
                const cellLen = cell.value ? cell.value.toString().length : 0;
                if (cellLen > maxLen) maxLen = cellLen;
            });
            column.width = maxLen < 12 ? 16 : (maxLen > 50 ? 50 : maxLen + 6);
        });

        worksheet.views = [{ state: 'frozen', ySplit: 1 }]; 
        worksheet.showGridLines = false;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Reporte_SIMCARDS_CENS.xlsx');

        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error("Error al generar Excel:", error);
        res.status(500).json({ message: "Error interno al generar el reporte" });
    }
};