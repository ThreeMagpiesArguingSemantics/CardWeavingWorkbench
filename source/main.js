var CardWeaver = (function(){
	var Ribbon = function(){
		this.width = 0;
		this.length = 0;
		this.cards = [];
		this.strings = [];

		this.twists = [];
	}
	Ribbon.prototype.newString = function(){
		var string = new String();
		this.strings.push(string);
		return string;
	}
	Ribbon.prototype.removeString = function(index){
		return this.strings.splice(index,1);
	}
	Ribbon.prototype.setStingCount = function(count){
		if (count>this.strings.length){
			for (var k=this.strings.length;k<count;k++){
					var s=this.newString();
					s.name = "string "+k;
			}
		}
		else if (count<this.strings.length){
			for (var k=this.strings.length;k>count;k--){
					this.removeString(this.strings.length-1)
			}
		}
	}

	Ribbon.prototype.getCard = function(column){
		return this.cards[column];
	}
	Ribbon.prototype.newCard = function(index){
		if (!index){
			index = this.width;
		}

		var card = new Card();
		this.cards.splice(index, 0 , card);
		for(var row=0;row<this.length;row++){
				this.twists[row].splice(index, 0 , 1);
		}

		this.width++;
		return card;
	}
	Ribbon.prototype.removeCard = function(index){
		if (!index){
			index = this.width;
		}

		this.cards.splice(index, 1);
		for(var row=0;row<this.length;row++){
				this.twists[row].splice(index, 1);
		}

		this.width--;
	}

	Ribbon.prototype.setWidth = function(width){
		if (width>this.width){
			for(var row=this.width; row<width; row++){
				this.newCard();
			}
		}
		else if (width<this.width){
			for(var row=this.width; row>width; row--){
				this.removeCard();
			}
		}
	}
	Ribbon.prototype.setLength = function(length){
		if (length>this.length){
			this.twists = this.twists.concat(ones(length-this.length,this.width));
		}
		else if (length<this.length){
			this.twists.splice(length, this.length-length);
		}
		this.length = length
	}

	Ribbon.prototype.setTwist = function(row, column, value){
		this.twists[row][column] = value;
	}
	Ribbon.prototype.swapTwist = function(row, column){
		this.twists[row][column]*=-1;
	}

	Ribbon.prototype.getRowTwists = function(row){
		row = loopValue(row,ribbon.length-1,0);
		return this.twists[row];
	}
	Ribbon.prototype.getRowCardPositions = function(row){
		row = loopValue(row,ribbon.length-1,0);

		var pos = ones(this.width);
		for(var r=0;r<=row; r++){
			var twists = this.getRowTwists(r);
			for(var column=0; column<this.width; column++){
					pos[column] += twists[column];
					pos[column] = loopValue(pos[column],this.cards[column].holes,1);
			}
		}
		return pos;
	}
	Ribbon.prototype.getRowStrings = function(row){
		row = loopValue(row,ribbon.length-1,0);

		var positions = this.getRowCardPositions(row);
		var twists = this.getRowTwists(row-1);

		var values = [this.width];
		for(var column = 0; column<this.width; column++){
			var i = positions[column];
			if (twists[column]>0) i--;
			i = loopValue(i, this.cards[column].holes-1)
			values[column] = this.cards[column].strings[i]
		}
		return values;
	}

	Ribbon.prototype.save = function(){
		var json = JSON.stringify(this);
		return json;
	}
	Ribbon.prototype.load = function(json){
		try{
			var data = JSON.parse(json);
		}
		catch(e){
			return false;
		}

		this.width = 0;
		this.cards = [];
		this.twists = [];
		this.strings = [];

		for(var string of data.strings){
			var s = this.newString();
			s.color = string.color;
			s.name = string.name;
		}

		for(var card of data.cards){
			var c = this.newCard();
			c.setHoles(card.holes);
			c.strings = card.strings;
			c.setThreading(card.threading);
		}
		this.width = data.width;
		this.setLength(data.length);

		this.twists = data.twists;

		drawAll();
		return true;
	}

	var Card = function(){
		this.holes = 4;
		this.strings = [0,0,0,0];
		this.threading = "s";
	}
	Card.prototype.setString = function(index, string){
		if (index>=this.holes) return;
		this.strings[index] = string;
	}
	Card.prototype.setHoles = function(holes){
		this.holes = holes

		if (this.strings.length>this.holes){
			for(var k=this.strings.length; k>this.holes; k--){
				this.strings.splice(-1,1);
			}
		}
		else if (this.strings.length<this.holes){
			for(var k=this.strings.length; k<this.holes; k++){
				this.setString(k,0);
			}
		}
	}
	Card.prototype.setStrings = function(){
		this.strings = [];
		for(var k=0; k<this.holes && k<arguments.length; k++){
			this.setString(k, arguments[k])
		}
	}
	Card.prototype.setThreading = function(threading){
		if (!threading || !(threading==="z" || threading==="s")) return;
		if (this.threading !== threading){
			this.threading = threading;
		}
		updateTurnInstructions();
	}

	var String = function(){
		this.color = "#FFFFFF";
		this.name;
	}
	String.prototype.setColor = function(hex){
		this.color = hex;
	}
	String.prototype.setName = function(string){
		this.name = string;
	}

	var loopValue = function(value, max, min=0){
		var v = value-min;
		while(v<0)v = max-min+v+1;
		return v%(max-min+1) + min;
	}
	var ones = function(length, depth){
		var r = 1;
		if (depth) r = ones(depth);
		var a;
		for(a=[]; a.length<length; a.push(r));
		return a;
	}

	return {
		Ribbon: Ribbon
    };
})();

