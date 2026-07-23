require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Para que no nos hackeen las cabeceras tan facil
const rateLimit = require('express-rate-limit'); // Evita que un bot pesado dañe el server a peticiones

const authRoutes = require('./routes/auth.routes');
const { verificarToken } = require('./middlewares/auth.middleware');

const userRoutes = require('./routes/user.routes');
const simRoutes = require('./routes/sim.routes');
const cargaExcelRoutes = require('./routes/carga-excel.routes');
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

// Activa helmet para meter seguridad basica y que no nos hagan XSS o Clickjacking
app.use(helmet());

// Parches extra de seguridad para navegadores viejos e inyecciones raras
app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());

// Esto es para que el navegador no guarde en cache las respuestas y pida datos nuevos siempre
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Borra el header que dice que se usa Express, asi los atacantes no saben en que esta hecha la API
app.disable('x-powered-by');

// Limite de confianza: maximo 150 clicks o peticiones cada 15 minutos por usuario
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150, 
  message: {
    status: 429,
    error: 'Demasiadas solicitudes desde esta IP. Bloqueo temporal por seguridad.'
  },
  standardHeaders: true, // Retorna información de límite en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers obsoletos `X-RateLimit-*`
});
app.use('/api/', globalLimiter);

// Permite que el frontend de Angular en el puerto 4200 pueda hablar con este backend sin bloquearse
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));

// Pone un limite de 10 megas a lo que nos manden para que no nos rompan el server con archivos gigantes
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Rutas abiertas donde cualquiera puede entrar 
app.use('/api/auth', authRoutes);

//todo pide token obligatorio porque si no, no se entra
app.use('/api/usuarios', verificarToken, userRoutes); 
app.use('/api/sims', verificarToken, simRoutes);
app.use('/api/sims', verificarToken, cargaExcelRoutes); 

app.use('/api/operadores', verificarToken, operadorRoutes);
app.use('/api/planes', verificarToken, planesRoutes);
app.use('/api/tiposim', verificarToken, tipoSimRoutes);
app.use('/api/capacidad', verificarToken, capacidadRoutes);
app.use('/api/ubicaciones', verificarToken, ubicacionRoutes);
app.use('/api/destinos', verificarToken, destinoRoutes);
app.use('/api/responsables', verificarToken, responsableRoutes);
app.use('/api/estados', verificarToken, estadoRoutes);
app.use('/api/reportes', verificarToken, reporteRoutes);

// Ruta de bienvenida para ver en el navegador si la API esta corriendo
app.get('/', (req, res) => {
  res.status(200).send('Servicio Activo.');
});

// Ruta rapida para ver que el sistema responde bien y esta vivo
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date()
  });
});

// Un endpoint  para probar en Postman si el middleware del token de verdad bloquea
app.get('/api/protegido', verificarToken, (req, res) => {
  res.json({
    message: 'Acceso permitido',
    user: req.user
  });
});

module.exports = app;