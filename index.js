
const express = require('express');
const path = require('path');
const app = express();
const port = (process.env.PORT !=undefined ? process.env.PORT : 8080);


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/views/index.html'));
});
app.listen(port, function(err){
    if (err) console.log(err);
    console.log("Server listening on PORT", port);
});
