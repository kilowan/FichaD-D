var clearStorageButton = undefined;
var local = false;

const li        = document.querySelectorAll('.li');
const bloque    = document.querySelectorAll('.bloque');

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


//Local
// window.addEventListener("load", () => 
// {
	// local = true;
	// loadLocalData();
	// const selectors = document.querySelectorAll(".select");
	// selectors.forEach((selector) => {
		// var id = selector.getAttribute("name");
		// var idmod = `${id}mod`;
		// var idSum = `${id}sum`;
		// var parameter = document.getElementById(id);
		// selector.addEventListener("change", (event) => {
			// var init = parseInt(parameter.value);
			// var modId = event.target[event.target.selectedIndex].getAttribute("value");
			// var modifier = parseInt(document.getElementById(modId).value);
			// var modified = init + modifier;
			// var sum = document.getElementById(idSum);
			// var mod = document.getElementById(idmod);
			// mod.value = modifier;
			// sum.value = modified;
		// });
	// });
// });

//Talespire
window.addEventListener("load", () => 
{
	// var container = document.getElementById("container");
	// var pruebas2 = document.getElementById("element");
	// var element2 = document.createElement("div");
	// element2.className = "content-row";
	// element2.innerHTML = pruebas2.innerHTML;
	// element2.childNodes[1].childNodes[1].textContent = "Ataque 7"
	// element2.childNodes[1].setAttribute("data-modifier", "atk7");
	// //element2.childNodes[1].setAttribute("data-dice-type", "15d20");
	// element2.childNodes[1].setAttribute("data-label", "Ataque7");
	// element2.childNodes[1].setAttribute("id", "atk07");
	// container.appendChild(element2);
	
	// var container2 = document.getElementById("container2");
	// var pruebas1 = document.getElementById("element2");
	// var element1 = document.createElement("div");
	// element1.innerHTML = pruebas1.innerHTML;
	// element1.childNodes[1].setAttribute("id", "atk7");
	// container2.appendChild(element1);
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
		});
	});
});

