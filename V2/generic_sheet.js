var clearStorageButton = undefined;

const bloque    = document.querySelectorAll('.bloque');
const ul = document.getElementById('ul');
var activo = Array.from(ul.children).filter(x => x.className == "li activo" )[0];
if (activo != undefined) {
	setVisibles(activo, bloque);
}

ul.addEventListener("click", (event) => {
	document.querySelector(".activo")?.classList.remove("activo");
	event.target.classList.add("activo");
	setVisibles(event.target, bloque);
});

const blesseds = document.querySelectorAll(".buff");
blesseds.forEach((blessed) => {
	blessed.addEventListener("change", (event) => {
		if (event.target.checked) {
			var dados = document.querySelectorAll(".field-dado");
			dados.forEach((dado) => {
				var attr = dado.getAttribute("data-dice-type");
				var modifier = event.target.parentElement.childNodes[1].getAttribute("data-dice-type");
				dado.setAttribute("data-dice-type", `${attr} + ${modifier}`);
			});
		} else {
			var dados = document.querySelectorAll(".field-dado");
			dados.forEach((dado) => {
				var attr = dado.getAttribute("data-dice-type");
				var modifier = event.target.parentElement.childNodes[1].getAttribute("data-dice-type");
				
				let textToDelete = ` + ${modifier}`;
				attr = attr.replace(textToDelete, "");
				dado.setAttribute("data-dice-type", attr);
			});
		}
	});
});
const selectors = document.querySelectorAll(".select");
selectors.forEach((selector) => {
	var id = selector.getAttribute("name");
	var idmod = `${id}mod`;
	var idSum = `${id}sum`;
	var parameter = document.getElementById(id);
	selector.addEventListener("change", (event) => {
		var init = parseInt(parameter.value);
		var modId = event.target[event.target.selectedIndex].getAttribute("value");
		var modifier = parseInt(document.getElementById(modId).value);
		var modified = init + modifier;
		var sum = document.getElementById(idSum);
		var mod = document.getElementById(idmod);
		mod.value = modifier;
		sum.value = modified;
		
		onInputChange(event.target, "selector");
	});
});

document.getElementById('valueInput').addEventListener('input', function() {
	const value = parseInt(this.value, 10);
	updateBar(value);
});

function setVisibles(activo, bloque) {
	const visibles = Array.from(bloque).filter(el => 
		window.getComputedStyle(el).getPropertyValue("display") !== "none"
	);
	
	visibles.forEach(el => {
		el.style.display = "none";
	});
	bloque[activo.getAttribute("index")].style.display = "block";
} 

function initSheet() {
    let inputs = document.querySelectorAll("input,button,textarea");
    for (let input of inputs) {
        if (input.id != undefined && input.id != "clear-storage") {
            input.addEventListener("change", function() {
                onInputChange(input)
            });

            let titleSibling = findFirstSiblingWithClass(input, "field-title");
            if (titleSibling != null) {
                titleSibling.id = `${input.id}-field-title`;
            }
            let descSibling = findFirstSiblingWithClass(input, "field-desc");
            if (descSibling != null) {
                descSibling.id = `${input.id}-field-desc`;
            }

            let finalInput = input; //otherwise the input can change which breaks the onchange handler
            if (titleSibling == null && input.dataset.modifier != undefined) {
                //manual fix for melee/ranged attack buttons being formatted differently
                titleSibling = finalInput;
                finalInput = document.getElementById(finalInput.dataset.modifier);
            }

            if (titleSibling != null && titleSibling.dataset.diceType != undefined) {
                titleSibling.classList.add("interactible-title");
                titleSibling.style.cursor = "pointer";
                titleSibling.addEventListener("click", function() {
                    TS.dice.putDiceInTray([createDiceRoll(titleSibling, finalInput)]);
                    //we are not checking for success or failure here, but could easily by adding a .then (success) and .catch (failure)
                });
                input.setAttribute("aria-labelledby", titleSibling.id);
                if (descSibling != null) {
                    input.setAttribute("aria-describedby", descSibling.id);
                }
            } else if (titleSibling != null) {
                titleSibling.setAttribute("for", input.id);
                if (descSibling != null) {
                    input.setAttribute("aria-describedby", descSibling.id);
                }
            }
        }
    }
}

