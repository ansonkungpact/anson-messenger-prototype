var constant = require('./constant.js');
var request = require('request');

var nlpModule = function() {

	var that = {};
	var luisURL = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/08939128-978d-408d-9c01-0f791c357d69?subscription-key=11fed51d7ec04c6bac9d1c0e60a0e9c5&verbose=true&q="
    var translatorURL = "https://api.microsofttranslator.com/v2/http.svc/Translate?to=en&category=generalnn"
	
	that.spelling = function(q,callback){
		//TO DO
		callback(q);
		
	}

	that.luis = function(q,callback){
		luisURL += q;
		console.log(luisURL);
		var opt = {
         url:luisURL,
         method:'GET',
        }
 		request(opt, function (err, response, body) {
 			console.log(body);
 			var result = JSON.parse(body);
 			var intents = result["intents"];
 			callback(intents[0]);
 		});

	}


	that.translator = function(q,callback){
		//TO DO


	}
	return that;


}

module.exports = new nlpModule();