'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

var Q1 = false;

let token = "EAACATjSv7U4BAPxQaFaUnT59ZCM87ddLsb3kOLbxIp8s7npPySrbcCHFQLzBbCxXR0GG3quA0UnrOK08SZCtxwf74Az0lg6OkrcCZAuKtacaZCqYyw0ZAIqVsVUeOS2fjFh2LTclBsr0TLRVLcRJFzTKfO3vV9eYwjsFKWwaI9QZDZD";

app.set('port', (process.env.PORT || 5000));

// Allows us to process the data
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());

// Route
app.use(express.static('public'))
app.get('/', function(req, res) {
    res.send(path.join(__dirname, '/public'));
})

// Facebook
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "ansontesting") {
        res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'cosmetics':
      case 'makeup':
      case 'facial cream':
        Q1 = true;
      case 'testing':
        sendTestingMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'shop':
        sendShopMessage(senderID);
        break;

      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

function sendTextMessage(recipientId, messageText) {
  console.log('Q1: ' + Q1);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendTestingMessage(recipientId) {
  var messageData = {
    recipient: {
        id: recipientId
    },
    "message":{
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":"What do you want to do next?",
                "buttons":[
                    {
                        "type":"web_url",
                        "url":"https://petersapparel.parseapp.com",
                        "title":"Show Website"
                    },
                    {
                        "type":"postback",
                        "title":"Start Chatting",
                        "payload": "Start Chatting"
                    }
                ]
            }
        }
    }
  };  

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type:"phone_number",
              title:"Call Representative",
              payload:"+15105551234"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendShopMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "The Body Shop",
            subtitle: "The original, ethical and natural beaty bran",
            item_url: "http://www.thebodyshop.com.hk",               
            image_url: "https://anson-messenger.herokuapp.com/shop_img/bodyshop.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85229150962"
            }]
          }, {
            title: "Fancl",
            subtitle: "Leading the evolution in PRESERVATIVE-FREE BEAUTY",
            item_url: "www.fancl-hk.com",               
            image_url: "https://anson-messenger.herokuapp.com/shop_img/fancl.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85236220780"
            }]
          }, {
            title: "Inisfree",
            subtitle: "Korea No.1 natural brand",
            item_url: "http://www.innisfree.com",               
            image_url: "https://anson-messenger.herokuapp.com/shop_img/inisfree.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85234285640"
            }]
          }, {
            title: "Lush",
            subtitle: "natural handmade bath and body products",
            item_url: "https://hk.lush.com",               
            image_url: "https://anson-messenger.herokuapp.com/shop_img/lush.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228380060"
            }]
          }, {
            title: "Shiseido",
            subtitle: "highest quality products in brightening and anti-aging skincare, makeup and fragrance ",
            item_url: "https://www.shiseido.com.hk",               
            image_url: "https://anson-messenger.herokuapp.com/shop_img/shiseido.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228334563"
            }]
          }, {
            title: "YSL",
            subtitle: "French luxury fashion house",
            item_url: "www.ysl.com",               
            image_url: "https://anson-messenger.herokuapp.com/shop_img/ysl.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228318484"
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

app.listen(app.get('port'), function() {
    console.log("running: port")
})