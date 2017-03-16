'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

var Q1 = false;
var Q2 = false;

let token = "EAADQZCNZCxtAgBADmnbPXCtFrZAKtUNHnugh9mLRHljfVZAa5BN4x9oie3HZBFsRHlkQeBCS3U63zToqnQ70teqw93lDzg56f5UijZC1SmcZBZCtrHdxMy2swXFPgStAUh8CKxZBT3qtJkNVhLxZAPKBQVDEM9UkWDAGANDHhIPSP4wgZDZD";

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
      case 'testing':
        sendTestingMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;



      case 'Hello':
      case 'hello':
      case 'Hey':
      case 'hey':
      case 'Hi':
      case 'hi':
        sendGreetingMessage(senderID);
      break;

      case 'Thank you':
      case 'thank you':
      case 'Thanks':
      case 'thanks':
        sendWelcomeMessage(senderID);
      break;

      case 'Bye':
      case 'bye':
      case 'See you':
      case 'see you':
        sendByeMessage(senderID);
      break;

      case 'shopping':
      case 'Shopping':
      case 'shop':
      case 'Shop':
      case 'Dining':
      case 'Entertainment':
        Q1 = true;
        sendShoppingMessage(senderID);
        break;
        
      case 'Cosmetics':
      case 'cosmetics':
      case 'makeup':
      case 'facial cream':
      case 'beauty':
        if (Q1) {
          Q2 = true;
          sendShopMessage(senderID);
          setTimeout(function(){
            sendTextMessage(senderID, "What product you are searching?");
          }, 100);
        } else {
          sendShoppingMessage(senderID);
        }
        break;

      case 'where':
        getLocationMessage(senderID);
        break;
      case 'how':
        sendLocationMessage(senderID);
        break;



      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
    console.log(message);
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
  console.log('Q2: ' + Q2);
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


////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
var mall_option = [
        {
          "content_type":"text",
          "title":"Dining",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/mall/dining.png"
        },
        {
          "content_type":"text",
          "title":"Shopping",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/mall/shopping.png"
        },
        {
          "content_type":"text",
          "title":"Entertainment",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/mall/entertainment.png"
        }
      ];
var shop_options = [
        {
          "content_type":"text",
          "title":"Cosmetics",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/shop/cosmetics.png"
        },
        {
          "content_type":"text",
          "title":"Shoes",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/shop/shoe.png"
        },
        {
          "content_type":"text",
          "title":"Clothes",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/shop/clothing.png"
        }
      ];

function sendShoppingMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Which kind of shop you are searching?",
      "quick_replies":shop_options
    }
  };  

  callSendAPI(messageData);
}

function sendGreetingMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Welcome to Hysan Place! :) \u000AWhat are you looking for today?",
      "quick_replies":mall_option
    }
  };  

  callSendAPI(messageData);
}

function sendWelcomeMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"You're welcome! :) \u000AAnything else are you looking for?",
      "quick_replies":shop_options
    }
  };  

  callSendAPI(messageData);
}
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "attachment":{
        "type":"video",
        "payload":{
          "url":"https://anson-messenger.herokuapp.com/video/leegardens.mp4"
        }
      }
    }
  };  

  callSendAPI(messageData);
}

function sendByeMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"We hope to see you soon! :) To know more about us, watch this clip!"
    }
  };  

  callSendAPI(messageData);
  sendVideoMessage(recipientId);
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
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/bodyshop.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85229150962"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Fancl",
            subtitle: "Leading the evolution in PRESERVATIVE-FREE BEAUTY",
            item_url: "www.fancl-hk.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/fancl.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85236220780"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Inisfree",
            subtitle: "Korea No.1 natural brand",
            item_url: "http://www.innisfree.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/inisfree.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85234285640"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Lush",
            subtitle: "natural handmade bath and body products",
            item_url: "https://hk.lush.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/lush.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228380060"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Shiseido",
            subtitle: "highest quality products in brightening and anti-aging skincare, makeup and fragrance ",
            item_url: "https://www.shiseido.com.hk",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/shiseido.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228334563"
            },{
              "type":"element_share"
            }]
          }, {
            title: "YSL",
            subtitle: "French luxury fashion house",
            item_url: "www.ysl.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/ysl.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228318484"
            },{
              "type":"element_share"
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}


function getLocationMessage(recipientId) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Please share your location:",
      "quick_replies":[
        {
          "content_type":"location",
        }
      ]
    }
  };

  callSendAPI(messageData);
}
function sendLocationMessage(recipientId) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": {
            "element": {
              "title": "Hysan Place",
              "subtitle": "Causeway Bay",
              "image_url": "https://anson-messenger.herokuapp.com/img/map.jpg",
              "item_url": "https://www.google.com.hk/maps/place/Hysan+Place/@22.279764,114.1815696,17z/data=!3m1!5s0x34040056c77437e9:0x571df46027613945!4m8!1m2!2m1!1shysan+place!3m4!1s0x34040056c37d08bb:0xe2b51a38d4d91669!8m2!3d22.2797509!4d114.183808"
            }
          }
        }
      }
    }
  };

  callSendAPI(messageData);
}

////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////







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