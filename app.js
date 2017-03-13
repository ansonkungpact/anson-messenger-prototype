'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

let token = "EAAaQmdrMnZBoBABYGKQFBzhK4Jdk5C0Luob4QJrvODUyDIuysn8D82WudaX9hXsdZCyNiFEVOptk6OHErOoKmrSezzf04C4IhUlpZANKYlR4yReb23UyxLriq9D2YsQyFYRlf8QPPYhPtw5SBMnakTtqsYwkxZBkxYbXZAFwxFQZDZD";

app.set('port', (process.env.PORT || 5000));

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

// Route
app.get('/', function(req, res) {
    res.send('i am chatbot');
})

// Facebook
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "ansontesting") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
});

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_event[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            sendText(sender, "text echo" + text.substring(0, 100))
        }
    }
    res.sendStatus(200)
})

function sendText(sender, text) {
    let messageData = {text: text}
    request({
        url: "http://graph.facebook.com/v2.8/me/messages",
        qs : {access_token: token},
        method: "POST",
        json: {
            recipient: {id: sender},
            message: messageData
        }, function(error, response, body) {
            if (error) {
                console.log("sending error")
            } else if (response.body.error) {
                console.log("response body error")
            }
        }
    })
}
app.listen(app.get('port'), function() {
    console.log("running: port")
})