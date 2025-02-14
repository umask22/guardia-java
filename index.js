const express = require("express");
const app = express();
const fs = require("fs");

const archivoHistorial = "historial.json";
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

app.get("/", (req, res) => {
  const guardia = obtenerGuardiaActual();
  const guardiaInfo = personas.find(p => p.nombre === guardia);
  res.json({
    nombre: guardiaInfo.nombre,
    telefono: guardiaInfo.telefono,
    telefonoGeneral
  });
});

app.post("/saltar", (req, res) => {
  const actual = obtenerGuardiaActual();

  let index = personas.findIndex(p => p.nombre === actual);
  let siguiente = (index + 1) % personas.length;
  agregarHistorial(personas[siguiente].nombre);
  res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}` });
});


module.exports = app;