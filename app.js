'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

app.set('port', (process.env.PORT || 5000));

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

// Route
app.get('/', function(req, res) {
    res.send('i am chatbot');
})

// Facebook
app.get('/webhook', function(req, res) {
    if (req.query['hub.verify_token'] === "ansontesting") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
});

app.listen(app.get('port'), function() {
    console.log("running: port")
})