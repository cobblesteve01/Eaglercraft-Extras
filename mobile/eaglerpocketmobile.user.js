function isMobile() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}
if(!isMobile()) {
    alert("WARNING: This script was created for mobile, and may break functionality in non-mobile browsers!");
}
window.keyboardEnabled = false;
window.crouchLock = false;
window.sprintLock = false;
window.keyboardFix = false; // temporarily set to true until I can figure out whats going wrong with the event listener in charge of switching it
// Used for changing touchmove events to mousemove events
var previousTouchX = null;
var previousTouchY = null;
var startTouchX = null;
// better charCodeAt function
String.prototype.toKeyCode = function() {
    const keyCodeList = {"0": 48, "1": 49, "2": 50, "3": 51, "4": 52, "5": 53, "6": 54, "7": 55, "8": 56, "9": 57, "backspace": 8, "tab": 9, "enter": 13, "shift": 16, "ctrl": 17, "alt": 18, "pause_break": 19, "caps_lock": 20, "escape": 27, " ": 32, "page_up": 33, "page_down": 34, "end": 35, "home": 36, "left_arrow": 37, "up_arrow": 38, "right_arrow": 39, "down_arrow": 40, "insert": 45, "delete": 46, "a": 65, "b": 66, "c": 67, "d": 68, "e": 69, "f": 70, "g": 71, "h": 72, "i": 73, "j": 74, "k": 75, "l": 76, "m": 77, "n": 78, "o": 79, "p": 80, "q": 81, "r": 82, "s": 83, "t": 84, "u": 85, "v": 86, "w": 87, "x": 88, "y": 89, "z": 90, "left_window_key": 91, "right_window_key": 92, "select_key": 93, "numpad_0": 96, "numpad_1": 97, "numpad_2": 98, "numpad_3": 99, "numpad_4": 100, "numpad_5": 101, "numpad_6": 102, "numpad_7": 103, "numpad_8": 104, "numpad_9": 105, "*": 106, "+": 107, "-": 109, ".": 110, "/": 111, "f1": 112, "f2": 113, "f3": 114, "f4": 115, "f5": 116, "f6": 117, "f7": 118, "f8": 119, "f9": 120, "f10": 121, "f11": 122, "f12": 123, "num_lock": 144, "scroll_lock": 145, ";": 186, "=": 187, ",": 188, "-": 189, ".": 190, "/": 191, "`": 192, "[": 219, "\\": 220, "]": 221, "\"": 222};
    return keyCodeList[this];
}
// Ignores keydown events that don't have the isValid parameter set to true
const _addEventListener = EventTarget.prototype.addEventListener;
Object.defineProperty(EventTarget.prototype, "addEventListener", {
    value: function (type, fn, ...rest) {
        if(type == 'keydown') {
            _addEventListener.call(this, type, function(...args) {
                if(!args[0].isValid && window.keyboardFix) {
                    return;
                }
                return fn.apply(this, args);
            }, ...rest);
        } else {
            _addEventListener.call(this, type, fn, ...rest);
        }
    }
});
// Allows typing in #hiddenInput
const _preventDefault = Event.prototype.preventDefault;
Event.prototype.preventDefault = function() {
  if(document.activeElement.id != "hiddenInput") {
      this._preventDefault =  _preventDefault;
      this._preventDefault();
  }
}
// Key and mouse events
// Note: the client must have the key, keyCode, and which parameters defined or it will crash
// Note: for text inputs, the client only reads from the "key" paramater
//     * an exception to this appears to be the shift and backspace key
// Note: for inGame inputs, the client only reads from the "keyCode character"
function keyEvent(name, state) {
    const charCode = name.toKeyCode();
    let evt = new KeyboardEvent(state, {
        key: name,
        keyCode: charCode,
        which: charCode
    });
    evt.isValid = true; // Disables fix for bad keyboard input
    window.dispatchEvent(evt);
}
function mouseEvent(number, state, canvas) {
    canvas.dispatchEvent(new PointerEvent(state, {"button": number}))
}
function wheelEvent(canvas, delta) {
    canvas.dispatchEvent(new WheelEvent("wheel", {
        "wheelDeltaY": delta
  }));
}
function setButtonVisibility(pointerLocked) {
    let inGameStyle = document.getElementById('inGameStyle');
    let inMenuStyle = document.getElementById('inMenuStyle');
    inGameStyle.disabled = pointerLocked;
    inMenuStyle.disabled = !pointerLocked;  
}
// POINTERLOCK
// When requestpointerlock is called, this dispatches an event, saves the requested element to window.fakelock, and unhides the touch controls
window.fakelock = null;

Object.defineProperty(Element.prototype, "requestPointerLock", {
	value: function() {
		window.fakelock = this
		document.dispatchEvent(new Event('pointerlockchange'));
		setButtonVisibility(true);
		return true
	}
});


// Makes pointerLockElement return window.fakelock
Object.defineProperty(Document.prototype, "pointerLockElement", {
    get: function() {
        return window.fakelock;
    }
});
// When exitPointerLock is called, this dispatches an event, clears the
Object.defineProperty(Document.prototype, "exitPointerLock", {
	value: function() {
		window.fakelock = null
		document.dispatchEvent(new Event('pointerlockchange'));
		setButtonVisibility(false);
		return true
	}
});

// FULLSCREEN
window.fakefull = null;
// Stops the client from crashing when fullscreen is requested
Object.defineProperty(Element.prototype, "requestFullscreen", {
	value: function() {
		window.fakefull = this
		document.dispatchEvent(new Event('fullscreenchange'));
		return true
	}
});
Object.defineProperty(document, "fullscreenElement", {
    get: function() {
        return window.fakefull;
    }
});
Object.defineProperty(Document.prototype, "exitFullscreen", {
	value: function() {
		window.fakefull = null
		document.dispatchEvent(new Event('fullscreenchange'));
		return true
	}
});

// FILE UPLOADING
// Safari doesn't recognize the element.click() used to display the file uploader as an action performed by the user, so it ignores it.
// This hijacks the element.createElement() function to add the file upload to the DOM, so the user can manually press the button again.
const _createElement = document.createElement;
document.createElement = function(type, ignore) {
    this._createElement = _createElement;
    var element = this._createElement(type);
    if(type == "input" && !ignore) {
    	document.querySelectorAll('#fileUpload').forEach(e => e.parentNode.removeChild(e));
    	element.id = "fileUpload";
    	element.addEventListener('change', function(e) {
    		element.hidden = true;
    		element.style.display = "none";
    	}, {passive: false, once: true});
    	window.addEventListener('focus', function(e) {
            setTimeout(() => {
                element.hidden = true;
    			element.style.display = "none";
            }, 300)
        }, { once: true })
        document.body.appendChild(element);
    }
    return element;
}

// Lazy way to hide touch controls through CSS.
let inGameStyle = document.createElement("style");
inGameStyle.id = "inGameStyle";
inGameStyle.textContent = `
    .inGame {
        display: none;
    }`;
document.documentElement.appendChild(inGameStyle);

let inMenuStyle = document.createElement("style");
inMenuStyle.id = "inMenuStyle";
inMenuStyle.textContent = `
    .inMenu {
        display: none;
    }`;
document.documentElement.appendChild(inMenuStyle);


