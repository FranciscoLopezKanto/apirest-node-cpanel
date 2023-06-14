const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const bodyParser = require('body-parser');

// Middleware para analizar el cuerpo de las solicitudes como JSON
app.use(bodyParser.json());

// Habilitar CORS
app.use(cors());

// Configuración de la base de datos
const pool = new Pool({
  connectionString: 'postgres://mmsqxbxg:HZYvCd7KAvBkb9ZNswioa_Pg5ajJ4-Nq@silly.db.elephantsql.com:5432/mmsqxbxg',
});

// Ruta para recibir las solicitudes POST de reservas
app.post('/api/reservations', (req, res) => {
  const { service, numberOfPeople, date } = req.body;

  // Validación básica de los datos de entrada
  if (!service || numberOfPeople <= 0 || !date) {
    return res.status(400).json({ error: 'Datos de reserva inválidos' });
  }

  // Crear una nueva reserva
  const newReservation = {
    service,
    numberOfPeople,
    date: new Date(date), // Asegurar que la fecha sea un objeto de tipo Date válido
  };

  // Verificar si la fecha es válida antes de formatearla
  if (newReservation.date instanceof Date && !isNaN(newReservation.date)) {
    // Formatear la fecha como 'YYYY-MM-DD'
    newReservation.date = newReservation.date.toISOString().split('T')[0];
  } else {
    // Manejar el caso de fecha inválida
    return res.status(400).json({ error: 'Fecha de reserva inválida' });
  }

  // Guardar la reserva en la base de datos
  pool.query(
    'INSERT INTO reservas (tipo_servicio, cant_personas, fecha) VALUES ($1, $2, $3)',
    [newReservation.service, newReservation.numberOfPeople, newReservation.date],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al guardar la reserva' });
      }

      // Enviar una respuesta exitosa
      res.status(201).json({ message: 'Reserva creada exitosamente' });
    }
  );
});

// Ruta para obtener todas las reservas guardadas
app.get('/api/reservations', (req, res) => {
  // Obtener todas las reservas de la base de datos
  pool.query('SELECT * FROM reservas', (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener las reservas' });
    }

    try {
      // Formatear las fechas de las reservas existentes
      const formattedReservations = result.rows.map((row) => {
        return {
          service: row.tipo_servicio,
          numberOfPeople: row.cant_personas,
          date: row.fecha instanceof Date ? row.fecha.toISOString().split('T')[0] : null,
          timestamp: row.timestamp,
        };
      });

      // Enviar las reservas formateadas como respuesta
      res.json(formattedReservations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al formatear las fechas de las reservas' });
    }
  });
});
// Ruta para obtener las fechas bloqueadas
// Ruta para obtener las fechas bloqueadas
app.get('/api/blocked-dates', (req, res) => {
  // Obtener las fechas bloqueadas de la base de datos
  pool.query('SELECT fecha FROM reservas WHERE fecha >= CURRENT_DATE', (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener las fechas bloqueadas' });
    }

    try {
      // Formatear las fechas bloqueadas como 'YYYY-MM-DD'
      const blockedDates = result.rows.map((row) => row.fecha.toISOString().split('T')[0]);

      // Enviar las fechas bloqueadas como respuesta
      res.json(blockedDates);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al formatear las fechas bloqueadas' });
    }
  });
});

// Iniciar el servidor en el puerto 3001
app.listen(3001, () => {
  console.log('Servidor backend iniciado en el puerto 3001');
});
