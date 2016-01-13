var alexa = require('alexa-app');
var https = require('https');
var querystring = require("querystring");
var randomString = require('random-string');
var words2numbers = require('./words2numbers.js');

// Setup the App
var app = new alexa.app('app');

function getUserData(req) {
	try {
		return req.data.user_data;
	}
	catch(e) { return null; }
}

function setUserData(res,json) {
	res.response.user_data = json;
}

function validate_user(req,res) {
	var user = getUserData(req);
	// User has never hit the app before, generate a code for them and tell them what to do
	if (!user || (user && !user.code)) {
		// No user data exists, so generate a random character and persist to the db
		var rand = randomString({length:4,numeric:false,letters:true,special:false}).toLowerCase();
		user = {"code":rand};
		// Insert spaces into the random code so the Echo pronounces it correctly
		res.card("EchoTTT","Your code is "+rand+". Go to http://EchoTTT.com to link your IFTTT account using this code");
		res.say("Hi, I'm waldo. Visit echo t t t dot com to get started. Your code is: "+(rand.replace(/(.)/g,"$1. "))+". You can ask waldo to repeat your code if you need to hear it again. The web site and code have been sent to a card in your Echo app." );
		// Set the user record in the response so it gets persisted
		setUserData(res,user);
		return false;
	}
	if (user.code && !user.key) {
		var code = user.code;
		res.card("EchoTTT","Your code is "+code+". Go to http://EchoTTT.com to link your IFTTT account using this code");
		res.say("Go to echo t t t dot com to get started. Your code is: "+code.replace(/(.)/g,"$1. "));
		return false;
	}
	return user;
}

app.launch(function(req,res) {
	var user = validate_user(req,res);
	if (user) {
		res.say("You are already connected. Setup your actions at i f t t t dot com and then say alexa, ask waldo to do something.");
	}
});

app.intent('requestIntent', {
		"slots":{"request":"LITERAL"}
		,"utterances":[ "{do something|request}" ]
	},
	function(req,res) {
		var request = req.slot('request');
		var debug = "Waldo heard: ["+request+"].\n";

		if (request=="forget me" || request=="start over") {
			res.say("Okay, I have unlinked your i f t t t account. Please say Launch Waldo to start over");
			return;
		}
		if (request=="repeat my code" || request=="tell me my code" || request=="say my code") {
			var user = validate_user(req,res);
			if (user) {
				var code = user.code;
				res.card("EchoTTT","Your code is "+code+".");
				code = code.replace(/(.)/g,"$1. ");
				res.say("Your code is: "+code+". It has also been sent to a card in your Echo app.");
				return;
			}
			else {
				res.say("Sorry, I can't find a code for you. Try saying alexa, open waldo.");
				return;
			}
		}
		if (request=="enable debug mode" || request=="enable debugging" || request=="enable the bugging" || request=="enabling debugging" || request=="turn on debugging") {
			res.say("Debug mode enabled. Debug information will be sent to your echo app in cards.");
			setUserData(res,{debug:true});
			return;
		}
		if (request=="disable debug mode" || request=="disable debugging" || request=="disable the bugging" || request=="disabling debugging" || request=="turn off debugging") {
			res.say("Debug mode disabled.");
			setUserData(res,{debug:false});
			return;
		}
		
		// Load up the user's config
		var user = validate_user(req,res);
		// If they don't exist or haven't entered their secret code, the response is already handled and we can exit
		if (!user) {
			return;
		}
		
		// User has already connected their IFTTT account, we can continue...
		var verb, detail;
		if (request.match(/(.*) and (set to|say|post|write|enter|add) (.*)/)) {
			request = RegExp.$1;
			verb = RegExp.$2;
			detail = RegExp.$3;
			debug += "Event Name: ["+request+"], Verb: ["+verb+"], Detail: ["+detail+"].\n";
		}
		else if (request.match(/(set .*) to (.*)/)) {
			request = RegExp.$1;
			detail = RegExp.$2;
			debug += "Event Name: ["+request+"], Detail: ["+detail+"].\n";
		}
		// Make sure the event name is lowercase
		request = request.toLowerCase();
		
		var url = 'https://maker.ifttt.com/trigger/' + querystring.escape(request) + '/with/key/'+user.key;
		if (detail) {
			// If the detail has numbers written as words, convert to digits
			detail = words2numbers(detail);
			url += "?value1="+querystring.escape(detail);
		}
		debug += "Generated url: ["+url+"].\n";
		https.get(url, function(response) {
            response.on('data', function(chunk) {} );
            response.on('end', function() {
				var cardMsg = "Event ["+request+"] triggered with Value1 of ["+detail+"]";
				if (user && user.debug) {
					cardMsg += "\n[DEBUG]\n"+debug;
				}
				res.card("EchoTTT",cardMsg);
                res.say("OK, I will "+request).send();
            });
		}).on('error', function(e) { 
			res.card("EchoTTT Error","There was an error. "+e.message+".\n"+ (user && user.debug)?debug:"");
			res.say("There was an error. "+e).send(); 
		})
		return false;
	}
);

// Export the app to the caller
module.exports = app;
module.change_code = 1;