var ribbon = new CardWeaver.Ribbon();

function swapTwist(e){
	e = e || window.event;
	var element = e.target || e.srcElement;
	var cell;
	var row;
	if (element.nodeName.toLowerCase() == "td"){
		column = element.cellIndex;
		row = element.parentNode.rowIndex;
		row = document.getElementById("ribbonPreview").getElementsByTagName("tr").length-1 - row;
		row -= Math.floor(ribbon.length/2);
	}
	else return;

	ribbon.swapTwist(row, column);
	updateRibbon();
	//alert('You click on row ' + row+" and cell "+column);
}

function setup(){
	ribbon.load('{"width":8,"length":12,"cards":[{"holes":4,"strings":[2,2,2,2],"threading":"s"},{"holes":4,"strings":[1,0,1,0],"threading":"z"},{"holes":4,"strings":[0,1,0,1],"threading":"z"},{"holes":4,"strings":[1,0,1,0],"threading":"z"},{"holes":4,"strings":[0,1,0,1],"threading":"s"},{"holes":4,"strings":[1,0,1,0],"threading":"s"},{"holes":4,"strings":[0,1,0,1],"threading":"s"},{"holes":4,"strings":[2,2,2,2],"threading":"s"}],"strings":[{"color":"#003bff","name":"Blue"},{"color":"#ca00ff","name":"purple"},{"color":"#cdfffa","name":"silver"}],"twists":[[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1]]}')
}
function drawAll(){
	document.getElementById("settings").innerHTML = '<div class="tile" id="cardSettings"></div><div class="tile" id="formatSettings"></div><div class="tile" id="stringSettings"></div><div class="tile" id="saveAndLoadSettings"></div>';
	drawRibbon();
	drawcardSettings();
	drawFormatSettings();
	drawStringSettings();
	drawSaveAndLoadSettings();
}

