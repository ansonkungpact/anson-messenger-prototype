'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();

var fs = require('fs');
var moment = require('moment');
var ExpressWaf = require('express-waf');

const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
var Client = require('node-rest-client').Client;

var Q1 = false;
var Q2 = false;
var watch             = false;
var reserve_watch     = false;
var other_restaurant  = false;

let token = "EAADQZCNZCxtAgBADmnbPXCtFrZAKtUNHnugh9mLRHljfVZAa5BN4x9oie3HZBFsRHlkQeBCS3U63zToqnQ70teqw93lDzg56f5UijZC1SmcZBZCtrHdxMy2swXFPgStAUh8CKxZBT3qtJkNVhLxZAPKBQVDEM9UkWDAGANDHhIPSP4wgZDZD";

const server = express()

  // Allows us to process the data
  .use(bodyParser.urlencoded({extended: false}))
  .use(bodyParser.json())

  // Route
  .use(express.static('public'))
  .get('/', function(req, res) {
    res.send(path.join(__dirname, '/public'));
  })

  // Facebook
  .get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === "ansontesting") {
      res.send(req.query['hub.challenge'])
    }
    res.send("Wrong token")
  })

  .post('/webhook', function (req, res) {
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
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));


function receivedMessage(event) {
  console.log(event.sender);
  console.log(event.recipient);
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageIntent;
  console.log(messageIntent);
  // console.log('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/08939128-978d-408d-9c01-0f791c357d69?subscription-key=11fed51d7ec04c6bac9d1c0e60a0e9c5&verbose=true&q=');
  // console.log(messageText);
  var client = new Client();

  console.log('--------ansonv3--------');
  client.get("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/34b2c94b-f326-4396-bddc-9f13a9524c69?subscription-key=11fed51d7ec04c6bac9d1c0e60a0e9c5&verbose=true&q=" + messageText, function (data, response) {
    // parsed response body as js object 
    messageIntent = data.topScoringIntent.intent;
    if (data.entities[0] != null) {
      var entityType = data.entities[0].type;
      console.log(entityType);
    }
    // raw response 
    // console.log(response);

    var messageAttachments = message.attachments;
    console.log('---------------------testing--------------------');
    console.log(message);
    console.log('---------------------testing--------------------');

    if (messageText) {

      // If we receive a text message, check to see if it matches a keyword
      // and send back the example. Otherwise, just echo the text we received.
      switch (messageIntent) {
        case 'testing':
          sendTestingMessage(senderID);
          break;

        case 'generic':
          sendGenericMessage(senderID);
          break;

        case 'greetings':
          sendGreetingMessage(senderID);
        break;

        case 'thanks':
        case 'bye':
          sendByeMessage(senderID);
          Q1 = false;
          Q2 = false;
        break;

        case 'shopping':
        case 'entertainment':
          Q1 = true;
          sendShoppingMessage(senderID);
          break;

        case 'dining':
            sendFoodMessage(senderID);
          break;

        case 'food':
            sendRestaurantMessage(senderID);
            setTimeout(function(){
              sendTextMessage(senderID, "Sure, here is the list of western restaurants in Hysan Place. \u000A \u000AThere are additional western restaurants in the nearby Lee Gardens. Would you like to see them?");
            }, 1000);
            other_restaurant = true;
          break;

        case 'transportation':
          getLocationMessage(senderID);
          break;
        case 'location':
          sendLocationMessage(senderID);
          break;



        default:
        console.log('-----------------others----------------');
        console.log(other_restaurant);
        console.log('-----------------others----------------');
        if (messageText == 'tag watch') {
          sendShopMessage(senderID);

        } else if (other_restaurant) {
          if (entityType == 'positiveFeedback') {
            sendRestaurantMessage2(senderID);
            setTimeout(function(){
              sendAnythingElseMessage(senderID);
            }, 1000);
          }
          other_restaurant = false;

        } else if (reserve_watch) {
          if (entityType == 'positiveFeedback') {
            sendTextMessage(senderID, "Great! The watch will be held for 48 hours.");
            setTimeout(function(){
              sendAnythingElseMessage(senderID);
            }, 1000);
          }
          reserve_watch = false;

        } else if (watch) {
          if (entityType == 'positiveFeedback') {
            sendShopMessage(senderID);
            setTimeout(function(){
              sendTextMessage(senderID, "Thank you. Here are the stores featuring the Tag Heuer Carrera watches.");
            }, 1000);
          }
          watch = false;

        } else {
          sendTextMessage(senderID, "I'm sorry, but I didn't understand your answer.");
        }
      }
    } else if (messageAttachments) {
      if (messageAttachments[0].payload.coordinates) {
        var lat = messageAttachments[0].payload.coordinates.lat;
        var long = messageAttachments[0].payload.coordinates.long;
        sendDirectionMessage(senderID, lat, long, "We are at 500 Hennessy Rd, Causeway Bay");
        // sendTextMessage(senderID, "We are at 500 Hennessy Rd, Causeway Bay");
      } else {   
        sendTextMessage(senderID, "Thank you for the picture! I see that it's the Tag Heuer Carrera watch, right? ;)");
        watch = true;
      }
      // console.log(message.attachments.delivery);
    }
  });
  console.log('--------ansonv3--------');
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
  sendTextMessage(senderID, "There is currently a promotion for 15% off for spendings over HKD 500 from 1-Mar to 31-Mar! \u000A \u000AWould you like to reserve this Tag Heuer model for you?");
  reserve_watch = true;
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
          "title":"Fashion",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/shop/fashion.png"
        },
        {
          "content_type":"text",
          "title":"Jewelry",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/shop/jewelry.png"
        },
        {
          "content_type":"text",
          "title":"Lifestyle",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/shop/lifestyle.png"
        }
      ];