function onInputChange(input, name, id, level) {
    //handles input changes to store them in local storage

    let data;
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        data = JSON.parse(storedData || "{}");
        if (input.type == "checkbox") {
			data[input.id] = input.checked ? "on" : "off";
		} else if (name == "magias") {
			data[name][level].list[id] = input;
		} else if (name == "dotes" || name == "feats") {
			data[name][id] = input;
		} else if (name == "selector") {
			data[input.id] = input.value;
        } else {
            data[input.id] = input.value;
        }
        //set new data, handle response
        TS.localStorage.campaign.setBlob(JSON.stringify(data)).then(() => {
            //if storing the data succeeded, enable the clear storage button
            clearStorageButton.classList.add("danger");
            clearStorageButton.disabled = false;
            clearStorageButton.textContent = "Clear Character Sheet";
        }).catch((setBlobResponse) => {
            TS.debug.log("Failed to store change to local storage: " + setBlobResponse.cause);
            console.error("Failed to store change to local storage:", setBlobResponse);
        });
    }).catch((getBlobResponse) => {
        TS.debug.log("Failed to load data from local storage: " + getBlobResponse.cause);
        console.error("Failed to load data from local storage:", getBlobResponse);
    });

    if (input.id == "abilities-text") {
        let actions = parseActions(input.value);
        addActions(actions);
    }
}

function findFirstSiblingWithClass(element, className) {
    let siblings = element.parentElement.children;
    for (let sibling of siblings) {
        if (sibling.classList.contains(className)) {
            return sibling;
        }
    }
    return null;
}

function createDiceRoll(clickElement, inputElement) {
    let modifierString = "";
    if (clickElement.dataset.modifier != "no-mod" && inputElement != null) {
        modifierString = inputElement.value >= 0 ? "+" + inputElement.value : inputElement.value;
    }
    let label = "";
    if (clickElement.dataset.label != undefined) {
        label = clickElement.dataset.label;
    } else {
        label = clickElement.textContent;
    }
    let roll = `${clickElement.dataset.diceType}${modifierString == '+' ? '' : modifierString}`

    //this returns a roll descriptor object. we could be using TS.dice.makeRollDescriptor(`${roll}+${modifierString}`) instead
    //depends mostly on personal preference. using makeRollDescriptor can be safer through updates, but it's also less efficient
    //and would ideally need error handling on the return value (and can be rate limited)
    return { name: label, roll: roll };
}

function parseActions(text) {
    let results = text.matchAll(/(.*) ((?:\d{0,2}d\d{1,2}[+-]?\d*)+) ?(.*)/gi);
    let actions = [];
    for (let result of results) {
        let action = {
            title: result[1],
            dice: result[2],
            description: result[3]
        }
        actions.push(action);
    }
    return actions;
}

function addActions(results) {
    //remove old actions
    let oldActions = document.querySelectorAll("[id^=list-action]");
    for (let oldAction of oldActions) {
        oldAction.remove();
    }

    //add new actions
    let template = document.getElementById("abilities-template");
    let container = template.parentElement;
    for (let i = 0; i < results.length; i++) {
        let clonedAction = template.content.firstElementChild.cloneNode(true);
        clonedAction.id = "list-action" + i;
        let title = clonedAction.querySelector("[id=abilities-template-title]");
        title.removeAttribute("id");
        title.textContent = results[i]["title"];

        let description = clonedAction.querySelector("[id=abilities-template-desc]");
        description.removeAttribute("id");
        description.textContent = results[i]["description"];

        let button = clonedAction.querySelector("[id=abilities-template-button]");
        button.id = "action-button" + i;
        button.dataset.diceType = results[i]["dice"];
        button.dataset.label = results[i]["title"];
        button.addEventListener("click", function() {
            TS.dice.putDiceInTray([createDiceRoll(button, null)]);
            //we are not checking for success or failure here, but could easily by adding a .then (success) and .catch (failure)
        });

        container.insertBefore(clonedAction, document.getElementById("abilities-text").parentElement);
    }
}

