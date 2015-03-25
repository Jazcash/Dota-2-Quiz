var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var dotadata = JSON.parse(fs.readFileSync(__dirname + '/DOTA DATA/heroes.json'));
var questions = [abilityMana, abilityOwner];

var numberOfChoices = 4;

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.htm');
});

io.on('connection', function(socket){
	console.log('a user connected');

	var question;

	socket.on('questionRequest', function(){
		question = getRandomQuestion();
		socket.emit('question', {'question': question.question, 'choices': question.choices});
	});

	socket.on('answer', function(answerIndex){
		if (parseInt(answerIndex) == question.answerIndex){
			socket.emit('answerStatus', true);
		} else {
			socket.emit('answerStatus', false);
		}
	});

	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

function getRandomQuestion(){
	return questions[Math.floor(Math.random() * questions.length)]();
}

function getRandomHero(){
	return dotadata[Math.floor((Math.random() * dotadata.length))];
}

function getRandomAbility(hero){
	return hero.Abilities[Math.floor((Math.random() * hero.Abilities.length))];
}

function getSimilarValues(value, amount, round){
	var round = round || 10;

	var similarValues = [value];
	
	for (var i=1; i<amount; i++){
		var newValue = value + (i * round);
		similarValues.push(newValue);
		if (similarValues.length === amount) break;
		newValue = value - (i * round);
		if (newValue > -1) similarValues.push(newValue);
		if (similarValues.length === amount) break;
	}

	return shuffle(similarValues);
}

function nearestMultiple(value, multiple) {
    return Math.ceil(value / multiple) * multiple;
}

// http://dzone.com/snippets/array-shuffle-javascript
function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

String.prototype.replaceAll = function(strReplace, strWith) {
    var reg = new RegExp(strReplace, 'ig');
    return this.replace(reg, strWith);
};

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

/* Questions */

function abilityMana(){
	var hero = getRandomHero();
	var ability = getRandomAbility(hero);
	while(!('AbilityManaCost' in ability)){
		ability = getRandomAbility(hero);
	}

	var randomLevel = Math.floor(Math.random() * ability.AbilityManaCost.length);
	var question = "How much mana does " + hero.Title + "'s " + ability.Title + " (Level " + (parseInt(randomLevel)+1) + ") cost?";
	var answer = ability.AbilityManaCost[randomLevel];
	var choices = getSimilarValues(answer, numberOfChoices);

	return {'question': question, 'answerIndex': choices.indexOf(answer), 'choices': choices};
}

function abilityOwner(){
	do {
		var hero = getRandomHero();
		var ability = getRandomAbility(hero);
		var description = ability.Description;
	} while (description === undefined);
	description = description.replaceAll(ability.Title, "{ABILITY}");
	description = description.replaceAll(hero.Title, "{HERO}");
	if ("Aliases" in hero){
		if (hero.Aliases){
			for (var i=0; i<hero.Aliases.length; i++){
				description = description.replaceAll(" "+hero.Aliases[i].capitalizeFirstLetter(), "{HERO}");
			}
		}
	}
	
	var question = "Which ability is this? " + description
	var answer = ability.Title;
	var choices = [answer];
	for (var i=1; i<numberOfChoices; i++){
		var randhero = getRandomHero();
		var randability = getRandomAbility(randhero);
		choices.push(randability.Title);
	}

	choices = shuffle(choices);

	return {'question': question, 'answerIndex': choices.indexOf(answer), 'choices': choices};
}