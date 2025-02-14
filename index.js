const express = require("express");
const app = express();
const { put, list, del } = require('@vercel/blob');

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

  // Obtener el historial desde el blob store
  const { blobs } = await list(BLOB_STORE_URL);
  const historial = blobs.map(blob => JSON.parse(blob.content));

  return historial.length > semanasTranscurridas
    ? historial[semanasTranscurridas].persona
    : personas[semanasTranscurridas % personas.length].nombre;
}

// Agregar guardia al historial
async function agregarHistorial(persona) {
  const hoy = new Date().toISOString().split("T")[0];
  const nuevoRegistro = { fecha: hoy, persona: persona.nombre };

  // Guardar el nuevo registro en el blob store
  await put(`${BLOB_STORE_URL}/historial-${Date.now()}.json`, JSON.stringify(nuevoRegistro), {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

app.use(express.json());

app.get("/", async (req, res) => {
  const guardia = await obtenerGuardiaActual();
  const guardiaInfo = personas.find(p => p.nombre === guardia);
  res.json({
    nombre: guardiaInfo.nombre,
    telefono: guardiaInfo.telefono,
    telefonoGeneral
  });
});

app.get("/saltar", async (req, res) => {
  const actual = await obtenerGuardiaActual();

  let index = personas.findIndex(p => p.nombre === actual);
  let siguiente = (index + 1) % personas.length;
  await agregarHistorial(personas[siguiente]);
  res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}` });
});

module.exports = app;