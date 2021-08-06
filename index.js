const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT != undefined ? process.env.PORT : 8080;
const sqlite3 = require("sqlite3").verbose();
const cookieParser = require('cookie-parser');
app.use(cookieParser())
// open the database
let db = new sqlite3.Database("./db/db.db", sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the database.");
});

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/views/index.html"));
});
app.use("/static", express.static(path.join(__dirname, "/static")));
app.get("/:id", function (req, res) {
  let id = req.params.id;
  db.all(`SELECT url FROM links WHERE token=?`, [id], (err, rows) => {
    console.log(JSON.stringify(rows));
    if (rows.length && rows[0].url) {
      res.redirect(rows[0].url);
    } else {
      res.sendFile(path.join(__dirname, "/views/404.html"));
    }
  });
});

app.listen(port, function (err) {
  if (err) console.log(err);
  console.log("Server listening on PORT", port);
});