function drawRibbon(){
	var length = ribbon.length*2
	var ribbonPreview = document.getElementById("ribbonPreview");
	var f_turnInstructions = document.getElementById("forwards_turnInstructions");
	var b_turnInstructions = document.getElementById("backwards_turnInstructions");
	ribbonPreview.innerHTML = "";
	f_turnInstructions.innerHTML = "";
	b_turnInstructions.innerHTML = "";
	for (var row=0; row<length; row++){
		var row_preview = ribbonPreview.insertRow(0);
		for (var column = 0; column<ribbon.width; column++){
			row_preview.insertCell(column);
		}
		var row_instructions = f_turnInstructions.insertRow(0);
		row_instructions.insertCell(0);
		var row_instructions = b_turnInstructions.insertRow(0);
		row_instructions.insertCell(0);
	}
	updateRibbon();
	updateTurnInstructions();
}
function updateRibbon(){
	var f_rows_instructions = document.getElementById("forwards_turnInstructions").getElementsByTagName("tr");
	var b_rows_instructions = document.getElementById("backwards_turnInstructions").getElementsByTagName("tr");
	var rows_preview = document.getElementById("ribbonPreview").getElementsByTagName("tr");
	for (var k=0; k<rows_preview.length; k++){
		var inv_k = rows_preview.length-1-k;
		var i = k-Math.floor(ribbon.length/2);
		var strings = ribbon.getRowStrings(i);
		var twists = ribbon.getRowTwists(i);
		var twists2 = ribbon.getRowTwists(i+1);

		if (0>i || ribbon.length-1<i){
			f_rows_instructions[inv_k].className="grey";
			b_rows_instructions[inv_k].className="grey";
			rows_preview[inv_k].className="grey";
		}

		var cells_preview = rows_preview[inv_k].getElementsByTagName("td")
		for (var k2 = 0; k2<ribbon.width; k2++){
			var cell_preview = cells_preview[k2]
			cell_preview.style.backgroundColor = ribbon.strings[strings[k2]].color;
			if (twists[k2]<0){
				cell_preview.className="left";
			}
			else{
				cell_preview.className="right";
			}
			if (twists2[k2]!=twists[k2]){
				cell_preview.className+="_c";
			}
		}
	}
	updateTurnInstructions();

	var parrent = document.body;
	parrent.scrollTop = parrent.scrollHeight;
}
function updateTurnInstructions(){
		var f_rows_instructions = document.getElementById("forwards_turnInstructions").getElementsByTagName("tr");
		var b_rows_instructions = document.getElementById("backwards_turnInstructions").getElementsByTagName("tr");
		for (var row=0; row<ribbon.length; row++){
				var twists = ribbon.getRowTwists(f_rows_instructions.length-row-1);
				var cw = [];
				var ccw = [];
				for(column=0;column<twists.length;column++){
					i = twists[column];
					if (ribbon.cards[column].threading=="z") i*=-1;
					if (i>0)cw.push(column);
					else ccw.push(column);
				}

				f_rows_instructions[row+Math.floor(ribbon.length/2+0.5)].getElementsByTagName('td')[0].innerHTML = formatTurns(cw);
				b_rows_instructions[row+Math.floor(ribbon.length/2+0.5)].getElementsByTagName('td')[0].innerHTML = formatTurns(ccw);
		}
		if (ribbon.length){
			f_rows_instructions[Math.floor(ribbon.length/2+0.5)-1].getElementsByTagName('td')[0].innerHTML="forward";
			b_rows_instructions[Math.floor(ribbon.length/2+0.5)-1].getElementsByTagName('td')[0].innerHTML="back";
		}
}
function formatTurns(turns, max){
	var str = "";

	var devider = "&nbsp&nbsp";

	if (turns.length) str+=turns[0]+1;
	for (var k=1;k<turns.length;k++){

		if (turns[k-1]+1==turns[k]){
			devider = ":";
			if (turns[k]+1==turns[k+1]){

				continue;
			}
		}
		str+=devider;
		str+=turns[k]+1;
		devider = "&nbsp&nbsp"
	}
	return str;
}

