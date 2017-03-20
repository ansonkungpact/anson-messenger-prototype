var express = require('express');
var app = express();
var http = require('http').Server(app);
// var io = require('socket.io')(http);
var fs = require('fs');
var moment = require('moment');

var preAuth = require('http-auth');
var basic = preAuth.basic({
  realm: "Restricted Access! Please login to proceed"
  }, function (username, password, callback) { 
    callback( (username === "pactera" && password === "PACTERADEMO"));
  }
);

var ExpressWaf = require('express-waf');
var bodyParser = require('body-parser');

'use strict';

const socketIO = require('socket.io');
const path = require('path');

var Q1 = false;
var Q2 = false;
var watch = false;

var token = "EAADQZCNZCxtAgBADmnbPXCtFrZAKtUNHnugh9mLRHljfVZAa5BN4x9oie3HZBFsRHlkQeBCS3U63zToqnQ70teqw93lDzg56f5UijZC1SmcZBZCtrHdxMy2swXFPgStAUh8CKxZBT3qtJkNVhLxZAPKBQVDEM9UkWDAGANDHhIPSP4wgZDZD";

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, '/public/clientchat/index-clientchat.html');


const server = express()
  .use(express.static('public/app/'))
  .get('/', function(req, res){
     res.sendFile(INDEXB);
  })
  .use(express.static('public'))
  .get('/chatbot', function(req, res){
     res.sendFile(INDEX);
  })

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
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

var moduleName = 'INDEX';
var isLog = false;
var logHistory = {};
var platformValue = {};
var lastSocketEventTimestamps = {};
var userComments = {};
var userScore = {};

var isDevelopmentMode = false;

var calculatorModules = {};


const QUESTIONS = {
  "START_GREETING": [
    "Greetings!"
  ],
  "START_QUESTION": [
    "Hello, How can I help you today?"
  ]
}

const MOST_SIGNIFICANT_CARRIER_RULES = "most significant carrier rules";

const NO_OF_EVENTS_PER_SEOCOND_TO_DISCONNECT = 5; // treat as bot attack and disconnect

var getQuestion = function(questionKey,socket,channel) {
        
    currentQuestion = questionKey;

  var question = getRandomQuest(questionKey);
  socket.emit(channel, 'SERVER', question,false);
  
}

var getRandomQuest = function(questionKey) {
  var question = questionKey;

  var questions = QUESTIONS[questionKey];

  if (questions) {
    question = questions[Math.floor(Math.random() * questions.length)];
  }
  return question;
}

var setWaf = function() {
  var emudb = new ExpressWaf.EmulatedDB();
  var waf = new ExpressWaf.ExpressWaf({
      blocker:{
          db: emudb,
          blockTime: 1000
      },
      log: true
  });

  //add modules to the firewall
  //name and configuration for the specific module have to be set
  waf.addModule('xss-module', {}, function(error) {
      console.log(error);
  });

  waf.addModule('lfi-module', {appInstance: app, publicPath: "./public"}, function(error) {
      console.log(error);
  });

  waf.addModule('sql-module', {}, function(error) {
      console.log(error);
  });

  waf.addModule('csrf-module', {
      allowedMethods:['GET', 'POST'],
      refererIndependentUrls: ['/']
  }, function (error) {
      console.log(error);
  });

  //body parser is necessary for some modules
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
      extended: true
  }));

  //add the configured firewall to your express environment
  app.use(waf.check);
}

var setFBChatBotApp = function() {
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
}

var setFWDApp = function() {
  app.use(express.static('public/app/'));

  app.get('/', function(req, res){
     res.sendFile(__dirname + '/public/app/login.html');
  });

}

var setSocketIo = function() {
  var isBotAttackDetected = function(socket) {
    var now = moment().format('x');

    var timestamps = lastSocketEventTimestamps[socket.id];

    timestamps.push(now);

    if (timestamps.length < NO_OF_EVENTS_PER_SEOCOND_TO_DISCONNECT) {
      return false;
    }

    if (timestamps[timestamps.length-1] - timestamps[0] < 1000) {
      console.log('bot attack detected! Disconnecting ' + socket.id);
      socket.disconnect();
      return true;
    }

    timestamps.shift();
    return false;
  };

  io.sockets.on('connection', function(socket){
    var platform;
    var url = socket.handshake.headers.referer;
    if (url && url.indexOf("platform=")>=0) {
            var platformAry = url.split("platform=");
            platform = platformAry[1];
    }

    if(platform == 'android' || platform == 'ios'){
      platformValue[socket.id] = "MOBILE("+platform+")";
    }else{
      platformValue[socket.id] = "WEB";
    }

    calculatorModules[socket.id] = require('./modules/calculatorModule.js')();
    calculatorModules[socket.id].setDevelopmentMode(isDevelopmentMode);
    logHistory[socket.id] = [];
    lastSocketEventTimestamps[socket.id] = [];
    userComments[socket.id] = '';
    userScore[socket.id] = '';
    
    console.log('Active connections: ' + Object.keys(calculatorModules).length);

    socket.on('test', function() {
      if (isBotAttackDetected(socket))
        return;

      //console.log('test');
    });

    socket.on('disconnect', function() {
      console.log('Disconnection: ' + socket.id);

      delete calculatorModules[socket.id];

      console.log('Active connections: ' + Object.keys(calculatorModules).length);
    })

    socket.on('adduser', function(){
      if (isBotAttackDetected(socket))
        return;

      if (isDevelopmentMode) {
        socket.emit('updatechat', 'SERVER', 'DEVELOPMENT MODE',false);
      }

      var mscLinkContent = '';
        
      //getQuestion("START_GREETING",socket,'updatechat');
      getQuestion("START_QUESTION",socket,'updatechat');


    });

    socket.on('sendchat', function (data,widgetType,widgetData) {
      if (isBotAttackDetected(socket))
        return;

      global_socket = socket;
      
      if(widgetType == null){
        data = data.replace(/<[^>]+>/g, "");
      }     
        socket.emit('updatechat_user', "user", data);
      

      if (calculatorModules[socket.id]) {
        calculatorModules[socket.id].askChatBot(data,platformValue[socket.id],widgetType,widgetData, function(answer, delay) { 
          var data = answer;
          socket.emit('updatechat', "vera", data,false,delay);

        });
      }
      
    });

  });

}