function populateTHAC0(event) {
    let matrix = document.getElementById("thac0-matrix");
    let children = matrix.children;
    let remainingElements = 9;
    for (let child of children) {
        if (child.classList.contains("field-data-short")) {
            child.textContent = event.target.value - remainingElements;
            remainingElements--;
        }
    }
}

function parse(param, name) {
	let dotesDOM = document.getElementById(name);
	let gifts = param;
	 Object.entries(gifts).forEach((key) => {
		var parentDiv = createNewDiv([key[0], key[1]], false)
		var name = parentDiv.children[0];
		var descriptionInput = parentDiv.children[1];
		var description = parentDiv.children[2];
			
			name.addEventListener("mousemove", (event) => {
				if (!name.clicked) {
					description.style.display = "block";
					description.style.left = `${event.pageX + 5}px`;
					description.style.top = `${event.pageY + 5}px`;
				}
			});
			name.addEventListener("click", (event) => {
				descriptionInput.style = null;
				description.style.display = "none";
				name.clicked = true;
			});
			
			name.addEventListener("mouseover", (event) => {
				if (!name.clicked) description.style.display = 'block';
			});
			name.onmouseout = () => {
				if (!name.clicked) description.style.display = "none";
			};
			
			name.addEventListener("change", (event) => {
				if (name.value.length != key[1].name.length && name.value.length != 0) {
					onInputChange({name: name.value, description: description.value}, name, key[0]);
				}
			});
			
			description.addEventListener("change", (event) => {
				if (description.value.length != key[1].description.length && description.value.length != 0) {
					onInputChange({name: name.value, description: description.value}, name, key[0]);
				}
			});
			
			description.style.position = "absolute";
			description.style.color =  "white";
			description.style.display = "none";
			description.style.width = "auto";
			description.style.height = "auto";
			
			parentDiv.addEventListener("focusout", (event) => {
				if (!parentDiv.contains(event.relatedTarget)) {
					descriptionInput.style.display = "none";
					description.value = descriptionInput.value;
					description.style.position = "absolute";
					description.style.color =  "white";
					description.style.display = "none";
					description.style.width = "auto";
					description.style.height = "auto";
					name.clicked = false;
				}
			});
			
			dotesDOM.appendChild(parentDiv);
		});
		var id = self.crypto.randomUUID();
		var masterDiv = createNewDiv([id, {name: "", description: ""}], true);
		var emptyx = masterDiv.children[0];
		var emptyy = masterDiv.children[1];
		var emptyz = masterDiv.children[2];
		
		emptyz.style.display = "none";
		
		masterDiv.addEventListener("focusout", (event) => {
			if (emptyx.value.length >0 && emptyy.value.length >0) {
				save(id, {name: emptyx.value, description: emptyy.value}, true, name);
			}
		});
		
		dotesDOM.appendChild(masterDiv);
}

function saveMagic(level, id, data, reload) {
    //handles input changes to store them in local storage
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(storedData || "{}");
		
		dataJson["magias"][level].list[id] = data;
		
        //set new data, handle response
        TS.localStorage.campaign.setBlob(JSON.stringify(dataJson)).then(() => {
            //if storing the data succeeded, enable the clear storage button
            clearStorageButton.classList.add("danger");
            clearStorageButton.disabled = false;
            clearStorageButton.textContent = "Clear Character Sheet";
			if (reload) {
				window.location.reload();
			}

        }).catch((setBlobResponse) => {
            TS.debug.log("Failed to store change to local storage: " + setBlobResponse.cause);
            console.error("Failed to store change to local storage:", setBlobResponse);
        });
    })
	.catch((getBlobResponse) => {
        TS.debug.log("Failed to load data from local storage: " + getBlobResponse.cause);
        console.error("Failed to load data from local storage:", getBlobResponse);
    });
}

