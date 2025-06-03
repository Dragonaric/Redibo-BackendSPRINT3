
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
const garantiaRouter  = require('./routes/garantias');

const sprinterosRoutes = require('./Sprinteros'); // Importar las rutas de sprinteros
const OrdenPagoRoutes = require('./routes/paymentOrderRoutes');
const CodezenRoutes = require('./Codezen');

const { carRouter } = require("./routes/cars");
const { airportRouter } = require("./routes/airports");
const { reservationRouter } = require("./routes/reservation");
const { searchRouter } = require("./routes/search");
const { userRouter } = require("./routes/users");

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

app.use('/api', OrdenPagoRoutes);
app.use('/api/cars', carRouter)
app.use('/api/airports', airportRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/search', searchRouter)
app.use('/api/users', userRouter)
app.use('/api/garantias', garantiaRouter);


app.use('/api', CodezenRoutes);


// Puerto
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

});