li.forEach( ( cadaLi , i )=>{
    li[i].addEventListener('click',()=>{

        li.forEach( ( cadaLi , i )=>{
            li[i].classList.remove('activo');
            //bloque[i].classList.remove('activo');
			bloque[i].style.display = "none";
        })

        li[i].classList.add('activo');
        //bloque[i].classList.add('activo')
		bloque[i].style.display = "block";
    })
})

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
					if (local) saveLocal(key[0], {name: name.value, description: description.value}, false, name);
					else onInputChange({name: name.value, description: description.value}, name, key[0]);
				}
			});
			
			description.addEventListener("change", (event) => {
				if (description.value.length != key[1].description.length && description.value.length != 0) {
					if (local) saveLocal(key[0], {name: name.value, description: description.value}, false, name);
					else onInputChange({name: name.value, description: description.value}, name, key[0]);
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
				if (local) saveLocal(id, {name: emptyx.value, description: emptyy.value}, true, name);
				else save(id, {name: emptyx.value, description: emptyy.value}, true, name);
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

function saveMagicLocal(level, id, data, reload) {
    //handles input changes to store them in local storage
    // get already stored data
	var localData = localStorage.getItem("campaign");
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(localData || "{}");
		
		dataJson["magias"][level].list[id] = data;
		
        //set new data, handle response
		localStorage.setItem("campaign", JSON.stringify(dataJson));
            //if storing the data succeeded, enable the clear storage button
            clearStorageButton.classList.add("danger");
            clearStorageButton.disabled = false;
            clearStorageButton.textContent = "Clear Character Sheet";
			clearStorageButton = document.getElementById("clear-storage");
			if (reload) {
				window.location.reload();
			}
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
			} else if (element.id == "atk1" || element.id == "atk2" || element.id == "atk3" || element.id == "atk4" || element.id == "atk5" || element.id == "atk6") {
				var idsum = `${element.id}sum`;
				var sum = document.getElementById(idsum);
				sum.value = value;
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

function loadLocalData() {
	//localstorage blobs are just unstructured text.
	//this means we can store whatever we like, but we also need to parse it to use it.
	clearStorageButton = document.getElementById("clear-storage");
	var datajson = localStorage.getItem("campaign");
	
	let data = JSON.parse(datajson || "{}");
	
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
	
    localStorage.setItem("campaign", JSON.stringify(data));
	
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
		} else if (element.id == "atk1" || element.id == "atk2" || element.id == "atk3" || element.id == "atk4" || element.id == "atk5" || element.id == "atk6") {
			var idsum = `${element.id}sum`;
			var sum = document.getElementById(idsum);
			sum.value = value;
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

function saveLocal(id, data, reload, name) {
	var localData = localStorage.getItem("campaign");
	var dataJson = JSON.parse(localData || "{}");
	
	dataJson[name][id] = data;
	
	localStorage.setItem("campaign", JSON.stringify(dataJson));
	clearStorageButton.classList.add("danger");
	clearStorageButton.disabled = false;
	clearStorageButton.textContent = "Clear Character Sheet";
	clearStorageButton = document.getElementById("clear-storage");
	if (reload) {
		window.location.reload();
	}
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
				if (name.value.length != magialvl[1].name.length && name.value.length != 0) {
					if (local) saveMagicLocal(level, magialvl[0], {name: name.value, description: description.value}, false);
					else onInputChange({name: name.value, description: description.value}, "magias", magialvl[0], level);
				}
			});
			
			description.addEventListener("change", (event) => {
				if (description.value.length != magialvl[1].description.length && description.value.length != 0) {
					if (local) saveMagicLocal(level, magialvl[0], {name: name.value, description: description.value}, false);
					else onInputChange({name: name.value, description: description.value}, "magias", magialvl[0], level);
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
				if (local) saveMagicLocal(level, id, {name: emptyx.value, description: emptyy.value}, true);
				else saveMagic(level, id, {name: emptyx.value, description: emptyy.value}, true);
			}
		});
		
		div.appendChild(masterDiv);
	});
}

function removeMagicLocal(level, id) {
	var localData = localStorage.getItem("campaign");
	var dataJson = JSON.parse(localData || "{}");
	delete dataJson["magias"][level].list[id];
	localStorage.setItem("campaign", JSON.stringify(dataJson));
}

function removeLocal(id, name) {
	var localData = localStorage.getItem("campaign");
	var dataJson = JSON.parse(localData || "{}");
	delete dataJson[name][id];
	localStorage.setItem("campaign", JSON.stringify(dataJson));
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
			if (local) removeMagicLocal(level, data[0]);
			else removeMagic(level, data[0]);
			div.remove();
		}
	});
	description.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			if (local) removeMagicLocal(level, data[0]);
			else removeMagic(level, data[0]);
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
			if (local) removeLocal(data[0], name);
			else removeGift(data[0], name);
			
			div.remove();
		}
	});
	description.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			if (local) removeLocal(data[0], name);
			else remove(data[0], name);
			
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
	
	// var ataques = {
        // "104dcb00-08f2-4aeb-9008-27c5baff35c4": {
            // dice: "1d8",
            // diceLabel: "d8",
            // weapon: "Arco Largo",
            // power: 7,
            // mod: "str",
            // distance: "100'"
        // },
        // "31731c26-7f0a-4319-83d1-f3605e1d44eb": {
            // dice: "1d4",
            // diceLabel: "d4",
            // weapon: "Daga",
            // power: 7,
            // mod: "str",
            // distance: "10'"
        // },
        // "eadc9146-6e11-4992-bd6d-a05af96de625": {
            // dice: "1d4",
            // diceLabel: "d4",
            // weapon: "Laud Azul",
            // power: 4,
            // mod: "str",
            // distance: null
        // },
        // "7eebd0d0-903e-48f5-8360-b65a2b6ae81f": {
            // dice: "1d4 + 3",
            // diceLabel: "d4",
            // weapon: "Arco largo mejorado",
            // power: 7,
            // mod: "str",
            // distance: "100'"
        // }
    // };
	var pruebas2 = document.getElementById("pruebas2");
	//pruebas2.innerHTML = "<button id=\"atk04\" class=\"field-dado\" data-modifier=\"atk4\" data-dice-type=\"1d20\" data-label=\"Ataque4\"><i class=\"ts-icon-d20 ts-icon-small\" style=\"margin-right: 0.2em;\"></i>Ataque 4</button>";
	//pruebas2.innerHTML = '\n\t\t\t\t\t\t\x3C!-- <input id="atk4" type="number" class="field-data-short"></input><label class="field-title"><input id="espacio4" type="text" class="field-data"></input></label> -->\n\t\t\t\t\t<input id="atk4" type="number" class="field-data-short"><label class="field-title"><input id="espacio4" type="text" class="field-data"></label>'
	var button1 = document.createElement("button");
	button1.className = "field-dado";
	// button1.setAttribute("data-modifier", "atk4");
	//button1.setAttribute("data-dice-type", "1d20");
	button1["data-dice-type"] = "1d20";
	// button1.setAttribute("data-label", "Ataque4");
	// var i0 = document.createElement("i");
	// i0.className = "ts-icon-d20 ts-icon-small";
	// i0.setAttribute("style", "margin-right: 0.2em;");
	// button1.appendChild(i0);
	var textData0 = document.createTextNode("Ataque 7");
	button1.appendChild(textData0);
	pruebas2.appendChild(button1);
	// var x = document.getElementById("combate1");
	// var y = document.getElementById("combate2");
	// var pruebas = document.getElementById("pruebas");
	// var input = document.createElement("input");
	// //input.id = "atk4";
	// input.type = "number";
	// input.className = "field-data-short";
	// pruebas.appendChild(input);
	
	// var labelInput = document.createElement("label");
	// labelInput.className = "field-title";
	
	// var input2 = document.createElement("input");
	// input2.id = "espacio4";
	// input2.type = "text";
	// input2.className = "field-data";
	// labelInput.appendChild(input2);
	// //pruebas.appendChild(labelInput);
	
	
	// var number = 1;
	// Object.entries(atacks).forEach((atack) => {
	// //Object.entries(ataques).forEach((atack) => {
		// // "identifier":{
			// // "dice": "d8", //dado daño
			// // "dice-qt": 1,
			// // "weapon": "example", //nombre arma
			// // "power": 8, //modificador tirada D20
			// // "mod": "str" // modificador daño
			// // "distance": "100'"
		// // }
		
		// //fill column1
		// var buttonsDiv = document.createElement("div");
		// buttonsDiv.className = "content-row";
		
		// var button1 = document.createElement("button");
		// button1.className = "field-dado";
		// button1.setAttribute("data-modifier", atack[0]);
		// // button1.setAttribute("data-dice-type", "1d20");
		// button1.setAttribute('data-dice-type', '1d20');
		// // var label = `Ataque${number}`;
		// // button1.setAttribute("data-label", label);
		// var i0 = document.createElement("i");
		// i0.className = "ts-icon-d20 ts-icon-small";
		// i0.setAttribute("style", "margin-right: 0.2em;");
		// button1.appendChild(i0);
		// // var textData0 = document.createTextNode(`Ataque ${number}`);
		// // button1.appendChild(textData0);
		// buttonsDiv.appendChild(button1);
		
		// var button2 = document.createElement("button");
		// button2.className = "field-dado";
		// button2.setAttribute("data-modifier", atack[0]);
		// button2.setAttribute("data-dice-type", atack[1].dice);
		// // var label = `Ataque${number}`;
		// // button2.setAttribute("data-label", label);
		// var i = document.createElement("i");
		// i.className = `ts-icon-${atack[1].diceLabel} ts-icon-small`;
		// i.setAttribute("style", "margin-right: 0.2em;");
		// button2.appendChild(i);
		// //var value = "Da&ntilde;o";
		// var value = "Da\u00f1o"
		// // var textData = document.createTextNode(`${value} ${number}`);
		// // button2.appendChild(textData);
		// buttonsDiv.appendChild(button2);
		// x.appendChild(buttonsDiv);
		
		// //fill column2
		// var inputsDiv = document.createElement("div");
		// inputsDiv.className = "content-row";
		
		// var inputValue = document.createElement("input");
		// inputValue.type = "number";
		// inputValue.id = atack[0];
		// inputValue.setAttribute("value", atack[1].power);
		// inputValue.className = "field-data-short";
		
		// inputsDiv.appendChild(inputValue);
		
		// var labelInput = document.createElement("label");
		// labelInput.className = "field-title";
		
		// var input2 = document.createElement("input");
		// input2.type = "text";
		// input2.setAttribute("value", atack[1].weapon);
		// input2.className = "field-data";
		// labelInput.appendChild(input2);
		// inputsDiv.appendChild(labelInput);
		
		// y.appendChild(inputsDiv);
		
		// // number++;
	// });
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
			description: "Reduccion danyo",
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
	//description.appendChild(descriptionP);
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

document.getElementById('valueInput').addEventListener('input', function() {
    const value = parseInt(this.value, 10);
    updateBar(value);
});

function onStateChangeEvent(msg) {
    if (msg.kind === "hasInitialized") {
        //the TS Symbiote API has initialized and we can begin the setup. think of this as "init".
        clearStorageButton = document.getElementById("clear-storage");
        loadStoredData();
        initSheet();
    }
}