var food_options = [
        {
          "content_type":"text",
          "title":"Dim sum",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/food/dimsum.png"
        },
        {
          "content_type":"text",
          "title":"Fast food",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/food/fastfood.png"
        },
        {
          "content_type":"text",
          "title":"Hotpot",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/food/hotpot.png"
        },
        {
          "content_type":"text",
          "title":"Spaghetti",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/food/spagetti.png"
        },
        {
          "content_type":"text",
          "title":"Sushi",
          "payload":"",
          "image_url":"https://anson-messenger.herokuapp.com/img/icon/food/sushi.png"
        }
      ];



function sendFoodMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Which kind of food you want to have?",
      "quick_replies":food_options
    }
  };  

  callSendAPI(messageData);
}

function sendShoppingMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Sure! What type of store are you looking for?",
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
      "text":"Hello! How can I help you today? :)",
      // "quick_replies":mall_option
    }
  };  

  callSendAPI(messageData);
  sendVideoMessage(recipientId);
}

function sendAnythingElseMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "text":"Anything else are you looking for?",
      "quick_replies":mall_option
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
      "text":"You're welcome! :) \u000AWe hope to see you soon! :)"
    }
  };  

  callSendAPI(messageData);
  // setTimeout(function(){
  //   sendTextMessage(recipientId, "To know more about us, watch this clip!");
  // }, 1000);
}

function sendRestaurantMessage(recipientId) {
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
            title: "EIGHT GRAND Bar & Restaurant",
            subtitle: "EIGHT GRAND brings exciting touches in food and beverages as well as ambience.\u000AMon-Sun 1130-2230\u000AHysan Place, Shop 1203",
            item_url: "https://hp.leegardens.com.hk/?lang=en-US#!/dining-details/hysanplace/dining/Items/Eight-Grand-Bar-Restaurant",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/eightgrand.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85235688621"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Shelter Italian Bar & Restaurant",
            subtitle: "The gastronomic sanctuary specializes in Italian food\u000AMon-Sun 1130-0030\u000AHysan Place, Shop 718",
            item_url: "http://www.shelterhk.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/shelteritalian.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85227788398"
            },{
              "type":"element_share"
            }]
          }, {
            title: "caffè HABITŪ the table",
            subtitle: "The unveiling of caffè HABITŪ the table brings exciting touches in food and beverages as well as ambience.\u000AMon-Sun 1130-2230\u000AHysan Place, Shop 803",
            item_url: "www.caffehabitu.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/habitu.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85235431313"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Green Waffle Diner",
            subtitle: "everyday food for everyday people\u000AMon-Sun 1130-0030\u000AHysan Place, Shop 1303",
            item_url: "https://www.facebook.com/Green-Waffle-Diner-127660523917542/",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/greenwaffle.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85228805123"
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



function sendRestaurantMessage2(recipientId) {
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
            title: "Passion by Gérard Dubois",
            subtitle: "traditional French café experience\u000AMon-Sun 1130-2230\u000ALeee Gardens One, Shop G12",
            item_url: "www.PassionbyGD.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/passion.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85225291311"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Panino Giusto",
            subtitle: "The gastronomic sanctuary specializes in Italian food\u000AMon-Sun 1030-2230\u000ALeee Gardens One, Shop 204",
            item_url: "www.paninogiusto.com.hk",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/paninogiusto.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85225270222"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Seasons by Olivier E.",
            subtitle: "French contemporary dining\u000AMon-Sun 1230-2230\u000ALeee Gardens Two Shop 1311",
            item_url: "www.seasonsbyolivier.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/seasons.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85225056228"
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
            title: "TAG Heuer Boutique",
            subtitle: "All about watch.\u000AHysan Place, Shop 1202\u000AMon-Sun 1000-2200",
            item_url: "http://tagheuer.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/tag.jpg",
            buttons: [
            {
              "type":"postback",
              "title":"Check Promotion",
              "payload":"DEVELOPER_DEFINED_PAYLOAD"
            },{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85227509262"
            },{
              "type":"element_share"
            }]
          }, {
            title: "City Chain Glam Timepieces",
            subtitle: "All about watch.\u000AHysan Place, Shop 0221\u000AMon-Sun 1100-2300",
            item_url: "http://www.citychain.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/citychain.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85223750876"
            },{
              "type":"element_share"
            }]
          }, {
            title: "Prince Jewellery & Watch",
            subtitle: "Luxury watch and jewellery collections. \u000AHysan Place, Shop 0503\u000AMon-Sun 0930 - 2130",
            item_url: "www.princejewellerywatch.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/prince.png",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85227392333"
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
              "item_url": "https://www.google.com.hk/maps/place/Hysan+Place/"
            }
          }
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendDirectionMessage(recipientId, x, y) {

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"We are at 500 Hennessy Rd, Causeway Bay, Let me show you: ",
          "buttons":[
            {
              "type":"web_url",
              "url":"https://www.google.com.hk/maps/dir/'"+x+","+y+"'/Hysan+Place/",
              "title":"Google Map"
            }
          ]
        }
      }
    }
  };

  // var messageData = {
  //   recipient: {
  //     id: recipientId
  //   },
  //   message: {
  //     "attachment": {
  //       "type": "template",
  //       "payload": {
  //         "template_type": "generic",
  //         "elements": {
  //           "element": {
  //             "title": "Hysan Place",
  //             "subtitle": "Causeway Bay",
  //             "image_url": "https://anson-messenger.herokuapp.com/img/map.jpg",
  //             "item_url": "https://www.google.com.hk/maps/dir/Hysan+Place/'"+x+","+y+"'/"
  //           }
  //         }
  //       }
  //     }
  //   }
  // };

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