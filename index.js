const express = require("express");
const app = express();
const { put, list } = require('@vercel/blob');

const telefonoGeneral = "999-999-9999";
const BLOB_STORE_URL = "https://guardia-java-blob.vercel.app"; // URL de tu blob store en Vercel

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

// Obtener la persona en guardia esta semana
async function obtenerGuardiaActual() {
  const fechaInicio = new Date("2024-01-01"); // Lunes base
  const hoy = new Date();
  const semanasTranscurridas = Math.floor((hoy - fechaInicio) / (7 * 24 * 60 * 60 * 1000));

  try {
    // Obtener el historial desde el blob store
    const { blobs } = await list(BLOB_STORE_URL);

    // Filtrar blobs con contenido válido y parsear el historial
    const historial = blobs
      .filter(blob => blob.content) // Filtra blobs con contenido definido
      .map(blob => {
        try {
          return JSON.parse(blob.content); // Intenta parsear el contenido como JSON
        } catch (error) {
          console.error("Error al parsear el blob:", blob.content, error);
          return null; // Si hay un error, devuelve null
        }
      })
      .filter(entry => entry !== null); // Filtra entradas inválidas

    // Inicializar historial si está vacío
    if (historial.length === 0) {
      historial.push({ fecha: "2024-01-01", persona: personas[0].nombre });
    }

    return historial.length > semanasTranscurridas
      ? historial[semanasTranscurridas].persona
      : personas[semanasTranscurridas % personas.length].nombre;
  } catch (error) {
    console.error("Error al obtener el historial desde el blob store:", error);
    return personas[0].nombre; // Devuelve la primera persona como valor predeterminado
  }
}

// Agregar guardia al historial
async function agregarHistorial(persona) {
  const hoy = new Date().toISOString().split("T")[0];
  const nuevoRegistro = { fecha: hoy, persona: persona.nombre };

  try {
    // Guardar el nuevo registro en el blob store
    await put(`${BLOB_STORE_URL}/historial-${Date.now()}.json`, JSON.stringify(nuevoRegistro), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
  } catch (error) {
    console.error("Error al guardar el historial en el blob store:", error);
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
    console.error("Error en la ruta /:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
    console.error("Error en la ruta /saltar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = app;