function loadStoredData() {
	TS.localStorage.campaign.getBlob().then((storedData) => {
        //localstorage blobs are just unstructured text.
        //this means we can store whatever we like, but we also need to parse it to use it.
		clearStorageButton = document.getElementById("clear-storage");
		
        let data = JSON.parse(storedData || "{}");
        if (Object.entries(data).length > 0) {
            clearStorageButton.classList.add("danger");
            clearStorageButton.disabled = false;
            clearStorageButton.textContent = "Clear Character Sheet";
        }
		
		if (data["magias"] == undefined) data["magias"] = [];
		if (data["dotes"] == undefined) data["dotes"] = {};
		if (data["feats"] == undefined) data["feats"] = {};
		
		var levels = 10;
		for (let i = 0; i < levels; i++) {
		  if (data["magias"][i] == undefined) {
			  data["magias"][i] = {
				 level: i,
				 list: {}
			  };
		  }
		}
		
		TS.localStorage.campaign.setBlob(JSON.stringify(data));
		
        let keyCount = 0;
		for (let [key, value] of Object.entries(data)) {
			keyCount++;
			let element = document.getElementById(key);
			if (key == "thac0") {
				element.dispatchEvent(new Event('change'));
			} else if (key == "magias") {
				parseMagic(value);
			} else if (key == "dotes" || key == "feats") {
				parse(value, key);
			// } else if (key == "atacks") {
				// buildCombatModule(value);
			} else if (element.id == "atk1" || element.id == "atk2" || element.id == "atk3" || element.id == "atk4" || element.id == "atk5" || element.id == "atk6") {
				var idsum = `${element.id}sum`;		
				var sum = document.getElementById(idsum);
				var name = `${element.id}t`;
				if (name != undefined) {
					var modm = data[name];
					var valuemod = data[modm];
					if (valuemod != undefined) {
						var valuemodint = parseInt(data[modm]);
						var sumint = valuemodint + parseInt(value);
						sum.value = sumint;
						var modname = `${element.id}mod`;
						var idmod = document.getElementById(modname);
						idmod.value = valuemod;
					}
				} else sum.value = value;
				
				var id = document.getElementById(element.id);
				id.value = value;
				id.addEventListener("change", (event) => {
					var id = document.getElementById(event.target.id);
					var mod = document.getElementById(`${event.target.id}mod`);
					var sum = document.getElementById(`${event.target.id}sum`);
					var modified = parseInt(id.value) + parseInt(mod.value);
					sum.value = modified;
				});
			} else if (element.type != undefined && element.type == "checkbox") {
				element.checked = value == "on" ? true : false;
			} else if (key == "abilities-text") {
				let results = parseActions(element.value);
				addActions(results);
			} else element.value = value;
		}
        //adding some log information to the symbiote log
        //this doesn't have particular importance, but is here to show how it's done
        TS.debug.log(`Loaded ${keyCount} values from storage`);
    });
}

function save(id, data, reload, name) {
    //handles input changes to store them in local storage
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(storedData || "{}");
		
		dataJson[name][id] = data;
		
        //set new data, handle response
        TS.localStorage.campaign.setBlob(JSON.stringify(dataJson)).then(() => {
            //if storing the data succeeded, enable the clear storage button
            clearStorageButton.classList.add("danger");
            clearStorageButton.disabled = false;
            clearStorageButton.textContent = "Clear Character Sheet";
			clearStorageButton = document.getElementById("clear-storage");
			if (reload) {
				window.location.reload();
			}
        }).catch((setBlobResponse) => {
            TS.debug.log("Failed to store change to local storage: " + setBlobResponse.cause);
            console.error("Failed to store change to local storage:", setBlobResponse);
        });
    })
	.catch((getBlobResponse) => {
        TS.debug.log("Failed to load data from local storage: " + getBlobResponse.cause);
        console.error("Failed to load data from local storage:", getBlobResponse);
    });
}

