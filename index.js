require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns');
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/urldb', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection fails!'));
db.once('open', function () {
    console.log('Connected to database...');
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});
const Url = mongoose.model('Url', urlSchema);

function isValidUrl(url) {
  try {
    const urlObject = new URL(url);
    const hostname = urlObject.hostname;

    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (err) {
    return false;
  }
}


app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;

  const isValid = await isValidUrl(url);
  if (!isValid) {
    res.send({ error: 'invalid url' });
    return;
  }
  
  try {
    const newUrl = new Url({
      original_url: url,
      short_url: Math.floor(Math.random() * 10000)
    });
    await newUrl.save();
    res.status(201).json(newUrl);
  } catch (err) {
    res.send({ error: 'Internal server error' });
  }
});

app.get('/api/shorturl/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const url = await Url.findOne({ short_url: id });
    if (url) {
      res.redirect(url.original_url);
    } else {
      res.send({ error: 'Short url not found' });
    }
  } catch (err) {
    res.send({ error: 'Internal server error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

