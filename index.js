const express = require("express");
const app = express();

const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const upload = multer({ dest: 'uploads/' });


const telefonoGeneral = "999-999-9999";
const personas = [
  {
    nombre: "Hector Giudatto",
    telefono: "11111111"
  },
  {
    nombre: "Jonathan Bazan",
    telefono: "222222" 
  },
  {
    nombre: "Maximiliano Martin",
    telefono: "33333"
  }
];

async function obtenerHistorial() {
  try {
    const response = await axios.get('https://api.vercel.com/v1/now/blob/guardia-java-blob');
    console.log('Historial desde Blob Store:', response.data);

    return response.data ? JSON.parse(response.data) : [];
  } catch (error) {
    console.error("Error al obtener el historial desde Blob Store:", error);
    return []; // Devolver un historial vacío en caso de error
  }
}
// Obtener la persona en guardia esta semana
async function obtenerGuardiaActual() {
  try {
    const fechaInicio = new Date("2024-01-01"); // Lunes base
    const hoy = new Date();
    const semanasTranscurridas = Math.floor((hoy - fechaInicio) / (7 * 24 * 60 * 60 * 1000));

    const historial = await obtenerHistorial();
    console.log('Historial:', historial);

    if (historial.length > semanasTranscurridas) {
      console.log('Guardia actual desde historial:', historial[semanasTranscurridas].persona);
      return historial[semanasTranscurridas].persona;
    } else {
      const personaGuardia = personas[semanasTranscurridas % personas.length].nombre;
      console.log('Guardia calculada de personas:', personaGuardia);
      return personaGuardia;
    }
  } catch (error) {
    console.error("Error al obtener la guardia actual:", error);
    throw new Error("Error al obtener la guardia actual");
  }
}

// Agregar guardia al historial
async function agregarHistorial(persona) {
  const hoy = new Date().toISOString().split("T")[0];
  const historial = await obtenerHistorial();

  historial.push({ fecha: hoy, persona: persona.nombre });

  const formData = new FormData();
  formData.append('file', JSON.stringify(historial));

  try {
    await axios.post('https://api.vercel.com/v1/now/blob/guardia-java-blob/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}` // Token de autenticación de Vercel
      }
    });
    console.log('Historial actualizado en Blob Store');
  } catch (error) {
    console.error("Error al agregar el historial al Blob Store:", error);
  }
}

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const guardia = await obtenerGuardiaActual();
    const guardiaInfo = personas.find(p => p.nombre === guardia);
    res.json({
      nombre: guardiaInfo.nombre,
      telefono: guardiaInfo.telefono,
      telefonoGeneral
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la guardia actual" });
  }
});

app.get("/saltar", async (req, res) => {
  try {
    const actual = await obtenerGuardiaActual();
    let index = personas.findIndex(p => p.nombre === actual);
    let siguiente = (index + 1) % personas.length;
    await agregarHistorial(personas[siguiente]);
    res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}` });
  } catch (error) {
    res.status(500).json({ error: "Error al pasar la guardia" });
  }
});

// Endpoint para subir archivos (si es necesario para otras operaciones)
app.post("/upload", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const formData = new FormData();
    formData.append('file', req.file.path);

    const response = await axios.post('https://api.vercel.com/v1/now/blob/guardia-java-blob/upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
      }
    });

    res.json({ message: 'File uploaded successfully', file: response.data });
  } catch (error) {
    res.status(500).send('Error uploading file');
  }
});

module.exports = app;