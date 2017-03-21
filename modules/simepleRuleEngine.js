
var nlpModule = require('./nlpModules.js');
var current_status = "";
var simpleRuleEngine = function(){
	var that = {};

	that.ask = function(q,callback){

        nlpModule.spelling(q,function(question){
			nlpModule.luis(question,function(result){
				console.log(result);
				var intent = result["intent"];
				var score = result["score"];
				if (intent == "Card_Cancel") {
					callback("Sorry to hear that!");
				}else if (intent == "Card_Create") {
					callback("Great! Glad to help!");
				}else if (intent == "greetings") {
					callback("Great! Glad to help!");
				}
			});
        });

	}

	var init = function(){
	}

	init();
	return that;
}

module.exports = new simpleRuleEngine();