function parseMagic(param) {
	let magias = param;
	
	magias.forEach((magia) => {
		let level = magia.level;
		let magiaDOM = document.getElementById(`magia-${level}`);
		var div = document.createElement("div");
		
		Object.entries(magia.list).forEach((magialvl) => {
			var parentDiv = createDiv(level, magialvl, false)
			var name = parentDiv.children[0];
			var descriptionInput = parentDiv.children[1];
			var description = parentDiv.children[2];
			
			name.addEventListener("click", () => {
				descriptionInput.style = null;
				description.style.display = "none";
				name.clicked = true;
			});
			name.addEventListener("mouseover", (event) => {
				if (!name.clicked) description.style.display = 'block';
			});
			
			name.onmouseout = () => {
				if (!name.clicked) description.style.display = "none";
			};
			
			name.addEventListener("change", (event) => {
				if (name.value.length != magialvl[1].name.length && name.value.length != 0) {
					onInputChange({name: name.value, description: description.value}, "magias", magialvl[0], level);
				}
			});
			
			description.addEventListener("change", (event) => {
				if (description.value.length != magialvl[1].description.length && description.value.length != 0) {
					onInputChange({name: name.value, description: description.value}, "magias", magialvl[0], level);
				}
			});
			
			description.style.position = "absolute";
			description.style.color =  "white";
			description.style.display = "none";
			description.style.width = "auto";
			description.style.height = "auto";
			
			parentDiv.addEventListener("focusout", (event) => {
				if (!parentDiv.contains(event.relatedTarget)) {
					descriptionInput.style.display = "none";
					description.value = descriptionInput.value;
					description.style.position = "absolute";
					description.style.color =  "white";
					description.style.display = "none";
					description.style.width = "auto";
					description.style.height = "auto";
					name.clicked = false;
				}
			});
			
			div.appendChild(parentDiv);
		});
		
		//var id = `magia-${level}-${position}`;
		var id = self.crypto.randomUUID();
		var masterDiv = createDiv(level, [id, {name: "", description: ""}], true);
		var emptyx = masterDiv.children[0];
		var emptyy = masterDiv.children[1];
		var emptyz = masterDiv.children[2];
		
		emptyz.style.display = "none";
		
		magiaDOM.appendChild(div);
		masterDiv.addEventListener("focusout", (event) => {
			if (emptyx.value.length >0 && emptyy.value.length >0) {		
				saveMagic(level, id, {name: emptyx.value, description: emptyy.value}, true);
			}
		});
		
		div.appendChild(masterDiv);
	});
}

function remove(id, name) {
    //handles input changes to store them in local storage
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(storedData || "{}");
		
		delete dataJson[name][id];
		
        //set new data, handle response
        TS.localStorage.campaign.setBlob(JSON.stringify(dataJson)).then(() => {
        }).catch((setBlobResponse) => {
            TS.debug.log("Failed to store change to local storage: " + setBlobResponse.cause);
            console.error("Failed to store change to local storage:", setBlobResponse);
        });
    })
	.catch((getBlobResponse) => {
        TS.debug.log("Failed to load data from local storage: " + getBlobResponse.cause);
        console.error("Failed to load data from local storage:", getBlobResponse);
    });
}

function removeMagic(level, id) {
    //handles input changes to store them in local storage
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(storedData || "{}");
		
		delete dataJson["magias"][level].list[id];
		
        //set new data, handle response
        TS.localStorage.campaign.setBlob(JSON.stringify(dataJson)).then(() => {
        }).catch((setBlobResponse) => {
            TS.debug.log("Failed to store change to local storage: " + setBlobResponse.cause);
            console.error("Failed to store change to local storage:", setBlobResponse);
        });
    })
	.catch((getBlobResponse) => {
        TS.debug.log("Failed to load data from local storage: " + getBlobResponse.cause);
        console.error("Failed to load data from local storage:", getBlobResponse);
    });
}

