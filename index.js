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
  try{  
    const historial = await kv.get("historial", { store: "guardia-java-store" });
    console.log('Historial desde Edge Config Store:', historial);

    return historial ? JSON.parse(historial) : [];
  } catch (error) {
    console.error("Error al obtener el historial desde Edge Config Store:", error);
    return []; // Devolver un historial vacío en caso de error
  }
}

// Obtener la persona en guardia esta semana
async function obtenerGuardiaActual() {
  try{
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
  await kv.set("historial", JSON.stringify(historial), { store: "guardia-java-store" });
}

app.use(express.json());

app.get("/", async (req, res) => {
  try{  
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
  try{  
    const actual = await obtenerGuardiaActual();
    let index = personas.findIndex(p => p.nombre === actual);
    let siguiente = (index + 1) % personas.length;
    await agregarHistorial(personas[siguiente]);
    res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}` });
  } catch (error) {
    res.status(500).json({ error: "Error al pasar la guardia" });
  }
});


module.exports = app;