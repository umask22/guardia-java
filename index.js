const express = require("express");
const app = express();
const fs = require("fs");

const archivoHistorial = "historial.json";
const personas = ["Persona 1", "Persona 2", "Persona 3"];

app.get("/", (req, res) => {
    res.send("hola mundo");
});

// Cargar historial o inicializar si no existe
let historial = fs.existsSync(archivoHistorial)
  ? JSON.parse(fs.readFileSync(archivoHistorial))
  : [];

// Obtener la persona en guardia esta semana
function obtenerGuardiaActual() {
  const fechaInicio = new Date("2024-01-01"); // Lunes base
  const hoy = new Date();
  const semanasTranscurridas = Math.floor((hoy - fechaInicio) / (7 * 24 * 60 * 60 * 1000));
  return historial.length > semanasTranscurridas
    ? historial[semanasTranscurridas].persona
    : personas[semanasTranscurridas % personas.length];
}

// Agregar guardia al historial
function agregarHistorial(persona) {
  const hoy = new Date().toISOString().split("T")[0];
  historial.push({ fecha: hoy, persona });
  fs.writeFileSync(archivoHistorial, JSON.stringify(historial, null, 2));
}

app.use(express.json());

app.get("/guardia", (req, res) => {
  const guardia = obtenerGuardiaActual();
  res.json({ guardia });
});

app.post("/saltar", (req, res) => {
  const actual = obtenerGuardiaActual();
  let index = personas.indexOf(actual);
  let siguiente = (index + 1) % personas.length;
  if (personas[siguiente] === "Persona 2") {
    siguiente = (siguiente + 1) % personas.length;
  }
  agregarHistorial(personas[siguiente]);
  res.json({ mensaje: `Guardia pasada a ${personas[siguiente]}` });
});


module.exports = app;