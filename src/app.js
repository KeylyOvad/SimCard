require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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

// 1. CORS primero siempre
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://cens-wdl04:8088/',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true 
}));

// Cabeceras de seguridad

app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), fullscreen=(self)'
  );
  next();
});

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: []
      }
    }
  })
);

app.use(helmet.noSniff());
app.use(helmet.ieNoOpen());

// Desactivar caché en el navegador
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.disable('x-powered-by');

// 3. Rate limiter ampliado para evitar bloqueos
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000, // Límite de peticiones
  message: {
    status: 429,
    error: 'Demasiadas solicitudes desde esta IP. Bloqueo temporal por seguridad.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Lectura de JSON y formularios (máximo 10mb)
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rutas públicas
app.use('/api/auth', authRoutes);

// 5. Rutas protegidas con token
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

// Rutas de prueba
app.get('/', (req, res) => {
  res.status(200).send('Servicio Activo.');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date()
  });
});

app.get('/api/protegido', verificarToken, (req, res) => {
  res.json({
    message: 'Acceso permitido',
    user: req.user
  });
});

module.exports = app;