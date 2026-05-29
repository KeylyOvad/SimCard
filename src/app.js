require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const authMiddleware = require('./middlewares/auth.middleware');
const userRoutes = require('./routes/user.routes');
const simRoutes = require('./routes/sim.routes');
const operadorRoutes = require('./routes/operador.routes');
const planesRoutes = require('./routes/planes.routes');
const tipoSimRoutes = require('./routes/tipo-sim.routes');
const capacidadRoutes = require('./routes/capacidad.routes');
const ubicacionRoutes = require('./routes/ubicacion.routes');
const destinoRoutes = require('./routes/destino.routes');
const responsableRoutes = require('./routes/responsable.routes');
const estadoRoutes = require('./routes/estado.routes');
const reporteRoutes = require('./routes/reporte.routes');
const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/sims', simRoutes);

app.use('/api/operadores', operadorRoutes);
app.get('/', (req, res) => {
  res.send('Aplicación backend levantada');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend funcionando'
  });
});

app.get('/api/protegido', authMiddleware, (req, res) => {
  res.json({
    message: 'Acceso permitido',
    user: req.user
  });
});

app.use('/api/planes', planesRoutes);
app.use('/api/tiposim', tipoSimRoutes);
app.use('/api/capacidad', capacidadRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/destinos', destinoRoutes);
app.use('/api/responsables', responsableRoutes);
app.use('/api/estados', estadoRoutes);
app.use('/api/reportes', reporteRoutes);


module.exports = app;