var CardWeaver = (function(){
	var Ribbon = function(){
		this.width = 0;
		this.cards = [];
		this.twists = [];
		this.strings = [];
	}
	Ribbon.prototype.newString = function(){
		var string = new String();
		this.strings.push(string);
		return string;
	}
	Ribbon.prototype.removeString = function(index){
		return this.strings.splice(index,1);
	}
	Ribbon.prototype.setWidth = function(width){
		if (this.cards.length<width){
			for(var k=width-this.cards.length; k>0; k--){
				this.addCard();
			}
		}
		else if (this.cards.length>width){
			for(var k=this.cards.length-width; k>0; k--){
				this.removeCard();
			}
		}
	}
	Ribbon.prototype.newCard = function(index){
		var card = new Card();
		if (!index){
			this.cards.push(card);
			this.twists.push(new Array());
		}
		else{
			this.cards.splice(index, 0 , card);
			this.twists.splice(index, 0 , new Array());
		}

		this.width++;
		return card;
	}
	Ribbon.prototype.removeCard = function(index){
		if (!index) index = this.width-1;
		var card = new Card();
		this.cards.splice(index, 1);
		this.twists.splice(index, 1);
		this.width--;
		return card;
	}
	Ribbon.prototype.setTurn = function(row, column, value){
		if (this.twists[column].length-1 < row) row = this.twists[column].length;
		this.twists[column][row] = value;
		if (this.cards[column].threading === "z") this.twists[column][row]*=-1;
	}
	Ribbon.prototype.getCard = function(column){
		return this.cards[column];
	}
	Ribbon.prototype.getTopRowTwists = function(row){
		var values = [];
		var value;
		for(column=0; column<this.width; column++){
			if (this.cards[column].isValid()){
				value = this.twists[column][loopValue(row,this.twists[column].length-1)];
				value*=-1;
			}
			else{
				value = false;
			}
			values.push(value);
		}
		return values;
	}
	Ribbon.prototype.getRowCardPositions = function(row){
		var values = [];
		var value;
		for(column=0; column<this.width; column++){
			if (this.cards[column].isValid()){
				value = 0;
				for(k2=0;k2<row; k2++){
					value+=this.twists[column][loopValue(k2,this.twists[column].length-1)];
				}
				value = loopValue(value,this.cards[column].holes,1);
			}
			else{
				value = false;
			}
			values.push(value);
		}
		return values;
	}
	Ribbon.prototype.getTopRowStrings = function(row){
		var positions = this.getRowCardPositions(row);
		var twists = this.getTopRowTwists(row);
		var values = [];
		for(var k = 0; k<this.width; k++){
			if (positions[k]===false){
				values.push(false);
				continue;
			}
			var index = positions[k];
			if (twists[k]>0) index--;
			index = loopValue(index, this.cards[k].holes-1)
			values.push(this.cards[k].strings[index])
		}
		return values;
	}
	Ribbon.prototype.save = function(){
		var json = JSON.stringify(this);
		var data = JSON.parse(json);

		for(var k1=0; k1<this.cards.length; k1++){
			var links = [];
			for(var string of this.cards[k1].strings){
				for(var k2=0; k2<this.strings.length; k2++){
					if (this.strings[k2] === string) links.push(k2);
				}
			}
			data.cards[k1].strings = links;
		}

		var json = JSON.stringify(data);
		return json;
	}
	Ribbon.prototype.load = function(json){
		this.width = 0;
		this.cards = [];
		this.twists = [];
		this.strings = [];

		var data = JSON.parse(json);

		for(var string of data.strings){
			var s = this.newString();
			s.color = string.color;
		}

		for(var card of data.cards){
			var c = this.newCard();
			for(var string of card.strings){
				string = c.addString(this.strings[string]);
			}
			c.holes = card.holes;
			c.setThreading(card.threading);
		}
		this.width = data.width;

		this.twists = data.twists;

	}

	var Card = function(){
		this.holes = 0;
		this.strings = [];
		this.threading;
	}
	Card.prototype.setString = function(index, string){
		this.strings.splice(index,1,string);
	}
	Card.prototype.addString = function(string){
		this.strings.push(string);
		this.holes++;
	}
	Card.prototype.setStrings = function(){
		this.strings = [];
		for(var string of arguments){
			this.addString(string)
		}
	}
	Card.prototype.setThreading = function(threading){
		if(!threading || !(threading==="z" || threading==="s")) return;
		if(!this.threading){
			this.threading = threading;
			return;
		}
		if (this.threading !== threading){
			this.strings.reverse();
		}
	}
	Card.prototype.isValid = function(){
		if (!this.holes) return false;
		if (this.holes<=1) return false;
		if (this.holes !== this.strings.length) return false;
		for (var string of this.strings){
			if (!(string instanceof String)) return false;
		}
		if (!this.threading) return false;

		return true;
	}

	var String = function(){
		this.id;
		this.color;
	}
	String.prototype.setColor = function(hex){
		this.color = hex;
	}

	return {
		Ribbon: Ribbon
    };
})();
var loopValue = function(value, max, min=0){
	var v = value-min;
	while(v<0)v = max-min+v+1;
	return v%(max-min+1) + min;
}
var ribbon;
function setup(){

	ribbon = new CardWeaver.Ribbon();
	var string1 = ribbon.newString();
	var string2 = ribbon.newString();
	var string3 = ribbon.newString();
	string1.setColor("blue");
	string2.setColor("red");
	string3.setColor("black");

	card0 = ribbon.newCard();
	card1 = ribbon.newCard();
	card2 = ribbon.newCard();
	card3 = ribbon.newCard();
	card4 = ribbon.newCard();
	card5 = ribbon.newCard();
	card6 = ribbon.newCard();
	card7 = ribbon.newCard();

	card0.setStrings(string3,string3,string3,string3);
	card0.setThreading("z");

	card1.setStrings(string2,string1,string2,string1);
	card1.setThreading("z");

	card2.setStrings(string1,string2,string1,string2);
	card2.setThreading("z");

	card3.setStrings(string2,string1,string2,string1);
	card3.setThreading("z");

	card4.setStrings(string1,string2,string1,string2);
	card4.setThreading("s");

	card5.setStrings(string2,string1,string2,string1);
	card5.setThreading("s");

	card6.setStrings(string1,string2,string1,string2);
	card6.setThreading("s");

	card7.setStrings(string3,string3,string3,string3);
	card7.setThreading("s");

	ribbon.setTurn(0,0,1);
	ribbon.setTurn(0,1,1);
	ribbon.setTurn(0,2,1);
	ribbon.setTurn(0,3,1);
	ribbon.setTurn(0,4,1);
	ribbon.setTurn(0,5,1);
	ribbon.setTurn(0,6,1);
	ribbon.setTurn(0,7,1);

	ribbon.setTurn(1,1,1);
	ribbon.setTurn(1,2,1);
	ribbon.setTurn(1,3,1);
	ribbon.setTurn(1,4,1);
	ribbon.setTurn(1,5,1);
	ribbon.setTurn(1,6,1);

	ribbon.setTurn(2,1,1);
	ribbon.setTurn(2,2,1);
	ribbon.setTurn(2,3,1);
	ribbon.setTurn(2,4,1);
	ribbon.setTurn(2,5,1);
	ribbon.setTurn(2,6,1);

	ribbon.setTurn(3,1,1);
	ribbon.setTurn(3,2,1);
	ribbon.setTurn(3,3,1);
	ribbon.setTurn(3,4,1);
	ribbon.setTurn(3,5,1);
	ribbon.setTurn(3,6,1);

	ribbon.setTurn(4,1,-1);
	ribbon.setTurn(4,2,-1);
	ribbon.setTurn(4,3,-1);
	ribbon.setTurn(4,4,-1);
	ribbon.setTurn(4,5,-1);
	ribbon.setTurn(4,6,-1);

	ribbon.setTurn(5,1,-1);
	ribbon.setTurn(5,2,-1);
	ribbon.setTurn(5,3,-1);
	ribbon.setTurn(5,4,-1);
	ribbon.setTurn(5,5,-1);
	ribbon.setTurn(5,6,-1);

	ribbon.setTurn(6,1,-1);
	ribbon.setTurn(6,2,-1);
	ribbon.setTurn(6,3,-1);
	ribbon.setTurn(6,4,-1);
	ribbon.setTurn(6,5,-1);
	ribbon.setTurn(6,6,-1);

	ribbon.setTurn(7,1,-1);
	ribbon.setTurn(7,2,-1);
	ribbon.setTurn(7,3,-1);
	ribbon.setTurn(7,4,-1);
	ribbon.setTurn(7,5,-1);
	ribbon.setTurn(7,6,-1);
	drawRibbon(ribbon);
}
function drawRibbon(ribbon){
	var table = document.getElementById("ribbonPreview");
	for (column of ribbon.cards){
		var y = document.createElement("TR");
		table.appendChild(y);
	}
	for (var k=0; k<8; k++){
		var row = table.insertRow(0);
		var colors = ribbon.getTopRowStrings(k);
		var twists = ribbon.getTopRowTwists(k);
		for (var k2 = 0; k2<ribbon.width; k2++){
			var cell = row.insertCell(k2);
			cell.style.color = colors[k2].color;
			if (twists[k2]<0){
				cell.innerHTML = "\\";
			}
			else{
				cell.innerHTML = "/";
			}
		}
	}

}