// The canvas is created by the client after it finishes unzipping and loading. When the canvas is created, this applies any necessary event listeners
function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    });
}
function createTouchButton(buttonClass, buttonDisplay, elementName) {
    var touchButton = document.createElement(elementName ?? 'button', true);
    touchButton.classList.add(buttonClass);
    touchButton.classList.add(buttonDisplay);
    touchButton.classList.add("mobileControl");
    touchButton.addEventListener("touchmove", function(e){e.preventDefault()}, false);
    return touchButton;
}

function toggleKeyboard() {
    const keyboardInput = document.getElementById('hiddenInput');
    if (window.keyboardEnabled) {
        window.keyboardEnabled = false;
        keyboardInput.blur();
    } else {
        window.keyboardEnabled = true;
        keyboardInput.select();
    }
}

waitForElm('canvas').then(() => {insertCanvasElements()});
function insertCanvasElements() {    
    // Translates touchmove events to mousemove events when inGame, and touchmove events to wheele events when inMenu
    var canvas = document.querySelector('canvas');
    canvas.addEventListener("touchmove", function(e) {
        e.preventDefault();
        const touch = e.targetTouches[0]; // We can get away with this because every other touch event will be on different elements

        if (!previousTouchX) {
            previousTouchX = touch.pageX;
            previousTouchY = touch.pageY;
        }
        e.movementX = touch.pageX - previousTouchX;
        e.movementY = touch.pageY - previousTouchY;
        var evt = window.fakelock ? new MouseEvent("mousemove", {movementX: e.movementX, movementY: e.movementY}) : new WheelEvent("wheel", {"wheelDeltaY": e.movementY});
        canvas.dispatchEvent(evt);
        previousTouchX = touch.pageX;
        previousTouchY = touch.pageY;
    }, false);

    canvas.addEventListener("touchend", function(e) {
        previousTouchX = null;
        previousTouchY = null; 
    }, false)
    //Updates button visibility on load
    setButtonVisibility(window.fakelock != null);
    // Adds all of the touch screen controls
    // Theres probably a better way to do this but this works for now
    let strafeRightButton = createTouchButton("strafeRightButton", "inGame", "div");
	strafeRightButton.classList.add("strafeSize");
    strafeRightButton.style.cssText = "left:24vh;bottom:22vh;"
    document.body.appendChild(strafeRightButton);
    let strafeLeftButton = createTouchButton("strafeLeftButton", "inGame", "div");
	strafeLeftButton.classList.add("strafeSize");
    strafeLeftButton.style.cssText = "left:5.5vh;bottom:22vh;"
    document.body.appendChild(strafeLeftButton);
  
    let forwardButton = createTouchButton("forwardButton", "inGame", "div");
    forwardButton.style.cssText = "left:14vh;bottom:22vh;"
    forwardButton.addEventListener("touchstart", function(e){
        keyEvent("w", "keydown");
        strafeRightButton.classList.remove("hide");
        strafeLeftButton.classList.remove("hide");
        forwardButton.classList.add("active");
    }, false);
    forwardButton.addEventListener("touchmove", function(e) {
        e.preventDefault();
        const touch = e.targetTouches[0]; // We can get away with this because every other touch event will be on different elements

        if (!startTouchX) {
            startTouchX = touch.pageX;
        }
        let movementX = touch.pageX - startTouchX;
        if((movementX * 10) > window.innerHeight) {
            strafeRightButton.classList.add("active");
            strafeLeftButton.classList.remove("active");
            keyEvent("d", "keydown");
            keyEvent("a", "keyup");
            
        } else if ((movementX * 10) < (0 - window.innerHeight)) {
            strafeLeftButton.classList.add("active");
            strafeRightButton.classList.remove("active");
            keyEvent("a", "keydown");
            keyEvent("d", "keyup");
        } else {
            strafeRightButton.classList.remove("active");
            strafeLeftButton.classList.remove("active");
            
        }
    }, false);
    forwardButton.addEventListener("touchend", function(e) {
        keyEvent("w", "keyup");
        keyEvent("d", "keyup");
        keyEvent("a", "keyup");
        strafeRightButton.classList.remove("active");
        strafeLeftButton.classList.remove("active");
        strafeRightButton.classList.add("hide");
        strafeLeftButton.classList.add("hide");
        forwardButton.classList.remove("active");

        startTouchX = null;
    }, false);
    strafeRightButton.classList.add("hide");
    strafeLeftButton.classList.add("hide");
    document.body.appendChild(forwardButton);
    
    
    let rightButton = createTouchButton("rightButton", "inGame");
    rightButton.style.cssText = "left:24vh;bottom:12vh;"
    rightButton.addEventListener("touchstart", function(e){keyEvent("d", "keydown")}, false);
    rightButton.addEventListener("touchend", function(e){keyEvent("d", "keyup")}, false);
    document.body.appendChild(rightButton);
    let leftButton = createTouchButton("leftButton", "inGame");
    leftButton.style.cssText = "left: 4vh; bottom:12vh;"
    leftButton.addEventListener("touchstart", function(e){keyEvent("a", "keydown")}, false);
    leftButton.addEventListener("touchend", function(e){keyEvent("a", "keyup")}, false);
    document.body.appendChild(leftButton);
    let backButton = createTouchButton("backButton", "inGame");
    backButton.style.cssText = "left:14vh;bottom:2vh;"
    backButton.addEventListener("touchstart", function(e){keyEvent("s", "keydown")}, false);
    backButton.addEventListener("touchend", function(e){keyEvent("s", "keyup")}, false);
    document.body.appendChild(backButton);
    let jumpButton = createTouchButton("jumpButton", "inGame");
    jumpButton.style.cssText = "right:20vh;bottom:20vh;"
    jumpButton.addEventListener("touchstart", function(e){keyEvent(" ", "keydown")}, false);
    jumpButton.addEventListener("touchend", function(e){keyEvent(" ", "keyup")}, false);
    document.body.appendChild(jumpButton);
    
    let crouchButton = createTouchButton("crouchButton", "inGame");
    crouchButton.style.cssText = "left:14vh;bottom:12vh;"
    crouchButton.addEventListener("touchstart", function(e){
        keyEvent("shift", "keydown")
        window.crouchLock = window.crouchLock ? null : false
        crouchTimer = setTimeout(function(e) {
            window.crouchLock = (window.crouchLock != null);
            crouchButton.classList.toggle('active');
        }, 1000);
    }, false);

    crouchButton.addEventListener("touchend", function(e) {
        if(!window.crouchLock) {
            keyEvent("shift", "keyup")
            crouchButton.classList.remove('active');
            window.crouchLock = false
        }
        clearTimeout(crouchTimer);
    }, false);
    document.body.appendChild(crouchButton);
    let inventoryButton = createTouchButton("inventoryButton", "inGame");
	inventoryButton.classList.add("smallMobileControl");
    inventoryButton.style.cssText = "right:19.5vh;bottom:0vh;"
    inventoryButton.addEventListener("touchstart", function(e){keyEvent("e", "keydown")}, false);
    inventoryButton.addEventListener("touchend", function(e){keyEvent("e", "keyup")}, false);
    document.body.appendChild(inventoryButton);
    let exitButton = createTouchButton("exitButton", "inMenu");
	exitButton.classList.add("smallMobileControl");
    exitButton.style.cssText = "top: 0.5vh; margin: auto; left: 1vh; right:8vh;"
    exitButton.addEventListener("touchstart", function(e){keyEvent("`", "keydown")}, false);
    exitButton.addEventListener("touchend", function(e){keyEvent("`", "keyup")}, false);
    document.body.appendChild(exitButton);
    // input for keyboard button
    let hiddenInput = document.createElement('input', true);
    hiddenInput.id = "hiddenInput"
    hiddenInput.classList.add("inMenu")
    // We are hiding the text input behind button because opacity was causing problems.
    hiddenInput.style.cssText = "position:absolute;top: 0vh; margin: auto; left: 8vh; right:0vh;font-size:20px;z-index:-10;color: transparent;text-shadow: 0 0 0 black;";
    hiddenInput.value = " " //Allows delete to be detected before input is changed
    hiddenInput.addEventListener("input", function(e) {
        let inputData = e.data ?? "delete"; // backspace makes null
        window.lastKey = inputData
        hiddenInput.value = " "; // We need a character to detect deleting
        if(window.keyboardFix) {
            if(e.inputType == 'insertText') {
                let isShift = (inputData.toLowerCase() != inputData);
                if(isShift) {
                    keyEvent("shift", "keydown")
                    keyEvent(inputData, "keydown");
                    keyEvent(inputData, "keyup");
                    keyEvent("shift", "keyup")
                } else {
                    keyEvent(inputData, "keydown");
                    keyEvent(inputData, "keyup");
                }
            } else if (e.inputType == 'deleteContentForward' || e.inputType == 'deleteContentBackward') {
                keyEvent("backspace", "keydown")
                keyEvent("backspace", "keyup")
            }
        }
    }, false);
    hiddenInput.addEventListener("keydown", function(e) {
        if(!(e.key && e.keyCode && e.which) && !window.keyboardFix) {
        	console.warn("Switching from keydown to input events due to invalid KeyboardEvent. Some functionality will be lost.")
            window.keyboardFix = true;
            if(window.lastKey) {
            	keyEvent(window.lastKey, "keydown")
            	keyEvent(window.lastKey, "keyup")
            }
        }
    }, false);
    document.body.appendChild(hiddenInput);
    let keyboardButton = createTouchButton("keyboardButton", "inMenu");
	keyboardButton.classList.add("smallMobileControl");
    keyboardButton.style.cssText = "top: 0.5vh; margin: auto; left: 6vh; right:0vh;"
    keyboardButton.addEventListener("touchstart", function(e){e.preventDefault();hiddenInput.blur()}, false);
    keyboardButton.addEventListener("touchend", function(e){e.preventDefault();toggleKeyboard()}, false);
    document.body.appendChild(keyboardButton);
    let placeButton = createTouchButton("placeButton", "inGame");
    placeButton.style.cssText = "right:6vh;bottom:37vh;"
    placeButton.addEventListener("touchstart", function(e){mouseEvent(2, "mousedown", canvas)}, false);
    placeButton.addEventListener("touchend", function(e){mouseEvent(2, "mouseup", canvas)}, false);
    document.body.appendChild(placeButton);
    let breakButton = createTouchButton("breakButton", "inGame");
    breakButton.style.cssText = "right:19vh;bottom:41vh;"
    breakButton.addEventListener("touchstart", function(e){mouseEvent(0, "mousedown", canvas)}, false);
    breakButton.addEventListener("touchend", function(e){mouseEvent(0, "mouseup", canvas)}, false);
    document.body.appendChild(breakButton);
    let selectButton = createTouchButton("selectButton", "inGame");
    selectButton.style.cssText = "right:6vh;bottom:49vh;"
    selectButton.addEventListener("touchstart", function(e){mouseEvent(1, "mousedown", canvas)}, false);
    selectButton.addEventListener("touchend", function(e){mouseEvent(1, "mouseup", canvas)}, false);
    document.body.appendChild(selectButton);
    let scrollUpButton = createTouchButton("scrollUpButton", "inGame");
	scrollUpButton.classList.add("smallMobileControl");
    scrollUpButton.style.cssText = "right:6.6vh;bottom:0vh;"
    scrollUpButton.addEventListener("touchstart", function(e){wheelEvent(canvas, -10)}, false);
    document.body.appendChild(scrollUpButton);
    let scrollDownButton = createTouchButton("scrollDownButton", "inGame");
	scrollDownButton.classList.add("smallMobileControl");
    scrollDownButton.style.cssText = "right:25.8vh;bottom:0vh;"
    scrollDownButton.addEventListener("touchstart", function(e){wheelEvent(canvas, 10)}, false);
    document.body.appendChild(scrollDownButton);
    let throwButton = createTouchButton("throwButton", "inGame");
	throwButton.classList.add("smallMobileControl");
    throwButton.style.cssText = "right:13vh;bottom:0vh;"
    throwButton.addEventListener("touchstart", function(e){keyEvent("q", "keydown")}, false);
    throwButton.addEventListener("touchend", function(e){keyEvent("q", "keyup")}, false);
    document.body.appendChild(throwButton);
    let sprintButton = createTouchButton("sprintButton", "inGame");
    sprintButton.style.cssText = "right:19vh;bottom:53vh;"
    sprintButton.addEventListener("touchstart", function(e) {
        keyEvent("r", "keydown");
        window.sprintLock = window.sprintLock ? null : false
        sprintTimer = setTimeout(function(e) {
            window.sprintLock = (window.sprintLock != null);
            sprintButton.classList.toggle('active');
        }, 1000);
    }, false);

    sprintButton.addEventListener("touchend", function(e) {
        if(!window.sprintLock) {
            keyEvent("r", "keyup");
            sprintButton.classList.remove('active');
            window.sprintLock = false
        }
        clearTimeout(sprintTimer);
    }, false);
    document.body.appendChild(sprintButton);
    let pauseButton = createTouchButton("pauseButton", "inGame");
	pauseButton.classList.add("smallMobileControl");
    pauseButton.style.cssText = "top: 0.5vh; margin: auto; left: 0vh; right: 0vh;"
    pauseButton.addEventListener("touchstart", function(e){keyEvent("`", "keydown")}, false);
    pauseButton.addEventListener("touchend", function(e){keyEvent("`", "keyup")}, false);
    document.body.appendChild(pauseButton);
    let chatButton = createTouchButton("chatButton", "inGame");
	chatButton.classList.add("smallMobileControl");
    chatButton.style.cssText = "top: 0.5vh; margin: auto; left: 0vh; right: 14vh;"
    chatButton.addEventListener("touchstart", function(e){keyEvent("t", "keydown")}, false);
    document.body.appendChild(chatButton);
    let perspectiveButton = createTouchButton("perspectiveButton", "inGame");
	perspectiveButton.classList.add("smallMobileControl");
    perspectiveButton.style.cssText = "top: 0.5vh; margin: auto; left: 0vh; right: 28vh;"
    perspectiveButton.addEventListener("touchstart", function(e) {
        keyEvent("f", "keydown");
        keyEvent("5", "keydown");
    }, false);
    perspectiveButton.addEventListener("touchend", function(e) {
        keyEvent("f", "keyup");
        keyEvent("5", "keyup");
    }, false);
    document.body.appendChild(perspectiveButton);
    let screenshotButton = createTouchButton("screenshotButton", "inGame");
	screenshotButton.classList.add("smallMobileControl");
    screenshotButton.style.cssText = "top: 0.5vh; margin: auto; left: 28vh; right: 0vh;"
    screenshotButton.addEventListener("touchstart", function(e) {
        keyEvent("f", "keydown");
        keyEvent("2", "keydown");
    }, false);
    screenshotButton.addEventListener("touchend", function(e) {
        keyEvent("f", "keyup");
        keyEvent("2", "keyup");
    }, false);
    document.body.appendChild(screenshotButton);
    let coordinatesButton = createTouchButton("coordinatesButton", "inGame");
	coordinatesButton.classList.add("smallMobileControl");
    coordinatesButton.style.cssText = "top: 0.5vh; margin: auto; left: 14vh; right: 0vh;"
    coordinatesButton.addEventListener("touchstart", function(e) {
        keyEvent("f", "keydown");
        keyEvent("3", "keydown");
    }, false);
    coordinatesButton.addEventListener("touchend", function(e) {
        keyEvent("f", "keyup");
        keyEvent("3", "keyup");
    }, false);
    document.body.appendChild(coordinatesButton);
}
// CSS for touch screen buttons, along with fixing iOS's issues with 100vh ignoring the naviagtion bar, and actually disabling zoom because safari ignores user-scalable=no :(
let customStyle = document.createElement("style");
customStyle.textContent = `
    .mobileControl {
        position: absolute; 
        width: 9vh;
        height: 9vh;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        padding:0px;
        background-color: transparent;
        box-sizing: content-box;
        image-rendering: pixelated;
        background-size: cover;
        outline:none;
        box-shadow: none;
        border: none;
		margin: 1vh;
        opacity: 0.5;
    }
    .mobileControl:active {
        opacity: 0.75;
    }
	.strafeSize {
      width: 7.5vh;
      height: 7.5vh;
    }
    .smallMobileControl {
      width: 6vh;
      height: 6vh;
      margin: 1vh 0vh;
    }
    html, body {
        height: -webkit-fill-available !important;
        touch-action: pan-x pan-y;
    }
    .hide {
        display: none;
    }
    #fileUpload {
    	position: absolute;
    	left: 0;
    	right: 100vw;
    	top: 0; 
    	bottom: 100vh;
    	width: 100vw;
    	height: 100vh;
    	background-color:rgba(255,255,255,0.5);
    }
    .strafeRightButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAARRJREFUOE+dk0EORTAQhkci2HAEF3ESJ7Rgyw2cwAEkVhI7QhDJe/n7Mk3R0rxu0M7/dWb841RV9SHDmufZdHTbdwCCoO97a5EaOAwDtW1LEtQ0zQnkui4dx/EKBwTLyfNclAZQFEU0juOjGDHLsshLANr3/QdCWUjRdqnZWoO6rqO6rk93pGkqvx9BV3EQBFK4ritZgbIsEyJVrKajA03TdO8RQCYIgAziPqE0LQh/rSxLLQyQJEkojmN6BeFWE+xaFmKNGXE/dDATSBqSfXQ1mwpTy4KQzXtyNoN0Y8EwiNXfzplbG1Ln9r+c/TY2p2ZjYLnWN6HuXPqoKAryPE/EYDMMQzHRWNu2Sa3v++KdYzkezy+eN1EbyruiHgAAAABJRU5ErkJgggAA");
    }
    .strafeLeftButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAUFJREFUOE+dlDGqhDAQhrMgKhYWHsCLeARP4Lk8hIW9N7CxtbQQrAQLQVFUhPf485gwyWbZfZvGJM58zvz546Oqqh/BxrZtfPnx/EEgEzCO40eQaZpE3/dCggBp21ZLdBxH3Pf9BOP7mHddJ2NegoiA4CAIxL7vVjCqkaCyLKVGqOhVFbYeKRag67p0ECUURaHlJkki4jjW9sIwFMuySH0UCMJCNA7yfV+tj+NQcxP6LxAvhaBZlsntr0FIBoyD1nX904haIwGHYRB1XQveHlUFSJqmAhpRRU8g3gIEN0EEiaJIWQGtaaB5njWfmCCzEvqo5iO0RiBbezYI95E0ZJ7n0pD8+E0/cU2443GF1KlxEJns3W3lcVbQO4DtvRIbFdGv4BsQcuSpAdQ0jWLg3tA4z1NOPc+TT9d11TskY59ifgE9QD9CDm6XPgAAAABJRU5ErkJgggAA");
    }
    .forwardButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IArs4c6QAAAcZJREFUSEulVEuqwkAQ7OAnoujalRfxCJ4gl/ESHsKFa72BJ3AhIiJk60IwKH6ZR43U0JlMiOH1xsx0T1ldU9PRarUy4sX1evW3aq+jxWJher2ePXg4HGoD+AdOp5PsdjuxwEhuNpsCaLPZlPf7bfcHg0Euf7lcROeZPB6P9tMBb7dbB8IiHEQQvKod1O/3+y/wbDYzw+HQMQaz2+1mwTQjMAwxRz1zBM6y7AuMA9CG7bKQDLFeLpd2OZlMXJ0vRRD4fD67ln0J5vO5ZU9ZkiRxqmjwghRkrLWlrmmaynq9ljiOJYoiud/vMh6PZTQaBS8bGj+fz7wUqPTbA9tGoyGtVssCvV4v+Xw+ollrQqXAmgbZdjodt22MkcfjUcoaditcni+Fz5ZO8VnrLp2PtSu0FJotWEJfBL4RYE2H+MA5xijUNtNsAQZd6YwyrStdEdKWbMkca+0QPqzcy/PtRrZgSZuFnrPW+mfgqrmg87CeBg76uA5gqBauKABzVmAIMbrdbm7IcB/W0wOIjvrpgdQdmwAPMtZ28tsEc90JH4vugMDOxxiZfDH/1RjnLfB0OjUhUCT7/X7wf5CDDRHtdtv+4sK4Rv4PfpOwZeVjdiYAAAAASUVORK5CYIIA");
	}
    .rightButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IArs4c6QAAAVhJREFUSEudlT2qhTAQhSOICKK1lRtxCS7PRVjYuwaxtbKyFewURUS4j5PHyNy8/OibKpiZb04mmdFrmuYjDLZtm2nL+d1TwSpsmiYJSdNU0NpGnedZjOMovLquP1EUibZtnSqeOAAKk2As+r53xvm+L67r0volSSKWZZFqX4MRoMIJSN+d4KqqZOY8z0WWZV8qbcoBXtf1txS4FBSdBwAchqE4jsOYQFcTgM/z/AZzRwLTN1sCLug1+EkC+AzDIIIg+KuYLkNVrB6bTlAUhUAMmbbGtlJgD08Nx+aGBBz+L7Dusozgsixlg+BV6BTrVMLPWQoX2FRb/r5R433fZanuy3sKtj03Dr47zwV2NYjahY/Appa2Tau7QbhiOhIFmibZazACqEF0k4yAfKKpIrSKbUqe7t0NglLQ7+RpsMtPjk2Au66Tow7DgxscyOI4lkv4wbgv9yP/HwHyemKMQPbVAAAAAElFTkSuQmCC");
	}
    .leftButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IArs4c6QAAAUdJREFUSEutlTuqhUAMQEcQEUFrt+a6XIa17sDG1sJSsBLsFEVFuJcEMoxhPm8uL5WOycl3YtA0zUcYZN930yfneaCCVdA8z05jncKyLGIcRxFUVYUR933/E4gbAfS+bzs4DEPxPM/LVncGClmWiXVdMVorGAAgHOxKC8AgP5VimibRti0CiqJ4+ZLgsiw/eZ6LYRic0anAOI7FeZ5a8LZtIgAwuIRumoQDSc8ExlLYwCYgB1Pj4PxVCh4xdLeua7SHlE3iFTFBCQhTQRPCHXjVmINt4+UFBpCrFJSFN5ii/Gvz1KyszePp/8u4qaPjckClAJvjOPCCeUVsc6C70riEdBcExitJEmyiLQPdxMjtxsGUFhnptptpddLNM0bsWo3qd+7kFTH9TnyANl253bquk3qQRhRF+A7PXK7rkkdpmqIO6QOQ5AuINXqeGbRlFgAAAABJRU5ErkJgggAA");
    }
    .backButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IArs4c6QAAAXtJREFUSEuVlT3KhEAMhiMsKgt6BC/iETyB59pDWFjrDWxsLSwFK8FCUFZ2RdiPCBky+ca/wBbjxGfeeROzVp7nPxDxfr/lo9trC8F7oK7rbgP7voemacBK03RTXFXVbYjpBYRiKHBd17Cuq8r1fR/meYbn8wnjOGqMx+OhcjGP7yN4WRazYp6MEAx+KK45nK81MHqJ3pyFhJ1aIcFJkpydoe3HcazWmscmsOu6l+CfzweM4NfrtXUFt6JtWyiKAo7g6Dn+wjCEIAiU56h4miawCDwMg1YgtIPACKAi8mtItbiniscV8+KcqUYoqeWHGcHSVK5a7km1JEoVz+QxQfZUm9ReBlOiSbXJWw7Wise7gn95UvWet3TLf11x9OVx1Sa1XMguGK8kBw8OmSzLNlFRFAGCKAh66vHecKEJxqGHs+KoK64MHQm/1G7yJf71yTHKi7cNelRMfyeXps7FpA1clqVKx+nP4/v9bkvP87Tn2KsUjuOAbdtqjXt/DvSA6WCSwboAAAAASUVORK5CYIIA");
    }
    .jumpButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAARlJREFUOE+dlD2KhVAMhSMIWrkx1+CqXISFtS7C1sLSVrAQFEVFmOFcyH25eXNVJpWS+OXkz6Cu6x8Stq6rfH39HEjQX5BhGG5h4zhS3/cUlGVpFLVt+yp7GIZ0XZeNBQTmgJIkoW3bjEMGywwcw36AzvN0QTrbPM9UVZXhpGlKgGgDaFmWD6jrOkcFQ+I4Nt/u++7AOOkXSPZIQ1AGPtQwJHBAmAy6D9MQXYqGOT2SoKIoiMvxjRGwLMtMKywoz3MzflakQVyWhGqQGb8G/ac0BzRNk52aD3bbbK2IS3gaP8fZqWmQXMq7hfzaI5+ip8PDliPRK0USBgVs+mjNiUAR/wqeVPj8FtQ0jY3BJcOO4/ByoyiyPo77BUACR9z5EdScAAAAAElFTkSuQmCC");
    }
    .crouchButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAASVJREFUOE+dlDsKhEAMhkcQtPJiVh7AU3kCKwsLKz2ErYWlrWAhKIqKsEsCmc08fLB/pSR++ZPM6FRV9RFMy7Lw19fPDgfZIH3f38KGYRBd1wknz3N01DTNq+qu64rzPGUuQEAKKAgCsa4rBngyr0A5FAfQcRwqSK82TZMoyxI5YRgKgOgC0DzPP1DbtooLgvi+j99u26bAqKgB4jPikCiK0EmapgYMCigg2AxMH6RDeCtFURgwZUYclGWZgHbAiU0Ei+MYRyFBSZLg+smRDoK2wCXJBsL166B/WlNA4zjKrdlgtvkow9YdUQtP66c8uTUdxA/l3YE0ztGVo6eLR0t45YjDwAFJv7R4RcAR/QqeXFzFJaiua5kDNxm07/sl1/M8GaO8L0fuVtxHFTIkAAAAAElFTkSuQmCC");
    }
    .crouchButton:active {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAStJREFUOE+dlLGKhEAMhiOICqKdYGthaetL2GhlNQ9nZWFh5YtZiIKwRwLJjXHc3bu/WZnJfPknyazXtu0LACAMQ/whHcch3/qD44IgkK26rsFDUJIkjwc/bRRFAVmW/YJw4Rv5vg/neUooQlDiCEFpmsK2bbRhB9sJOIb3nSCdbV1XWJaFOE3TUCKtG6gsy4sLhkRRRGf3fb/AOKnTEWezIV3XkZNhGG4wjBeQMYbaz8XWEPsq8zzfYI+gcRwBr4NOXGKYMYZKIaC+7184XOxIg/Ba6JLlAuV5Dp4G/edqBOLJtrvmgrnqgy6rqroPpF2TT+3n2EeQPZTvBpLjBKRr9M17wxhugoD0HOlnwmBcZ9nv8ALiv4J3brAzWnEcy5I3TRNN9l9lQ/DsD7Mvyc0ay6bsAAAAAElFTkSuQmCC");
    }
    .inventoryButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAedJREFUOE+tlM1OwkAQx6elTYiCkSMnvKAX38KLr+DRm69hfAIP3jwbE24ceA4+TDBpCMWEFGgMBCgBUlrzXzLLLsVYo3NpOjv72/987Bq1Wi2mf7AgCATFYOB0OiXTNCV6s9mQYRiUyWSkbzKZHDx6uVyS7/vU7Xa3wPl8Ts1mkxgSx7EAAQhfFEUaHH7ECEWGIb6u6+4UAliv16VCAMIwJMuyxAb8Q72qdl8q1MmUkW6j0dCAgADAZYAiVoON+OeD4O/1erpCABEAs237YK14nRcBRUlg/X6f1uv1toYodrvdFikiVQ7CBiiEArVhh05DyhLY6XRoNBpJIMAMTTtRCeBwOCQ057h8KRiB80a5XC61DzXUFAIYF8/o/u6W3t0Penh8ovJJNuErZU2yS+eJOMdxdk1Bygy8ub4iz/+k55dXCfzJd3F6JIZaU+h5Hi0WC/IiS5xUNEMqFAo0Ho81Xz6fp9lspvlQGplypVKJB4MBAci3I20j1DipUAWqQ4yZ+24ecfD+FCSAqKFq2MSDrN5bvi081BgxWAKIOVSvFwYcm9W7zI+BGsfXL1FDBvImfgiQGgNYKWfCzxti8NqgWQbXEO9ZGuMUkcF+UySw1WqJGvzFMIOr1WqrsFqtaiws/sYAYvsC6d7MZCUlFo0AAAAASUVORK5CYIIA");
    }
    .chatButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAh5JREFUOE99lN8vA0EQx2fjkYY3HvB/8V4kEg8SBJUGVVJU4rfeVRO01bpIT8VviYjEq2tF678g5ZGVmbm9Hy02l9zd7MxnZ747u+Lhsig7OrtBDQkS8BFCkAn/BQiQUrILmvHTfqOfeXEDAkE4397Z5TqQn/BBmMtwtQACTy5vQU8kQTxcFSmJSqncsKAT4AGohBQwrqcBpHQzUiDlUB/gpFL3QSAsX5WGIBUcHJn4K47sWmyONERN4toBfftA6ISQz9q7q4ONRM2UiM2BVtAW50izFT3N2t9fmKTRa7lMhr7REIF2tExDVv3BXtqAlkAbJGIRml9JZmhjxN1ZgXatalk0MTAehs/am73DvHOubrxrmNH2/DSDUjkW+7ZokGfFYo0GQ9PwUXuDhJb9Vaf+YA80B9pgPRIm/9W9QwZdF3LYflCxShQ4FI4QSPWRl6ZsWNrqTIgkW9vPc2nnRtbOiEHDs/P/gNBDUGnxqXHqz80Dg97iNLcvsWtfnrghv7+/YGxhmWA4cPX6sTQ5xtpJgK3DY8B4YWZSEvsANcJRD4mODjeAmiiSu2EnbzKokN6l81gpPVPARCzuBP4GoeKwGe1DnDwy+UwqULWMIHe7fSeepXFuBVUWmvWjAouNIDS8WJyRs6K6PjzXinOVeIr1ZJSSj6UqGHmDU8SC7R70/3NrqnnVqM51oy9FZXRDd7Oxa+C7y9/ZXKGnfI9WP7ZEKinpenUjAAAAAElFTkSuQmCC");
    }
    .pauseButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAjJJREFUOE9lVO1qE1EQnXkK+6P6FP7oI/gMraIoFIMr1WL9aNEfRWNtS1Li1ti6aYr5sEkXyRrRRC2IFNqCgptIE5/myszcO7tbLwuZPTv3zJmTOxcP+10zMXkB3DJggB5EZIjeERCMMZJCMIX2l/Ki3jdAIqLv5ybPJwmchxkS4RVyV4AIP/QPINiuAB5+6bKI0WD4X0HdkCJwghxhIWgAGJMockQu4ewGlXImYCJq37VGROn2RU3WlqQvwx7S98KbOscZIpc4ffOW7mm+3uRYMHFZMImLQUOiH72IPfo7HKqCmdxtNbRZ9jmeyXm8kZIdRnix0uQ/Br9/6nAH4zhWsy97c7YeQt3f4PiKd0dV1vwNjYvVlph90A2ZaBSLR7Suzt21McJuqUB5cE0xgN1SkTHKL73dE6KvnRZDo3igVa7P39NztFNYZ/zG/IK2y5j9Z17W2tLa5/CdVWSJEGB24YESba++YILZ+4TRQthaW9HD+6oeMil+bNUMndrT3/ZAIkLu4aJWLz/Pc5x7tKhE5ZU8m05Pee890H6MmlVD54A8cstbeqxm+8+WGfaWnujI+E+XtbWtdiREncYOz+No8EeEI0Lv+KcoMgYuTV3kuH/ySwsR5oa4sh9JAUc0HhKRnBNxIjXxAuit4NoiONjviNlERMBpLIqcKr0+UteKXiWaCZBSVDVHgzGE7VAkUsN2yLLvotV9zyinfcF63uQ3g0SN7UEmKWlV1abbp8G1F94/2dEyKXciad8AAAAASUVORK5CYIIA");
    }
    .exitButton {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAiBJREFUOE99U11rE1EQnfsvFKwg/QkK+iaIio+KJNAnbUQoRaGgf0NRTFPU3TTJBjfdTZpN/aJtUHwU8anJJlH/y8o5c+92k1bnJXvn48yZMxNzmETZ2aXzQjMikunn6YYgkuZtb/+LGAAZY+TMuaX/IfwzBpBWMxAzHMQZaEyPxkw+rWeRpCPteFWDWIdRRiITC+Qm1KgRybJ5cOtzFKtBxO5mOIiyLBOZjca5RqXVCvPiRl01QYKIlCsVFu1sw6/p1VbEhgSCa3I0IoHSfQVxFtsigBfJRNt1BXKjHfQ77DcbpQyUKw9yEBSiCSkXDP6O7zN/sx3raJ97IcWejVOOEO1/lX4cHoMVFuDg7pRWpHzrGnO2gq6O+SFqM06NrPWG3wi2eFZ43y6tyN3rV/PcN+GuAu2FDTL/lU7owI6MGLm3vk6NcWMa0O01a5vHQxoRrzPQmt22bxkpEOpWHz2eE9aBoSNg69VXtomIFw1Uo27zbc4IHw83NsjCCax6z7/R2Xv5gmD13nslsONvcSe/0ykDa0+f6N3YYggLS7qhOye+Xz97zt9G/yNZmtCrZSjC+mEH33/mWwPIzSuXyO5wwX/j8kWOHySflFHo16jRdKQawVAEQ7JOpqOd9Iu0yMiIeefV+F+bjSe5gAv3d0L4on5kZOxoP9I/kvSTvDM6uCPiai0j+ItvsnU+PJYvLOteYfZ89WqKiZrg/LkONucvWvgqB/7CAfgAAAAASUVORK5CYIIA");
    }
    .keyboardButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAfdJREFUOE+VVN1KG0EU/ubait7ZC9un6IXP4BvU9qJQJFhsEUGpPkAsWJL+xEjMxhRjEhMXyRqx2lYoRfCmF81uyca3UGKvp5xzZpJsFI3Lwjkz88035+ebUafHdf1w/DHsp6FBv1KKp2isoKC1FghNk2ss4byjH1BEROtj44+6AMapCInwCrk9gAj3j0/gbOSgTr/VOYjQ9yPAzo47nIRTBLTuRhT6waB7IzgmovRtakTEaRO7orR4cKefyG4zJkLUPcpWU6rRrc11P+kUBfHryOMatYIAz2Ze96VnOmXaZTtoi11aTyGZK3Fj1M/DGqPPGw08n53D0PAI/rUv2V61L/BgePTamPCEKaQ+IJmvSAlO6i4TtfwAL97MRyLiUI0UIm03c18+JvBpa0eIvtcqJD+EDR8v5xeQyZYQm5661RIpYXKJVXwuVCW1r26ZjyWi2OJbo2UR5E1RWDkSIrP6Dultl3uhDioFTapt/gnwamkZmWwZsemnbG/67BrZ9Eoc6zt7oP3KK+U16SBsBDg8+30vUU5OPEGm6glRrbjJ9zH0/0phSYzmgg7i53Y9uZP9RJ3bLe0SPd7iO7s1KTYREa5JEfXqb8AkeyLK6zO/BbfqSoiUsCGMjkVVdr1XY4xz3sd1fM3pnC9tN5vMm9QbnH2n+uv5HyQVKCmWNUnHAAAAAElFTkSuQmCC");
    }
    .placeButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAd5JREFUOE+tlMlqQkEQRfs5gAv10xwQEf1Fd4J+h8PChYi6EKeNOCvqC6fltv2ISQxJgQjd1afq1vCCVqsVmn+w/X5vKYGAm83GxGIxh77dbiYIAhOPx93Zer1+Gfp0OpnVamVGo9EDuNvtTLfbNYKEYWhBADm73+8ROOf42IyCwP6Px+NnhgDb7bbLEMD1ejWJRMI+kJxsNvtlccjOSUZup9OJAIGS5eFwMM1m0zpXKhUHJEN8KBNBJ5NJNEOAOGDJZNI9JBjAVCpl8vl8JEOglASbTqfmcrk8akix+/2+lYhUOfHgeDxaIHflcvlbyQ44HA7Ncrl0QB4L6mdYLBbfBy4WC+tMg3xLp9MOTq2oqW+ZTMZ2nBpGMgQITA3QI78Rr+5rtZoNOBgMnk1Bsg+kATK/EQLqnnqXSiXbacYmkuFsNrOpMyr86Di1ZAtoDIZ8bQ9Zabi5c5Lr9Xo4n88NQG2HXyM1hbNqtfpzU3ygdllDyzwK6I8NgTUFiuAkC6guy0Gyt9utG+xCoeB2V0NNIOwTkDnESctOwTUm2pRcLmfPfD+t36caCkg0/7Ol4vtfGKnwG8TXBjWBJPM9e8ckEQW+IdkBe72ercFfjBk8n8+PDBuNRoTF5W8MkOwDqQTfZInxo/8AAAAASUVORK5CYIIA");
    }
    .breakButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAeRJREFUOE+tlMmKAjEURVMO4EL9MZcKKn6iO0G/w2HhQkRdiNNCcVbUak7kplNlNU1DP6iFMXXq3vvyEnQ6ndD8Q51OJ0sJBNzv9yaVSjn08/k0QRCYdDrt1na7XeKnr9er2Ww2ZjKZvIHH49H0+30jSBiGFgSQtdfrFYGzfjgcHLxQKJjpdPqtEGC323UKATweD5PJZCyI36iXWty0220HrNfrVp2zzIZerxcBAgGgGFANnI8Dy+VyFoDdarVqZrNZVCFAIFQ2m03MSsoEwwVPuVw28/nc3O/3d4aEPRwOrUU2kBuFKhQmKZM67FJYdsDxeGzW67UFbrdbu6FYLDqVcWVxWCJwtVq5fNhQKpVMPp//yEw2a7Wa+yBOyDCi0AeSEWEDpQEo55GySqXiOk7jiGg0Gn03BcsAdb7URaBqgN9R5eufhI8MF4uFbcLlcokcC/nS8dD0oIr9Kme52WyGy+XSANR0xJsATN1MPE9+l33g+Xy2+5Ms+1Dl5sOdZQHJUeMUbwovak1KsYttNetHoF6kk+TlqwbMmGkM+a05/8jQV8jGRqNhHSl8ZpjibKr8BnHbcAMFssx9RjNU/qT4WckiBzyeoQMOBgN3/fzUxd/WmZLb7fZW2Gq1Ivv58y8FSPUFhmoAc4SumvkAAAAASUVORK5CYIIA");
    }
    .selectButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAcRJREFUOE+tlMuuAUEQhqsZCWJ4KAsLL0pG4pKQWHgHzMJK2LlFIm5BMCd/SbXumRGccyoRme7O13/VX9Wq0+kE9A9xOByYogS43W4pkUho9O12I6UUJZNJvbbZbGKvPp1OtFqtaDKZPID7/Z6GwyEJJAgCBgGItfv9bsGxjjOsSCn+n06nT4UA9vt98jxPKyiXy9Rutz/6xtn1ev0EIt3BYEC1Wo3S6TRvFItF6vV6dL1eyXEc/Y09rJVKJd5HuhEgFAIohf3Uo263y3ABXi6XRw1R7NFoRJVKhdXg9mw2y3WCUaiTaZhciMwkkLIGjsdjWi6XDETKSDefz78VWq/XrZQt4GKxoGq1qoG5XM5qIXFUlEI1ah6bMhQCiFpKZDIZqwexjvYBAC2FX7PZ1Apns9nTZQG+UhiXO+prmhipIW5AH0oNXddlg9AWpikyPWj4RqMRraHnecF8PicBisu/NsUEHo9Hq4apVCrWadQPCmNdFmDY5UKhwCYgzLmV2cXabreL9qEAw32IKUCYYxc3hubocR+GgYB88zDIebgMxRqI98wcpbdjEjpgAX3f58fxL4F0z+fzQ2Gr1bJY2PwmAJL4ASn3ymSCH/2UAAAAAElFTkSuQmCC");
    }
    .scrollUpButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAfhJREFUOE+tlL1OAkEUhe8sUAkklHQ2dj6Q0crEwsTCWFlZGJ/Aws7amNBR8Bz8mKBBwmJClp+YEGAJkIU1Z8gZdlnWaPQ27A53vnvO3TujSqWSL/8QrutqiiJwNBqJZVkGvVwuRSkliUTCrA2Hw52lZ7OZDAYDabVaa+BkMpFqtSqE+L6vQQBibbVaheBYR45WpJT+tW17oxDAcrlsFALgeZ4kk0m9Ae9QH1S7LRXqjGXYrVQqISAgAACEgox0Oq0foZCFULTdbocVAogERCqVCglAwb2DQ73mNl4kCEVLEJ1ORxaLxbqHaHa9XtcWYZVJUAGF+IIA3p6fysnVteQtT7LZbKgoLBtgs9mUfr8v4/E4doAIRMIuaATY6/XEz+9/O5FQ+Gp/6Jy7+wetNJPJ6H6ihyGFBGITg5u3qziDT730+PSsoehpo9HYfBRYJvD97TVW5c3lheyCoc8Ry47jyHQ6jYU5q6ScHR9FlHGDsVwoFPxutysA8nRsUzE2BNJm7FcOAnmWObScRwJRCD3L5XJmtFjcWCYQPQwG1HLQg+NEZSiKecXsIiJAzCGSeNgx4HgOnmVs5MXAPB6/SA8J5CZeBFDBQrxh6ITXG3Jw28CJomXcZz8JWoSDYMCyAdZqNd2DvwROyXw+XyssFoshFv78TQDE+AI1+8NkGpdDjwAAAABJRU5ErkJgggAA");
    }
    .scrollDownButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAfxJREFUOE+tlMtKY0EQhqtzAdEkuPUBxI0PJO4EF4ILn2AYfItZDLhzBrLLIrjxHXIRIoSQEyGcXBgIuSckOfJ1qPYcY4KD1uZ0OtVf/39XdZt8Ph/IN8RoNLIUo8B+vy+xWMyhl8ulGGMkHo+7uV6v9+HW0+lUut2u1Ov1NXA4HEqpVBKFBEFgQQCZW61WETjz5FhFxtiv53lvCgEWCgWnEMBisZBEImEX8Bv1YbXvpaLOWcZusViMAIEAGI/Hbm0qlXJjFOpGbNpoNKIKAZJAJJNJ+2Wjg+NTOx5VnyQMZA4oR0I0m02Zz+frM+SwK5WKtYhVklAG7PbqQn7+urPATCaztR+w7IC1Wk06nY4DDgYDB3v2XuTPw6MFbgs22gC2222bT4FUGTAC4K4wvmfPMKIQ4Ecwv/tvJ+z3/V85zuxJtVp9KwqWAVIt7PqrhPy4uRaFsWhXnBzub1r2fd9WjVZBKdDL8zPLAXgUW2xlUn1nOZvNBq1WSwDq7dCWUagCP1XlMFDvsjbtZDKxSgkUKpCNtf9UtquyArXKmsAiGp0z1Uin0+7ualPTu8QGkD4kSS87Dc44fJdZqA+D5un12zhDBeoifQiwphvpC6OK9Xkjh9cGN0Yt8559JtQiDsKBZQcsl8v2DL4S3JLZbLZWmMvlIiz+/J8ApPEKFYzOZJBKmFAAAAAASUVORK5CYIIA");
    }
    .throwButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAehJREFUOE+tlLtOAlEQhme5VAK9D2DnG1nZ2VpZG5/Aws7amNBR0PoAFnIxwYQQFhOyXEJCuEOANd/BOeyyG4PRaTZ7Lt/5/5k5xykWi778Q0ynU0NxFDgajSSRSFj0ZrMRx3EkmUzaseFwGHv0YrGQfr8vzWZzB5xMJlKpVEQhvu8bEEDGttttCM44a4wixzFf13X3CgGWSiWrEMB6vZZUKmU28I/6oNpDqaizlrFbLpdDQCAANA0oUjVs5F8PYrzVaoUVAmQBkU6nQwI4kMhkMqFxoKSEaLfbslqtdjkk2bVazVjEqi5iw3w+l5Ozc7NpWn+XXC4XWxgsW2Cj0ZBer2eBgIGiDNjt1aWBXFzfyGliHQuNALvdbuhkChWEfbifZv7u/sFAs9msXY8TchhSqEAmadI4mBIUSk4pHG7q9fq+KFgGSLXG4/GPsDgonRCx7HmezGazo2BAvf5AHp+ejX2UWsv5fN7vdDqCyqDNl9e32GoeDip0MBjschgEetvUUZDDRaiMAA+rTLK10YP3Vm+LNjUtRtgcqkL6MHi9aHA2B++yuavfD4OC9fpFcqhA3aQPAS2hB6lStazPG2t4begQm0Pes2NCLeIgGFi2wGq1anLwl6DCy+Vyp7BQKIRYTP4mAGl8AUQGwWSM9G4HAAAAAElFTkSuQmCC");
    }
    .sprintButton {
		background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAd1JREFUOE+tlEmKAkEQRSMdwIV6MbeKeEKVciXoORwWLkTUhThtxAFnq/lh/zSzyoaW7gCxDCtf/JjStNvtUP7BDoeDUgyB2+1WEomERd/vdzHGSDKZtL7NZvM29Ol0kvV6LePx+Anc7/fS6/WEkDAMFQQgfI/Hw4PDj3dUkTH6PZlMXgoB7HQ6ViEAt9tNUqmUHsBvqHfVRqVCnU0Z6Xa7XQ8ICAAsAxRRDQ7iNwPBP51OfYUA4gXY8Xi0AvL5vD4jKC2bzeojoCgJbDabyeVyedYQxR4MBpoiUq3VavZwoVAQAOr1uudjIDqRsgWORiNZrVYeMJPJ6LvoYKVSkWq1Kq4PgVxoDLhcLq0CNKnVaikAivEpFovSaDRi0Fwup6mjhp5CAlls1JFQKi2VShIEgReIJRkOh6+mIGUA0a10Oi3X61V2u11MZblc1lq+Sz2W8nw+V+kYFTdlqvsJxo7blIMgCBeLhQDI7Yg24KOmuEAO8bsRQRBatMPw25QJjHaZh9lFlIGGceFQY3bfAjGH7nphVNAkd5d1V78vBq4h1y9WQwJ5iBcBVouBeMNQKa83vIPbBpNhmDLus98YU0QGrqGGFtjv97WofzFsyfl8fipsNpseC39+YgDRvgDSDetkcdqdJgAAAABJRU5ErkJgggAA");
    }
    .perspectiveButton {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAgxJREFUOE+VlM9L40AUx9+cF8Gbe1D/ld5F6FXv1h8gHirtaltXXGvU1o2g7ura1IJat61haaz4W7AieE6y2P4ZwrLnkfemM0lNl7JDIJnJy+d93zdvhj1d1/jH/kGQgwMHvBhjtIRzBgw45yIEl/Gxdcc46+oOGILwfV//gBdAcawNIrgCLhMg8Oz6Hoz9PLCnmxqJaDiuCvqfB90oAnDuKfKDIrEEsXJZrSuTQFi+LK3puKr0sVgC/v55hQ89vQpkZDW/NcoqPXdMfipQw3GUg5FYEkKhkILU63XIZVeCTgODTaMoEjxeWeRR0/U8Go+nCHRxbsHQcBgQ9H7sZ9K0tJk/oR/DHi6q9Neatq1iJ+cXQdd3wbJKChYOj8BEZJRisOS91SUBKpSF2fc1k0AN21V1T6eWCCRHNDoVULSTXqT4rcOSAN1Wy9h+QB61Gm3mczrg0daXVFsjyqzbRxVR2qX5s6XIUd0aXV4NKNIX5gNdjbDvxyats/PyEceufbFdlTG2kiEQliTv2WS8o6Ld0i/A75l1UuDYB+iRLO3T2lfliQStz812BP2oWAJULR7Qfmw4vwOGJjK6UqTFox27PH9qiT3ZDSS//hfIOK0KsxGEwS92UFHXjQYAPkUF/uw0wayYQiIW3Dp62ue0AdR7MfMdN8aGxrVvhkqOMsVx5gX5lclziiDMO/DeAFwyISmrQZieAAAAAElFTkSuQmCC");
    }
    .screenshotButton {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAcdJREFUOE+llE1LAkEYx585R3Ssg/WVvEbn3g7RoVBRRJFMS0vBsFLXhHzJlyXcjNJKiBA67264+zUiOk88M+64WxAsLgs7M/vMb/7Pf2YeMhr06JJnBayHAgV8CSFsCPsECFBKeQgOY3PyxTil/wIEQfh/0bM8DWBxxAHhXA63FkDg3WAIUrEMZPTUYyIMTRdBbhoZqQ5A6VTRTCBM30rN1HSR+rovJERJ6YTdkt8WQaZUY34KkKFpzIMNXwi+vz4FaG5+AUrphNNhGy4r1flCb32FeWTqOmz6w27sgWIqDtlyg20MeX3osl0zVRW2g1GHGotaKDXEAlsba6yNSi+TMchWWtzsYU9mIEPVYSccYyBrIk7CtqI0BcjrXQUcR1A+HoXcdZODnrstPH6AHu1G4n8U/QfKxcJwVm3z1B7lm4kiDfYOkq5AmUgQzmsyO6fkvlWleGrHqg6+w5Qrj9IhP1w0bwHnE6VRoXgO0KPA0amrXTsO7EOhrXBQt37F7qOhfbiCWMHljsLv5KwgqdPlZiMI6WN1ZkUV+q6ZILdlLhETnpQeZ59dAPGf92zlRjpJ0EReEv6gTF7OpkF286w6xSBkWvB+AJ1TDClYPe7/AAAAAElFTkSuQmCC");
    }
    .coordinatesButton {
        background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAeZJREFUOE+VlF1LAkEUhs9cR3RZF9avqyiILgwtxRBJttJawT7NNaHS0pZwM/oOIoKud1fSvxHR9cQ544y7rmANgvNx5pn3vHtm2PtDk0+EpkA2DhzwxxijKRwzYMA5FyE4jd3uP8ZZ98/AEITr46HJXgDFMR9EcAVcHoDA64cXMI5KwN4fmySi7bgq6D8d3agAcN5TNAw0E4krfjGrqT6BMH2ZWsdxvan7rJiOxOHn+4s2j4yOAYKkVXrxjPxUoLbjBJ0EBqjEC8E+wrAhMGdUhIC3e4s86riDPZqNJnwgBEjYUSYNuVKVPgx7vW3QV+vY9kCP52JJBZIBhWIVwuF5OFxPQa5cE2a/NE0CtW23v0RgIZFSENwsG0J200mKz59cCNBTo4blB+SRp9AWk2kfBDfLlk8lVEHunNZFanfmeVeRoxbDa+sBiL4aC1Q1Sto/M2me3dROOVbtp+2SooiWCUCy8ehACMYfXFwB7mdWtcyxDtCj5Y3tAGRzZcmXcr+RhbolQI3KMd3HttOCeEYHXT8gK9ATLRoeeltKl5a4k/0gufMvEIw1LhvCbAThxKfdGnr6oACPojL/cDpg1k0hERPuPj3+MV0AtS5GnufG2NK4tmeow1CmeM56QV4l8p0iCOs9eL/YmiwplUjFQgAAAABJRU5ErkJgggAA");
    }
    `;
document.documentElement.appendChild(customStyle);