function createDiv(level, data, empty) {
	var div = document.createElement("div");
	div.id = data[0];
	div.className = "content-row";
	
	var descriptionInput = createTextInput("Description here", data[1].description);
	var description = createTextArea("Description here", data[1].description);
	var name = createTextInput("Name here", data[1].name);
	
	name.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			removeMagic(level, data[0]);
			div.remove();
		}
	});
	description.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			removeMagic(level, data[0]);
			div.remove();
		}
	});
	if (!empty) {
		name.addEventListener("mousemove", (event) => {
			if (!name.clicked) {
				description.style.display = "block";
				description.style.left = `${event.pageX + 5}px`;
				description.style.top = `${event.pageY + 5}px`;
			}
		});
		
		description.value = descriptionInput.value;
		descriptionInput.style.display = "none";
	}
	
	div.appendChild(name);
	div.appendChild(descriptionInput);
	div.appendChild(description);
	
	return div;
}

function createNewDiv(data, empty, name) {
	var div = document.createElement("div");
	div.className = "content-row";
	div.id = data[0];
	
	var descriptionInput = createTextInput("Description here", data[1].description);
	var description = createTextArea("Description here", data[1].description);
	var name = createTextInput("Name here", data[1].name);
	
	name.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			removeGift(data[0], name);
			
			div.remove();
		}
	});
	description.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			remove(data[0], name);
			
			div.remove();
		}
	});
	if (!empty) {
		name.addEventListener("mousemove", (event) => {
			if (!name.clicked) {
				description.style.display = "block";
				description.style.left = `${event.pageX + 5}px`;
				description.style.top = `${event.pageY + 5}px`;
			}
		});
		
		description.value = descriptionInput.value;
		descriptionInput.style.display = "none";
	}
	
	div.appendChild(name);
	div.appendChild(descriptionInput);
	div.appendChild(description);
	
	return div;
}

function createTextInput(placeHolder, value) {
	var input = document.createElement("INPUT");
	input.setAttribute("type", "text");
	input.value = value;
	input.placeholder = placeHolder;
	
	return input;
}

function createTextArea(placeHolder, value) {
	var input = document.createElement("textarea");
	//input.setAttribute("type", "text");
	input.value = value;
	input.placeholder = placeHolder;
    input.maxLength = 500;
    input.cols = 40;   
	if (value.length > 50) input.rows = value.length % 50;
	else { 
		input.rows = "auto";
		input.cols = "auto"; 
	};
	
	return input;
}

