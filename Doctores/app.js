var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Importar las nuevas rutas
var indexRouter = require('./routes/index');
var doctorRouter = require('./routes/doctors');
var disponibilidadRouter = require('./routes/disponibilidad');

var app = express();

// Configuración del motor de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Rutas
app.use('/', indexRouter);
app.use('/doctors', doctorRouter);
app.use('/disponibilidad', disponibilidadRouter);

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Doctores y Disponibilidad',
      version: '1.0.0',
      description: 'Documentación de la API de Doctores y Disponibilidad',
    },
    servers: [
      {
        url: `http://doctores:3000`,
      },
    ],
  },
  apis: ['./routes/doctors.js', './routes/disponibilidad.js'], // Ruta a los archivos con endpoints
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Manejo de errores 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Manejador de errores
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

