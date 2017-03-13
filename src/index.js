'use strict';
var Alexa = require("alexa-sdk");
var appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';
var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('names.json', 'utf8'));
var names = obj.names;
var alphabet = 'abcdefghijklmnopqrstuvwxyz';
var letter = '';

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'myDynamoDbNameTable';
    alexa.registerHandlers(newSessionHandlers, startGameHandlers, guessModeHandlers, solutionModeHandlers);
    alexa.execute();
};

 var states = {
     STARTMODE: '_STARTMODE',  // Prompt the user to start or restart the game.
     GUESSMODE: '_GUESSMODE', // Alexa is attempting to guess letters in the name.
     SOLUTIONMODE: '_SOLUTIONMODE' // Alexa has guessed the name.
 };

var newSessionHandlers = {
    'NewSession': function() {
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['gamesPlayed'] = 0;
        }
        this.handler.state = states.STARTMODE;
        this.emit(':ask', ' Hi ' + obj.user + '. Welcome to your friend name guessing game. Would you like to play?',
            'Say yes to start the game or no to quit.');
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', 'Goodbye ' + obj.user + '!');
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', 'Goodbye ' + obj.user + '!');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', 'Goodbye ' + obj.user + '!');
    },
    'Unhandled': function () {
        this.emit(':tell', 'you messed up!');
    }
};

var startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        var message = 'Think of the first name of one of your friends. I will try to guess that persons name by' +
            ' asking if the name contains a certain letter. Do you want to play the game?';
        this.emit(':ask', message, message);
    },
    'AMAZON.YesIntent': function() {
        this.handler.state = states.GUESSMODE;
        if ((this.attributes['gamesPlayed'] != 0) && (this.attributes['gamesPlayed'] % 5 == 0)) {
            this.emit(':ask', 'By the way, your dad is pretty awesome. Think of the first name of one of your friends. Are you ready?', 'Are you ready?');
        }
        else {
            this.emit(':ask', 'Think of the first name of one of your friends. Are you ready?', 'Are you ready?');
        }
    },
    'AMAZON.NoIntent': function() {
        this.emit(':tell', 'Ok, see you next time! Goodbye ' + obj.user + '!');
    },
    "AMAZON.StopIntent": function() {
        this.emit(':tell', 'Goodbye ' + obj.user + '!');
    },
    "AMAZON.CancelIntent": function() {
        this.emit(':tell', 'Goodbye ' + obj.user + '!');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', 'Goodbye ' + obj.user + '!');
    },
    'Unhandled': function() {
        var message = 'Say yes to keep playing, or no to end the game.';
        this.emit(':ask', message, message);
    }
});

var guessModeHandlers = Alexa.CreateStateHandler(states.GUESSMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'AMAZON.YesIntent': function() {
        if (letter != '') {
            names = names.filter(function(name) {
                return name.includes(letter);
            });
            //console.log('answer = yes');
            //console.log('letter = ' + letter);
            //console.log('names = ' + names);
        }
        if (names.length == 0) {
            this.handler.state = states.STARTMODE;
            this.attributes['gamesPlayed']++;
            alphabet = "abcdefghijklmnopqrstuvwxyz"; //reset the alphabet
            letter = '';
            names = obj.names; //reset the list of names
            this.emit(':ask', 'I\'ve run out of names to guess. We must have made a mistake. Lets start over. Would you like to play again?');
        }
        else if (names.length == 1) {
            this.handler.state = states.SOLUTIONMODE;
            this.emit(':ask', 'Is ' + names[0] + ' the name you were thinking of?');
        }
        else {
            var num = Math.floor(Math.random() * alphabet.length);
            letter = alphabet.charAt(num);
            alphabet = alphabet.slice(0, num) + alphabet.slice(num + 1);
            this.emit(':ask', 'Does the name have ' + letter + ' in it?', 'Does the name have ' + letter + ' in it?');
        }
    },
    'AMAZON.NoIntent': function() {
        if (letter == '') {
            this.emit(':tell', 'Ok, see you next time! Goodbye ' + obj.user + '!');
        }
        else {
            names = names.filter(function(name) {
                return !name.includes(letter);
            });
            //console.log('answer = no');
            //console.log('letter = ' + letter);
            //console.log('names = ' + names);
            if (names.length == 0) {
                this.handler.state = states.STARTMODE;
                this.attributes['gamesPlayed']++;
                alphabet = "abcdefghijklmnopqrstuvwxyz"; //reset the alphabet
                letter = '';
                names = obj.names; //reset the list of names
                this.emit(':ask', 'I\'ve run out of names to guess. We must have made a mistake. Lets start over. Would you like to play again?');
            }
            else if (names.length == 1) {
                this.handler.state = states.SOLUTIONMODE;
                this.emit(':ask', 'Is ' + names[0] + ' the name you were thinking of?');
            }
            else {
                var num = Math.floor(Math.random() * alphabet.length);
                letter = alphabet.charAt(num);
                alphabet = alphabet.slice(0, num) + alphabet.slice(num + 1);
                this.emit(':ask', 'Does the name have ' + letter + ' in it?', 'Does the name have ' + letter + ' in it?');
            }
        }
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I will try to figure out your friends name by guessing one letter at a time.',
        'Let me know if I am right.');
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', 'Goodbye' + obj.user + '!');
    },
    'AMAZON.CancelIntent': function() {
        console.log('CANCELINTENT');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', 'Goodbye' + obj.user + '!');
    },
    'Unhandled': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Let me know if my guess is correct.', 'Let me know if my guess is correct');
    }
 });

 var solutionModeHandlers = Alexa.CreateStateHandler(states.SOLUTIONMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'AMAZON.YesIntent': function() {
        this.handler.state = states.STARTMODE;
        this.attributes['gamesPlayed']++;
        alphabet = 'abcdefghijklmnopqrstuvwxyz'; //reset the alphabet
        letter = '';
        names = obj.names; //reset the list of names
        this.emit(':ask', 'Yay! That was fun. Would you like to play again?', 'Would you like to play again?');
    },
    'AMAZON.NoIntent': function() {
        this.handler.state = states.STARTMODE;
        this.attributes['gamesPlayed']++;
        alphabet = 'abcdefghijklmnopqrstuvwxyz'; //reset the alphabet
        letter = '';
        names = obj.names; //reset the list of names
        this.emit(':ask', 'I guessed wrong. Lets start over. Would you like to play again?', 'Would you like to play again?');
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'I will try to figure out your friends name by guessing one letter at a time.',
        'Let me know if I am right.');
    },
    'AMAZON.StopIntent': function() {
      this.emit(':tell', 'Goodbye' + obj.user + '!');
    },
    'AMAZON.CancelIntent': function() {
        console.log('CANCELINTENT');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', 'Goodbye' + obj.user + '!');
    },
    'Unhandled': function() {
        this.emit(':ask', 'Sorry, I didn\'t get that. Let me know if my guess is correct.', 'Let me know if my guess is correct');
    }
});
