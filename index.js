const express = require("express");
const app = express();
const { put, get, del } = require('@vercel/blob'); // Importar `del` para eliminar blobs

const telefonoGeneral = "999-999-9999";
const BLOB_STORE_URL = "https://guardia-java-blob.vercel.app"; // URL de tu blob store en Vercel
const ARCHIVO_HISTORIAL = "historial.json"; // Nombre del archivo de historial

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
  try {
    // Obtener el historial desde el blob store
    const blob = await get(`${BLOB_STORE_URL}/${ARCHIVO_HISTORIAL}`);

    // Si el archivo no existe, devolver la primera persona
    if (!blob) {
      return personas[0].nombre;
    }

    // Parsear el contenido del blob como JSON
    const historial = JSON.parse(blob.content);

    console.log("Historial obtenido:", historial); // Log para depuración

    // Si hay historial, devolver la última entrada
    if (historial.length > 0) {
      return historial[historial.length - 1].persona;
    }

    // Si no hay historial, devolver la primera persona
    return personas[0].nombre;
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
    // Obtener el historial actual
    let historial = [];
    try {
      const blob = await get(`${BLOB_STORE_URL}/${ARCHIVO_HISTORIAL}`);
      if (blob) {
        historial = JSON.parse(blob.content);
      }
    } catch (error) {
      console.error("Error al obtener el historial:", error);
    }

    // Agregar el nuevo registro al historial
    historial.push(nuevoRegistro);

    // Eliminar el archivo existente (si existe)
    try {
      await del(`${BLOB_STORE_URL}/${ARCHIVO_HISTORIAL}`);
      console.log("Archivo existente eliminado.");
    } catch (error) {
      console.error("Error al eliminar el archivo existente:", error);
    }

    // Guardar el historial actualizado en el blob store
    await put(`${BLOB_STORE_URL}/${ARCHIVO_HISTORIAL}`, JSON.stringify(historial), {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    console.log("Nuevo registro guardado:", nuevoRegistro); // Log para verificar
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

    // Forzar la actualización del historial
    const nuevaGuardia = await obtenerGuardiaActual();
    res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}`, nuevaGuardia });
  } catch (error) {
    console.error("Error en la ruta /saltar:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = app;