const express = required("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("hola mundo");
});

module.exports = app;