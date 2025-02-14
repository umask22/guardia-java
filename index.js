const express = require("express");
const app = express();
const { kv } = require('@vercel/edge-config');

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
  const historial = await kv.get("historial", { store: "guardia-java-store" });
  return historial ? JSON.parse(historial) : [];
}

// Obtener la persona en guardia esta semana
async function obtenerGuardiaActual() {
  const fechaInicio = new Date("2024-01-01"); // Lunes base
  const hoy = new Date();
  const semanasTranscurridas = Math.floor((hoy - fechaInicio) / (7 * 24 * 60 * 60 * 1000));
  const historial = await obtenerHistorial();
  return historial.length > semanasTranscurridas
  ? historial[semanasTranscurridas].persona
  : personas[semanasTranscurridas % personas.length].nombre;
}

// Agregar guardia al historial
async function agregarHistorial(persona) {
  const hoy = new Date().toISOString().split("T")[0];
  const historial = await obtenerHistorial();

  historial.push({ fecha: hoy, persona: persona.nombre });
  await kv.set("historial", JSON.stringify(historial), { store: "guardia-java-store" });
}

app.use(express.json());

app.get("/", async (req, res) => {
  const guardia = obtenerGuardiaActual();
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