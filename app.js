'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

let token = "EAACATjSv7U4BAPxQaFaUnT59ZCM87ddLsb3kOLbxIp8s7npPySrbcCHFQLzBbCxXR0GG3quA0UnrOK08SZCtxwf74Az0lg6OkrcCZAuKtacaZCqYyw0ZAIqVsVUeOS2fjFh2LTclBsr0TLRVLcRJFzTKfO3vV9eYwjsFKWwaI9QZDZD";

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
        let event = messaging_events[i]
        let sender = event.sender.id
        sendText(sender, "text echo")
        // if (event.message && event.message.text) {
        //     let text = event.message.text
        //     sendText(sender, "text echo" + text.substring(0, 100))
        // }
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