function buildCombatModule(atacks) {
	var x = document.getElementById("atacks1");
	var y = document.getElementById("atacks2");
	
	var number = 1;
	Object.entries(atacks).forEach((atack) => {
		//fill column2
		var inputsDiv = document.createElement("div");
		inputsDiv.className = "content-row";
		
		var inputValue = document.createElement("input");
		inputValue.type = "number";
		inputValue.id = atack[0];
		inputValue.setAttribute("value", atack[1].power);
		inputValue.className = "field-data-short";
		
		inputsDiv.appendChild(inputValue);
		
		var labelInput = document.createElement("label");
		labelInput.className = "field-title";
		
		var input2 = document.createElement("input");
		input2.type = "text";
		input2.setAttribute("value", atack[1].weapon);
		input2.className = "field-data";
		labelInput.appendChild(input2);
		inputsDiv.appendChild(labelInput);
		//fill column1
		var buttonsDiv = document.createElement("div");
		buttonsDiv.className = "content-row";
		
		var button1 = document.createElement("button");
		button1.className = "field-dado";
		button1.setAttribute("data-modifier", atack[0]);
		button1.setAttribute('data-dice-type', '1d20');
		var label = `Ataque${number}`;
		button1.setAttribute("data-label", label);
		button1.setAttribute("mod", atack[1].mod);
		var i0 = document.createElement("i");
		i0.className = "ts-icon-d20 ts-icon-small";
		i0.setAttribute("style", "margin-right: 0.2em;");
		button1.appendChild(i0);
        button1.addEventListener("click", (event) => {
			TS.dice.putDiceInTray([createDiceRoll(button1, inputValue)]);
            //we are not checking for success or failure here, but could easily by adding a .then (success) and .catch (failure)
        });
		var textData0 = document.createTextNode(`Ataque ${number}`);
		button1.appendChild(textData0);
		buttonsDiv.appendChild(button1);
		
		var button2 = document.createElement("button");
		button2.className = "field-dado";
		button2.setAttribute("data-modifier", atack[0]);
		button2.setAttribute("data-dice-type", atack[1].dice);
		var label = `Daño${number}`;
		button2.setAttribute("data-label", label);
		var i = document.createElement("i");
		i.className = `ts-icon-${atack[1].diceLabel} ts-icon-small`;
		i.setAttribute("style", "margin-right: 0.2em;");
		button2.appendChild(i);
        button2.addEventListener("click", function() {
            TS.dice.putDiceInTray([createDiceRoll(button2, null)]);
            //we are not checking for success or failure here, but could easily by adding a .then (success) and .catch (failure)
        });
		var value = "Da\u00f1o"
		var textData = document.createTextNode(`${value} ${number}`);
		button2.appendChild(textData);
		buttonsDiv.appendChild(button2);
		x.appendChild(buttonsDiv);
		// <select id="atk1t" title="select" name="atk1" class="select">
		  // <option value="none" selected disabled>-</option>
		  // <option value="strm">FUE</option>
		  // <option value="dexm">DEX</option>
		  // <option value="conm">CON</option>
		  // <option value="intm">INT</option>
		  // <option value="wism">SAB</option>
		  // <option value="cham">CAR</option>
		// </select>
		y.appendChild(inputsDiv);
		
		number++;
	});
}

function buildDefenseModule() {
	let div = document.getElementById("defensa");
	//title
	var title = document.createElement("h1");
	title.className = "content-row";
	title.style="width: 100%";
	var texto = document.createTextNode("Defensa");
	title.appendChild(texto);
	div.appendChild(title);
	
	//Primera columna
	var column1Data = [
		{
			name: "HP",
			description: "Puntos de Vida",
			id: "hp",
			type: "number",
			dice: undefined
		},
		{
			name: "Iniciativa",
			description: "Mod Dex",
			id: "init",
			type: "number",
			dice: "1d20"
		},
		{
			name: "Fortaleza",
			description: "Mod Con + Base",
			id: "Forta",
			type: "number",
			dice: "1d20"
		},
		{
			name: "Reflejos",
			description: "Mod Des + Base",
			id: "refl",
			type: "number",
			dice: "1d20"
		},
		{
			name: "Voluntad",
			description: "Mod Sab + Base",
			id: "vol",
			type: "number",
			dice: "1d20"
		}
	];
	var column1 = buildColumn(column1Data);
	div.appendChild(column1);
	
	//Segunda columna
	var column2Data = [
		{
			name: "Max",
			description: "Vida maxima",
			id: "max-hp",
			type: "number",
			dice: undefined
		},
		{
			name: "CA",
			description: "Clase armadura",
			id: "CA",
			type: "number",
			dice: undefined
		},
		{
			name: "TOKE",
			description: "CA Toque",
			id: "catok",
			type: "number",
			dice: undefined
		},
		{
			name: "DESPRE",
			description: "CA Desprevenido",
			id: "cadesp",
			type: "number",
			dice: undefined
		},
		{
			name: "Ataque Base",
			description: "Ataque Base",
			id: "AB",
			type: "number",
			dice: undefined
		}
	];
	var column2 = buildColumn(column2Data);
	div.appendChild(column2);
	//Tercera columna
	var column3Data = [
		{
			name: "RD",
			description: "Reduccion daño",
			id: "RD",
			type: "number",
			dice: undefined
		},
		{
			name: "BMC",
			description: "Maniobra de combate",
			id: "bmc",
			type: "number",
			dice: "1d20"
		},
		{
			name: "DMC",
			description: "Defensa maniobra combate",
			id: "DMC",
			type: "number",
			dice: undefined
		}
	];
	var column3 = buildColumn(column3Data);
	div.appendChild(column3);
}