function drawcardSettings(){
	var parrent = document.getElementById("cardSettings");
	parrent.innerHTML = "";

	var tabs = [];
	for(var k=0;k<ribbon.width;k++){
		tabs.push(""+k)
	}
7
	drawSectionTabs(parrent, tabs, 0);
	updatecardSettings();
}
function updatecardSettings(){
	var parrent = document.getElementById("cardSettings");
	var sections = parrent.getElementsByClassName("section");

	var options = [];
	for(string of ribbon.strings){
		options.push(string.name);
	}

	for(var k=0;k<ribbon.width;k++){
		let card = ribbon.cards[k];
		let index = k;
		let section = sections[k]
		section.innerHTML="";

		let holes_selector = drawNumberInput(section,"card_holes", 2, card.holes)
		holes_selector.onchange = function(){
			card.setHoles(holes_selector.valueAsNumber); // NOTE needs to validate
			updatecardSettings();
			updateRibbon();
		};

		let threading = drawSelectInput(section,"threading",["z","s"],card.threading==="z"?0:1);
		threading.onchange=function(){
			card.setThreading(threading.options[threading.selectedIndex].text);
			updatecardSettings();
			updateRibbon();
		}

		for(var k2=0; k2<card.holes; k2++){
				let hole = k2;
				let strings = drawSelectInput(section,String.fromCharCode(65+k2),options,card.strings[k])
				strings.style.backgroundColor = ribbon.strings[card.strings[k2]].color;
				strings.onchange=function(){
					strings.style.backgroundColor = ribbon.strings[strings.selectedIndex].color;
					card.setString(hole,strings.selectedIndex);
					updateRibbon();
				}
		}
	}
}

function drawFormatSettings(){
		var parrent = document.getElementById("formatSettings");
		let width = drawNumberInput(parrent,"ribbon_width", 4, ribbon.width)
		width.onchange = function(){
			ribbon.setWidth(width.valueAsNumber);
			drawcardSettings();
			drawRibbon();
		};


		let length = drawNumberInput(parrent,"ribbon_length", 4, ribbon.length)
		length.onchange = function(){
			ribbon.setLength(length.valueAsNumber);
			drawcardSettings();
			drawRibbon();
		};
}
function drawSaveAndLoadSettings(){
		var parrent = document.getElementById("saveAndLoadSettings");

		var w = document.createElement("div")
		w.className="inputWrap"
		let e = document.createElement("textarea")
		e.rows = 10;
		e.cols = 25;
		e.id = "saveloadbox"
		w.appendChild(e);
		parrent.appendChild(w);

		let save = drawButtonInput(parrent, "get_savedata")
		save.onclick = function(){
				b = document.getElementById("saveloadbox");
				b.value = ribbon.save();
		};

		let load = drawButtonInput(parrent, "load_savedata")
		load.onclick = function(){
				b = document.getElementById("saveloadbox");
				if(!ribbon.load(b.value)) alert("unable to load save data");
		};
}
function drawStringSettings(){
	var parrent = document.getElementById("stringSettings");
	parrent.innerHTML = "";

	let stringCount = drawNumberInput(parrent, "string_count", 1,ribbon.strings.length);
	stringCount.onchange=function(){
			ribbon.setStingCount(stringCount.value);
			drawStringSettings();
			drawAll();
	}

	var options = [];
	for(string of ribbon.strings){
		options.push(string.name);
	}

	let strings = drawSelectInput(parrent,"string",options,0)
	var w = document.createElement("div")
	w.className="inputWrap"
	parrent.appendChild(w);
	strings.onchange=function(){
		strings.style.backgroundColor = ribbon.strings[strings.selectedIndex].color;
		w.innerHTML="";

		name = drawTextInput(w,"name",ribbon.strings[strings.selectedIndex].name)
		color = drawColorInput(w,"color",ribbon.strings[strings.selectedIndex].color)


		update = drawButtonInput(w,"update");
		update.onclick = function(){
			ribbon.strings[strings.selectedIndex].name = document.getElementById("name").value;
			ribbon.strings[strings.selectedIndex].color = document.getElementById("color").value;
			drawAll();
		}


	}
	strings.onchange();

}

