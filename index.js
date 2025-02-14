const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { put, list } = require("@vercel/blob");

const app = express();
const upload = multer({ dest: "/tmp/" });

const telefonoGeneral = "999-999-9999";
const personas = [
  { nombre: "Hector Giudatto", telefono: "11111111" },
  { nombre: "Jonathan Bazan", telefono: "222222" },
  { nombre: "Maximiliano Martin", telefono: "33333" },
];

const BLOB_NAME = "historial.json";

async function obtenerHistorial() {
  try {
    const blobs = await list();
    const historialBlob = blobs.blobs.find((blob) => blob.pathname === BLOB_NAME);
    
    if (!historialBlob) {
      console.log("No hay historial en Blob Store");
      return [];
    }

    const response = await axios.get(historialBlob.url);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el historial desde Blob Store:", error);
    return [];
  }
}

async function obtenerGuardiaActual() {
  try {
    const fechaInicio = new Date("2024-01-01");
    const hoy = new Date();
    const semanasTranscurridas = Math.floor((hoy - fechaInicio) / (7 * 24 * 60 * 60 * 1000));
    const historial = await obtenerHistorial();
    
    if (historial.length > semanasTranscurridas) {
      return historial[semanasTranscurridas].persona;
    } else {
      return personas[semanasTranscurridas % personas.length].nombre;
    }
  } catch (error) {
    console.error("Error al obtener la guardia actual:", error);
    throw new Error("Error al obtener la guardia actual");
  }
}

async function agregarHistorial(persona) {
  try {
    const hoy = new Date().toISOString().split("T")[0];
    const historial = await obtenerHistorial();
    historial.push({ fecha: hoy, persona: persona.nombre });

    const jsonData = JSON.stringify(historial);
    const { url } = await put(BLOB_NAME, jsonData, { access: "public" });

    console.log("Historial actualizado en Blob Store:", url);
  } catch (error) {
    console.error("Error al agregar el historial al Blob Store:", error);
  }
}

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const guardia = await obtenerGuardiaActual();
    const guardiaInfo = personas.find((p) => p.nombre === guardia);
    res.json({
      nombre: guardiaInfo.nombre,
      telefono: guardiaInfo.telefono,
      telefonoGeneral,
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la guardia actual" });
  }
});

app.get("/saltar", async (req, res) => {
  try {
    const actual = await obtenerGuardiaActual();
    let index = personas.findIndex((p) => p.nombre === actual);
    let siguiente = (index + 1) % personas.length;
    await agregarHistorial(personas[siguiente]);
    res.json({ mensaje: `Guardia pasada a ${personas[siguiente].nombre}` });
  } catch (error) {
    res.status(500).json({ error: "Error al pasar la guardia" });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    const filePath = path.join("/tmp", req.file.filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const { url } = await put(req.file.originalname, fileContent, { access: "public" });

    fs.unlinkSync(filePath);
    res.json({ message: "File uploaded successfully", file: url });
  } catch (error) {
    console.error("Error uploading file to Vercel Blob Store:", error);
    res.status(500).send("Error uploading file");
  }
});

module.exports = app;