function buildColumn(columnData) {
	var column = document.createElement("div");
	column.className = "container";
	columnData.forEach((contentData) => {
		var content = buildContent(contentData);
		column.appendChild(content);
	});
	
	return column;
}

function buildContent(contentData) {
	var content = document.createElement("div");
	content.className = "content-row";
	//Description
	var description = document.createElement("div");
	description.style.display = "none";
	description.style.position = "absolute";
	description.style.color = "white";
	var descriptionPTexto = document.createTextNode(contentData.description);
	description.appendChild(descriptionPTexto);
	content.appendChild(description);
	
	//Name
	var name = document.createElement("div");
	name.className = "content-row";
	var label = document.createElement("label");
	label.className = "field-title";
	var labelText = document.createTextNode(contentData.name);
	label.appendChild(labelText);
	var input = document.createElement("input");
	input.className = "field-data-short";
	input.setAttribute("value", "");
	input.setAttribute("id", contentData.id);
	input.setAttribute("type", contentData.type);
	if (contentData.dice != undefined && contentData.dice != null) label.setAttribute("data-dice-type", contentData.dice);
	name.appendChild(label);
	name.appendChild(input);
	content.appendChild(name);
	content.addEventListener("mousemove", (event) => {
		description.style.display = "block";
		description.style.left = `${event.pageX + 5}px`;
		description.style.top = `${event.pageY + 5}px`;
	});
	content.onmouseover = () => description.style.display = 'block';
	content.onmouseout = () => {
		description.style.display = "none";
	};
	
	return content;
}

function clearSheet() {
    //clear stored data
    TS.localStorage.campaign.deleteBlob().then(() => {
        //if the delete succeeded (.then), set the UI to reflect that
        clearStorageButton.classList.remove("danger");
        clearStorageButton.disabled = true;
        clearStorageButton.textContent = "Character Sheet Empty";
    }).catch((deleteResponse) => {
        //if the delete failed (.catch), write a message to symbiote log
        TS.debug.log("Failed to delete local storage: " + deleteResponse.cause);
        console.error("Failed to delete local storage:", deleteResponse);
    });

    //clear sheet inputs
    let inputs = document.querySelectorAll("input,textarea");
    for (let input of inputs) {
        switch (input.type) {
            case "button":
                break;
            case "checkbox":
                input.checked = false;
                break;
            default:
                input.value = "";
                break;
        }
    }
}

function updateBar(value) {
    const dynamicBar = document.getElementById('dynamicBar');
    const percentage = (Math.abs(value) / 10) * 50;
    dynamicBar.style.width = `${percentage}%`;
    
    if (value < 0) {
        dynamicBar.style.backgroundColor = 'red';
        dynamicBar.style.left = `${50 - percentage}%`;
    } else if (value > 0) {
        dynamicBar.style.backgroundColor = 'blue';
        dynamicBar.style.left = '50%';
    } else {
        dynamicBar.style.width = '0';
        dynamicBar.style.left = '50%';
    }
}

function onStateChangeEvent(msg) {
    if (msg.kind === "hasInitialized") {
        //the TS Symbiote API has initialized and we can begin the setup. think of this as "init".
        clearStorageButton = document.getElementById("clear-storage");
        loadStoredData();
        initSheet();
    }
}

function buildSelector(id, name, selected, options){
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

function buildOption(value, text, selected, disabled) {
	
	let option = document.createElement("option");
    option.setAttribute("value", value);
	if (selected) option.setAttribute("selected", "selected");
	if (disabled) option.setAttribute("disabled", "disabled");
	
    let option1Texto = document.createTextNode(text);
    option.appendChild(option1Texto);
	
	return option;
}