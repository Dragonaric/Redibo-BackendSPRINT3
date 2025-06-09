
require('./cronJobs/reservationCleanup');

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const passport = require('./config/passport');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const cityRoutes = require('./routes/cityRoutes');
const authRoutes = require('./routes/authRoutes');
const garantiaRouter = require('./routes/garantias');
const paymentVoucherRoutes = require('./routes/paymentVoucherRoutes');
const transaccionesRoutes = require('./routes/transaccionesRoutes');
const pdfRoutes = require('./routes/pdfRoutes');

const sprinterosRoutes = require('./Sprinteros'); // Importar las rutas de sprinteros
const OrdenPagoRoutes = require('./routes/paymentOrderRoutes');
const uploadRoutes = require("./routes/uploadRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const licenseRoutes = require("./routes/licenseRoutes");
const CodezenRoutes = require('./Codezen');
const driversRoutes = require('./routes/driversRoutes');
const searchesRoutes = require('./routes/busquedasRoutes');
const busquedasRoutes = require('./routes/busquedasRoutes');

const { carRouter } = require("./routes/cars");
const { airportRouter } = require("./routes/airports");
const { reservationRouter } = require("./routes/reservation");
const { searchRouter } = require("./routes/search");
const { userRouter } = require("./routes/users");
const associationRoutes = require('./routes/associationRoutes');
const { transaccion } = require('./config/prisma');
const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://faithful-respect-production.up.railway.app",
  "https://redibo.up.railway.app"
];
app.disable("x-powered-by")

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

app.use(passport.initialize());

// Ruta principal
app.get('/', (req, res) => {
  res.send('server is running');
});

// Rutas de la API
app.use('/api', userRoutes);
app.use('/api', cityRoutes);
app.use('/api/auth', authRoutes);

app.use('/api', sprinterosRoutes);
app.use('/api', transaccionesRoutes)
app.use('/api', OrdenPagoRoutes);

app.use('/api', paymentVoucherRoutes);
app.use('/api', pdfRoutes);
app.use("/api", uploadRoutes);
app.use("/api", sessionRoutes);
app.use("/api", licenseRoutes);

app.use('/api', CodezenRoutes);

app.use("/api", associationRoutes);

app.use("/api", driversRoutes);
app.use("/api", searchesRoutes);
app.use("/api", busquedasRoutes);

app.use('/api', carRouter)
app.use('/api', airportRouter)
app.use('/api', reservationRouter)
app.use('/api', searchRouter)
app.use('/api', userRouter)
app.use('/api', garantiaRouter);
// Puerto
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

});
