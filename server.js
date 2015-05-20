var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	fs = require('fs');

var Outputdir = 'DOTA2Data/Output/';

app.use(express.static(Outputdir));

var dotadata = JSON.parse(fs.readFileSync(Outputdir + 'heroes.json'));
var questions = [whichHero, abilityMana, abilityOwner];

var numberOfChoices = 4;

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.htm');
});

app.use(express.static(__dirname + '/DOTA2Data/Output/heroes.json'));

io.on('connection', function(socket){
	console.log('a user connected');

	var question;

	socket.on('questionRequest', function(){
		question = getRandomQuestion();
		socket.emit('question', question);
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

/* Getters */

function getRandomQuestion(){
	return questions[Math.floor(Math.random() * questions.length)]();
}

function getRandomHero(){
	return dotadata[Math.floor((Math.random() * dotadata.length))];
}

function getRandomAbility(){
	var hero = getRandomHero();
	return getRandomAbilityOfHero(hero);
}

function getRandomAbilityOfHero(hero){
	return hero.Abilities[Math.floor((Math.random() * hero.Abilities.length))];
}

function getAbilityImage(ability){
	return 'images/spellicons/' + ability.HeroAbilityUrl +  '.png';
}

function getHeroImageSmall(herourl){
	return 'images/heroes/selection/' + herourl + '.png';
}

function getHeroImageLarge(herourl){
	return 'images/heroes/full/' + herourl + '.png';
}

function getHeroMinimapIcon(herourl){
	return 'images/miniheroes' + herourl + '.png';
}

function getHeroPortrait(herourl){
	return 'webms/' + herourl + '.png';
}

/* Utility */

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
	var ability = getRandomAbilityOfHero(hero);
	while(!('AbilityManaCost' in ability)){
		ability = getRandomAbilityOfHero(hero);
	}

	var randomLevel = Math.floor(Math.random() * ability.AbilityManaCost.length);
	var question = "How much mana does " + hero.Title + "'s " + ability.Title + " (Level " + (parseInt(randomLevel)+1) + ") cost?";
	var answer = ability.AbilityManaCost[randomLevel];
	var choices = getSimilarValues(answer, numberOfChoices);

	return {'type': 'abilityMana', 'question': question, 'answerIndex': choices.indexOf(answer), 'choices': choices};
}

function abilityOwner(){
	do {
		var hero = getRandomHero();
		var ability = getRandomAbilityOfHero(hero);
		var description = ability.Description;
	} while (description === undefined);
	description = description.replaceAll(ability.Title+" ", "{ABILITY} ");
	description = description.replaceAll(hero.Title+" ", "{HERO} ");
	if ("Aliases" in hero){
		if (hero.Aliases){
			for (var i=0; i<hero.Aliases.length; i++){
				if (hero.Aliases !== null)
					description = description.replaceAll(" "+hero.Aliases[i]+" ", " {HERO} ");
			}
		}
	}
	
	var question = "Which ability is this? " + description
	var answer = ability.Title;
	var choices = [answer];
	for (var i=1; i<numberOfChoices; i++){
		var randhero = getRandomHero();
		var randability = getRandomAbilityOfHero(randhero);
		choices.push(randability.Title);
	}

	choices = shuffle(choices);

	return {'type': 'abilityOwner', 'question': question, 'answerIndex': choices.indexOf(answer), 'choices': choices};
}

function whichHero(){
	var choices = [];
	var answer, questionImg;
	for (var i=0; i<numberOfChoices; i++){
		var hero = getRandomHero();
		choices.push(hero.Title);
		answer = hero.Title;
		questionImg = getHeroImageLarge(hero.Url);
	}
	choices = shuffle(choices);

	var question = "Which hero is this?";
	
	return {'type': 'whichHero', 'question': question, 'questionImage': questionImg, 'answerIndex': choices.indexOf(answer), 'choices': choices};
}