if (process.argv[2] == "-d") {
  isDevelopmentMode = true;
}
setWaf();
setSocketIo();
setFBChatBotApp();

// app.set('port', (process.env.PORT || 5000));

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
      case 'thankyou':
      case 'Thanks':
      case 'thanks':
        sendAnythingElseMessage(senderID);
      break;

      case 'no':
      case 'No':
      case 'nah':
      case 'Nah':
      case 'Bye':
      case 'bye':
      case 'See you':
      case 'see you':
        sendByeMessage(senderID);
        Q1 = false;
        Q2 = false;
      break;

      case 'shopping':
      case 'Shopping':
      case 'shop':
      case 'Shop':
      case 'Entertainment':
        Q1 = true;
        sendShoppingMessage(senderID);
        break;
        
      // case 'Cosmetics':
      // case 'cosmetics':
      // case 'makeup':
      // case 'facial cream':
      // case 'beauty':
      //   if (Q1) {
      //     Q2 = true;
      //     sendTextMessage(senderID, "Here is the list of cosmetics shops.");
      //     sendShopMessage(senderID);
      //     setTimeout(function(){
      //       sendTextMessage(senderID, "What product you are searching?");
      //     }, 1000);
      //   } else {
      //     sendGreetingMessage(senderID);
      //   }
      //   break;


      case 'Dining':
      case 'dining':
      case 'dinning':
          sendFoodMessage(senderID);
        break;

      case 'Dim sum':
      case 'dim sum':
      case 'dimsum':
      case 'Fast food':
      case 'fast food':
      case 'fastfood':
      case 'Hotpot':
      case 'hotpot':
      case 'Spagetti':
      case 'spagetti':
      case 'Sushi':
      case 'sushi':
          sendRestaurantMessage(senderID);
        break;

      case 'how': 
      case 'how to get there?': 
      case 'how to go Hysan Place?': 
      case 'how to go hysan place?': 
        getLocationMessage(senderID);
        break;
      case 'where':
      case 'where is it?':
      case 'where is hysan place?':
      case 'where is Hysan Place?':
        sendLocationMessage(senderID);
        break;



      default:
      if (messageText == 'tag watch') {
        sendShopMessage(senderID);

      } else if (watch) {
        if ((messageText == 'yes' || messageText == 'Yes') && watch) {
          sendShopMessage(senderID);
          setTimeout(function(){
            sendTextMessage(senderID, "Thank you. Here are the stores featuring the Tag Heuer Carrera watches.");
          }, 1000);
        }
      } else {
        // sendTextMessage(senderID, messageText);
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
          "title":"Spagetti",
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
      "quick_replies":mall_option
    }
  };  

  callSendAPI(messageData);
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
      "text":"You're welcome! :) \u000AWe hope to see you soon! :)  \u000ATo know more about us, watch this clip!"
    }
  };  

  callSendAPI(messageData);
  sendVideoMessage(recipientId);
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
            title: "Mcdonald",
            subtitle: "American hamburger and fast food restaurant chain\u000AShop 15",
            item_url: "http://www.mcdonalds.com.hk",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/mcdonald.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85223382338"
            },{
              "type":"element_share"
            }]
          }, {
            title: "KFC",
            subtitle: "Kentucky Fried Chicken\u000AShop 32",
            item_url: "https://www.kfchk.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/restaurant_img/kfc.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85227303730"
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
            subtitle: "All about watch.\u000AShop 22\u000Amon-sun 10a.m. - 10p.m.",
            item_url: "http://tagheuer.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/tag.jpg",
            buttons: [{
              type:"phone_number",
              title:"Call the shop",
              payload:"+85227509262"
            },{
              "type":"element_share"
            }]
          }, {
            title: "City Chain Glam Timepieces",
            subtitle: "All about watch.\u000AShop 22\u000Amon-sun 11a.m. - 11p.m.",
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
            subtitle: "Luxury watch and jewellery collections. \u000AShop 53\u000Amon-sun 9a.m. - 9p.m.",
            item_url: "www.princejewellerywatch.com",               
            image_url: "https://anson-messenger.herokuapp.com/img/shop_img/prince.jpg",
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

// app.listen(app.get('port'), function() {
//     console.log("running: port")
// })