function drawSectionTabs(parrent, tabNames, selected){

	// tabs
	var tabs = document.createElement("ul");
	tabs.onclick = function(e){
		// validate click
		e = e || window.event;
		var element = e.target || e.srcElement;
		if (element.nodeName.toLowerCase() != "li")return;

		var parrent = element.parentNode.parentNode;
		var sections = parrent.getElementsByClassName("section");

		// reset all
		for(var sec of sections){
			sec.className = "section";
		}
		var tabs = parrent.getElementsByTagName("li");
		for(var k=0;k<tabs.length;k++){
			tabs[k].className = "";

			if (tabs[k].value == element.value){
				element.className="active";
				sections[k].className = "section active";
			}
		}
		// set new

	}

	for(var k=0; k<tabNames.length; k++){
		var tab = document.createElement("li");
		var text = document.createTextNode(tabNames[k]);
		tab.appendChild(text);
		tab.value=k;
		if (k==selected){
			tab.className="active";
		}
		tabs.appendChild(tab);
	}
	parrent.appendChild(tabs);

	// sections
	sections = [];
	for(var k=0; k<tabNames.length; k++){
		// holes
		let section = document.createElement("div");
		section.className="section";
		sections.push(section);
		parrent.appendChild(section);
	}
	sections[selected].className="section active";

	return sections;
}
function drawSelectInput(parrent, name,options,selected){
	var w = document.createElement("div")
	w.className="inputWrap"
	var l = document.createElement("label");
	l.htmlFor=name;
	l.innerHTML=name+":";
	w.appendChild(l)
	var s = document.createElement("select");
	for(var k=0; k<options.length; k++){
		var o = document.createElement("option");
		if (selected == k) o.selected = "selected";
		o.style.backgroundColor="white";
		o.value = k;
		o.innerHTML = options[k];
		s.appendChild(o);
	}
	w.appendChild(s)
	parrent.appendChild(w);
	return s;
}
function drawNumberInput(parrent, name,minValue,startValue){
	var w = document.createElement("div")
	w.className="inputWrap"
	var l = document.createElement("label");
	l.htmlFor=name;
	l.innerHTML=name+":";
	w.appendChild(l)
	var e = document.createElement("input");
	e.type = "number";
	e.min = minValue;
	e.id=name;
	e.value = startValue;
	w.appendChild(e);
	parrent.appendChild(w);
	return e
}
function drawButtonInput(parrent, name){
	var w = document.createElement("div")
	w.className="inputWrap"
	var l = document.createElement("label");
	l.htmlFor=name;
	l.innerHTML=name+":";
	w.appendChild(l)
	var e = document.createElement("button");
	e.innerHTML = "button";
	e.id=name;
	w.appendChild(e);
	parrent.appendChild(w);
	return e;
}
function drawTextInput(parrent, name, startValue){
	var w = document.createElement("div")
	w.className="inputWrap"
	var l = document.createElement("label");
	l.htmlFor=name;
	l.innerHTML=name+":";
	w.appendChild(l)
	var e = document.createElement("input");
	e.type = "text";
	e.id=name;
	e.value = startValue;
	w.appendChild(e);
	parrent.appendChild(w);
	return e
}
function drawColorInput(parrent, name, startValue){
	var w = document.createElement("div")
	w.className="inputWrap"
	var l = document.createElement("label");
	l.htmlFor=name;
	l.innerHTML=name+":";
	w.appendChild(l)
	var e = document.createElement("input");
	e.type = "color";
	e.id=name;
	e.value = startValue;
	w.appendChild(e);
	parrent.appendChild(w);
	return e
}
