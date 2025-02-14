const express = require("express");
const app = express();
const fs = require("fs");

const archivoHistorial = "historial.json";
const telefonoGeneral = "999-999-9999";
let historial = [];

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

try {
  if (fs.existsSync(archivoHistorial)) {
    historial = JSON.parse(fs.readFileSync(archivoHistorial));
  }
} catch (error) {
  console.error("Error al leer el archivo de historial:", error);
}

// Obtener la persona en guardia esta semana
function obtenerGuardiaActual() {
  const fechaInicio = new Date("2024-01-01"); // Lunes base
  const hoy = new Date();
  const semanasTranscurridas = Math.floor((hoy - fechaInicio) / (7 * 24 * 60 * 60 * 1000));
  return historial.length > semanasTranscurridas
  ? historial[semanasTranscurridas].persona
  : personas[semanasTranscurridas % personas.length].nombre;
}

// Agregar guardia al historial
function agregarHistorial(persona) {
  const hoy = new Date().toISOString().split("T")[0];
  historial.push({ fecha: hoy, persona: persona.nombre }); // Guarda solo el nombre
  try {
    fs.writeFileSync(archivoHistorial, JSON.stringify(historial, null, 2));
    historial = JSON.parse(fs.readFileSync(archivoHistorial));
  } catch (error) {
    console.error("Error al escribir o leer el archivo de historial:", error);
  }
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

app.get("/saltar", (req, res) => {
  const actual = obtenerGuardiaActual();
  let index = personas.findIndex(p => p.nombre === actual);
  let siguiente = (index + 1) % personas.length;
  agregarHistorial(personas[siguiente]);
  res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}` });
});


module.exports = app;