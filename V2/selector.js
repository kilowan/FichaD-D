export function buildSelector(id, name, selected){
	let select = document.createElement("select");
	select.className = "select";
	select.id = id;
	select.title = "select";
	select.name = name;
	
	// var default = false;
	// if (!selected) default = true;
	
	//default
	let option1 = buildOption("none", "-", !selected, true);
	
	//FUE
    let option2 = buildOption("strm", "FUE", false, false);
	
	//DEX
    let option3 = buildOption("dexm", "DEX", false, false);
	
	//CON
	let option4 = buildOption("conm", "CON", false, false);
	
	//INT
	let option5 = buildOption("intm", "INT", false, false);
	
	//SAB
	let option6 = buildOption("wism", "SAB", false, false);
	
	//CAR
	let option7 = buildOption("cham", "CAR", false, false);
 
    select.appendChild(option1);
    select.appendChild(option2);
    select.appendChild(option3);
	select.appendChild(option4);
	select.appendChild(option5);
	select.appendChild(option6);
	select.appendChild(option7);
	if (selected) select.value = selected;
	
	return select;
}

export function buildOption(value, text, selected, disabled) {
	
	let option = document.createElement("option");
    option.setAttribute("value", value);
	if (selected) option.setAttribute("selected", "selected");
	if (disabled) option.setAttribute("disabled", "disabled");
	
    let option1Texto = document.createTextNode(text);
    option.appendChild(option1Texto);
	
	return option;
}
