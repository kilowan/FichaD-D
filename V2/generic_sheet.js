var clearStorageButton = undefined;
var local = false;

const li        = document.querySelectorAll('.li');
const bloque    = document.querySelectorAll('.bloque');

window.addEventListener("load", () => 
{
	local = true;
	loadLocalData();
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
		 } else if (name == "dotes") {
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

function parseGifts(param) {
	let dotesDOM = document.getElementById("dotes");
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
					if (local) saveGiftLocal(key[0], {name: name.value, description: description.value}, false);
					else onInputChange({name: name.value, description: description.value}, "dotes", key[0]);
				}
			});
			
			description.addEventListener("change", (event) => {
				if (description.value.length != key[1].description.length && description.value.length != 0) {
					if (local) saveGiftLocal(key[0], {name: name.value, description: description.value}, false);
					else onInputChange({name: name.value, description: description.value}, "dotes", key[0]);
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
				if (local) saveGiftLocal(id, {name: emptyx.value, description: emptyy.value}, true);
				else saveGift(id, {name: emptyx.value, description: emptyy.value}, true);
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
			element.value = value;
            if (key == "thac0") {
                element.dispatchEvent(new Event('change'));
			} else if (element.type == "checkbox") {
                element.checked = value == "on" ? true : false;
			} else if (key == "magias") {
				parseMagic(value);
			} else if (key == "dotes") {
				parseGifts(value);
            } else if (key == "abilities-text") {
                let results = parseActions(element.value);
                addActions(results);
            }
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
		if (element == undefined) {
			debugger;
		} else {
			element.value = value;
			if (key == "thac0") {
				element.dispatchEvent(new Event('change'));
			} else if (key == "magias") {
				parseMagic(value);
			} else if (key == "dotes") {
				parseGifts(value);
			} else if (element.type != undefined && element.type == "checkbox") {
				element.checked = value == "on" ? true : false;
			} else if (key == "abilities-text") {
				let results = parseActions(element.value);
				addActions(results);
			}
		}
	}
}

function saveGift(id, data, reload) {
    //handles input changes to store them in local storage
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(storedData || "{}");
		
		dataJson["dotes"][id] = data;
		
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

function saveGiftLocal(id, data, reload) {
	var localData = localStorage.getItem("campaign");
	var dataJson = JSON.parse(localData || "{}");
	
	dataJson["dotes"][id] = data;
	
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

function removeGiftLocal(id) {
	var localData = localStorage.getItem("campaign");
	var dataJson = JSON.parse(localData || "{}");
	delete dataJson["dotes"][id];
	localStorage.setItem("campaign", JSON.stringify(dataJson));
}

function removeGift(id) {
    //handles input changes to store them in local storage
    // get already stored data
    TS.localStorage.campaign.getBlob().then((storedData) => {
        //parse stored blob as json, but also handle if it's empty by
        //defaulting to an empty json document "{}" if stored data is false
        var dataJson = JSON.parse(storedData || "{}");
		
		delete dataJson["dotes"][id];
		
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

function createNewDiv(data, empty) {
	var div = document.createElement("div");
	div.className = "content-row";
	div.id = data[0];
	
	var descriptionInput = createTextInput("Description here", data[1].description);
	var description = createTextArea("Description here", data[1].description);
	var name = createTextInput("Name here", data[1].name);
	
	name.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			if (local) removeGiftLocal(data[0]);
			else removeGift(data[0]);
			
			div.remove();
		}
	});
	description.addEventListener("input", () => {
	    if (description.value.trim() === "" && name.value.trim() === "" && !empty) {
			if (local) removeGiftLocal(data[0]);
			else removeGift(data[0]);
			
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