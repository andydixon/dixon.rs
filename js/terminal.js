// Constants for layout dimensions and settings
const columnHeight = 17;
const wordColumnWidth = 12;
const count = 12;
const difficulty = Math.random() * (10 - 7) + 7;
const dudLength = 8;
let sound = true;
const infoText = "ROBCO INDUSTRIES (TM) TERMALINK PROTOCOL<br />ENTER PASSWORD NOW";
let correct = "";
let words = {};
let outputLines = [];
let attemptsRemaining = 6;
let power = "off";
const bracketSets = ["<>", "[]", "{}", "()"];
const gchars = [
    "'", "|", "\"", "!", "@", "#", "$", "%", "^", "&", "*", "-", "_", "+", "=", ".", ";", ":", "?", ",", "/"
];

// Initialize the application
function start() {
    $.get("/ajax/payload.php", {
        length: difficulty,
        count: count
    }, wordCallback);
}

// Event handler for window load
$(window).on("load", function () {
    initialize();
});

// Initialize the terminal
function initialize() {
    if (power === "off") return;

    if ($.browser.safari || $.browser.msie) sound = false;
    document.onselectstart = function () {
        return false;
    }

    if (sound) $("#poweron")[0].play();

    bootstrap();

}

// Fill word columns with dots
function wordColumnsWithDots() {
    const column2 = $("#column2");
    const column4 = $("#column4");

    const dots = generateDotColumn();
    column2.html(dots);
    column4.html(dots);
}

// Update the remaining attempts display
function updateAttempts() {
    let attemptString = `${attemptsRemaining} ATTEMPT(S) LEFT: `;
    jTypeFill("attempts", attemptString, 20, function () {
        for (let i = 0; i < attemptsRemaining; i++) {
            attemptString += " &#9608;";
        }
        $("#attempts").html(attemptString);
    }, "", "");
}

// Toggle the power state of the terminal
function togglePower() {
    if (power === "on") {
        power = "off";
        $("#terminal-background-off").css("visibility", "visible");
        $("#terminal").css("background-image", "url('res/img/bg-off.png')");
        $("#terminal").html("");
        if (sound) $("#poweroff")[0].play();
    } else {
        power = "on";
        $("#terminal-background-off").css("visibility", "hidden");
        $("#terminal").css("background-image", "url('res/img/bg.png')");
        initialize();
    }
}

// Type text into a container with a typing animation
function jTypeFill(containerID, text, typeSpeed, callback, typeCharacter, prefix) {
    const cont = $("#" + containerID);

    if (!typeCharacter) typeCharacter = "&#9608;";
    if (!prefix) prefix = ">";

    cont.html("").stop().css("fake-property", 0).animate({
        "fake-property": text.length
    }, {
        duration: typeSpeed * text.length,
        step: function (i) {
            const insert = prefix + text.substr(0, i);
            if (cont.text().substr(0, cont.text().length - 1) !== insert) {
                if (sound) $("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
            }
            cont.html(insert + typeCharacter);
        },
        complete: callback
    });
}

// Callback function to handle the word list response
function wordCallback(response) {
    words = response.words; //JSON.parse(response).words;
    correct = words[0];
    words = shuffle(words);
    fillWordColumns();
}

// Set up interactions for a column
function setupInteractions(column) {
    column = $(column);

    column.find(".character").hover(function () {
        if (attemptsRemaining === 0) return false;

        $(this).addClass("character-hover");

        if (!$(this).hasClass("word") && !$(this).hasClass("dudcap")) {
            updateConsole($(this).text());
            return true;
        }

        if ($(this).hasClass("word")) updateConsole($(this).attr("data-word"));
        else if ($(this).hasClass("dudcap")) updateConsole($(this).text());

        let cur = $(this).prev();
        if (cur.is("br")) cur = cur.prev();
        while (cur.hasClass("word") || cur.hasClass("dud")) {
            cur.addClass("character-hover");
            cur = cur.prev();
            if (cur.is("br")) cur = cur.prev();
        }

        cur = $(this).next();
        if (cur.is("br")) cur = cur.next();
        while (cur.hasClass("word") || cur.hasClass("dud")) {
            cur.addClass("character-hover");
            cur = cur.next();
            if (cur.is("br")) cur = cur.next();
        }

    }, function () {
        $(this).removeClass("character-hover");

        if (!$(this).hasClass("word") && !$(this).hasClass("dudcap")) return true;

        let cur = $(this).prev();
        if (cur.is("br")) cur = cur.prev();
        while (cur.hasClass("word") || cur.hasClass("dud")) {
            cur.removeClass("character-hover");
            cur = cur.prev();
            if (cur.is("br")) cur = cur.prev();
        }

        cur = $(this).next();
        if (cur.is("br")) cur = cur.next();
        while (cur.hasClass("word") || cur.hasClass("dud")) {
            cur.removeClass("character-hover");
            cur = cur.next();
            if (cur.is("br")) cur = cur.next();
        }
    });

    column.find(".character").click(function () {
        if (attemptsRemaining === 0) return false;

        if ($(this).hasClass("word")) {
            if (sound) $("#enter")[0].play();
            const word = $(this).attr("data-word");
            updateOutput(word);

            if (word.toLowerCase() === correct.toLowerCase()) {
                if (sound) $("#passgood")[0].play();
                updateOutput("");
                updateOutput("Exact match!");
                updateOutput("Please wait");
                updateOutput("while system");
                updateOutput("is accessed.");
                attemptsRemaining = 0;
                success();
            } else {
                if (sound) $("#passbad")[0].play();
                updateOutput("Access denied");
                updateOutput(`${compareWords(word, correct)}/${correct.length} correct.`);
                attemptsRemaining--;
                updateAttempts();
                if (attemptsRemaining === 0) failure();
            }
        } else if ($(this).hasClass("dudcap")) {
            if (sound) $("#enter")[0].play();
            handleBraces($(this));
        } else {
            return false;
        }
    });
}

// Remove a dud word from the list
function removeDud() {
    const liveWords = $(".word").not(`[data-word='${correct.toUpperCase()}']`);
    const wordToRemove = $(liveWords[Math.floor(Math.random() * liveWords.length)]).attr("data-word");

    $(`[data-word='${wordToRemove}']`).each(function (index, elem) {
        $(this).text(".").removeClass("word").removeAttr("data-word");
    });
}

// Handle braces interaction
function handleBraces(dudCap) {
    if (Math.round(Math.random() - 0.3)) {
        attemptsRemaining = 6;
        updateOutput("");
        updateOutput("Allowance");
        updateOutput("replenished.");
        updateAttempts();
    } else {
        updateOutput("");
        updateOutput("Dud removed.");
        removeDud();
    }

    $(dudCap).text(".").unbind("click");
    let cur = $(dudCap).next();
    if (cur.is("br")) cur = cur.next();
    while (cur.hasClass("dud")) {
        if (cur.hasClass("dudcap")) {
            cur.text(".").removeClass("dudcap").unbind("click");
        } else {
            cur.text(".").unbind("click");
        }
        cur = cur.next();
        if (cur.is("br")) cur = cur.next();
    }

    cur = $(dudCap).prev();
    if (cur.is("br")) cur = cur.prev();
    while (cur.hasClass("dud")) {
        if (cur.hasClass("dudcap")) {
            cur.text(".").removeClass("dudcap").unbind("click");
        } else {
            cur.text(".").unbind("click");
        }
        cur = cur.prev();
        if (cur.is("br")) cur = cur.prev();
    }
}

// Handle failure scenario
function failure() {
    updateOutput("Access denied.");
    updateOutput("Lockout in");
    updateOutput("progress.");

    $("#terminal-interior").animate({
        top: -1 * $("#terminal-interior").height()
    }, {
        duration: 1000,
        complete: function () {
            $("#terminal").html("<div id='adminalert'><div class='character-hover alert-text'>TERMINAL LOCKED</div><br />PLEASE CONTACT AN ADMINISTRATOR</div></div>");

        }
    });
}

// Handle success scenario
function success() {
    updateOutput("Access granted.");

    $("#terminal-interior").animate({
        top: -1 * $("#terminal-interior").height()
    }, {
        duration: 1000,
        complete: function () {
            $("#terminal").html("<div id=\"terminal-interior\"><div id='adminalert'>" +
                "<div id='msg' class='character-hover alert-text'>TERMINAL ACCESS GRANTED</div>" +
                "<br />" +
                "</div></div>");
            $("#proceed").hover(function () {
                $(this).addClass("character-hover");
                $("#msg").removeClass("character-hover");
            }, function () {
                $(this).removeClass("character-hover");
                $("#msg").addClass("character-hover");
            });

            setTimeout(function () {

                $("#terminal-interior").animate({
                    top: -1 * $("#terminal-interior").height()
                }, {
                    duration: 1000,
                    complete: function () {
                        $("#terminal").html("<div id=\"terminal-interior\"><div id='adminalert'>" +
                            "<div id='msg' class='alert-text'>LOADING //MNT/PUB/MENU.R</div>" +
                            "</div></div>");
                        setTimeout(function () {

                            $("#terminal-interior").animate({
                                top: -1 * $("#terminal-interior").height()
                            }, {
                                duration: 1000,
                                complete: function () {
                                    $("#terminal").html("<div id=\"terminal-interior\" class='paddification'></div>");
                                    $("#terminal-interior").load("/menu.r");

                                }
                            })
                        }, 1000);
                    }
                })
            }, 3000);
        }
    });
}

function bootstrap() {
    $("#terminal").html('<div class="paddification" id="terminal-interior"></div>');
    bootstrapText = "WELCOME TO ROBCO INDUSTRIES (TM) TERMLINK<br /><br /> " +
        "&gt;SET TERMINAL/ENQUIRE<br /><br />" +
        "RX-9000<br /><br />" +
        ">SET FILE/PROTECTION=OWNER:RWED ACCOUNTS.F<br /><br />" +
        ">SET HALT RESTART/MAINT<br /><br />" +
        "Initializing RobCo Industries(TM) MF Boot Agent v2.3.0<br />" +
        "RETROS BIOS<br />" +
        "RBIOS-4.02.08.00 52EE5.E7.E8<br />" +
        "Copyright 2075-2077 RobCo Ind.<br />" +
        "Uppermem: 1024 KB<br />" +
        "Root (5A8)<br />" +
        "Maintenance Mode<br /><br />" +
        ">RUN DEBUG/ACCOUNTS.F<br />";
    jTypeFill("terminal-interior", bootstrapText, 20, function () {
        setTimeout(function () {
            refreshScreen('<div id="info"></div><div id="attempts"></div><div id="column1" class="column pointers"></div><div id="column2" class="column words"></div><div id="column3" class="column pointers"></div><div id="column4" class="column words"></div><div id="output"></div><div id="console">></div>', false, function () {
                wordColumnsWithDots();
                fillPointerColumns();
                setupOutput();
                attemptsRemaining = 6;

                jTypeFill("info", infoText, 20, function () {
                    updateAttempts();
                }, "", "");
                start();
            });

        }, 1500);
    }, "", "");
}

function refreshScreen(html, padded, callback) {
    let classes = "";
    if (padded == true) {
        classes = "paddification";
    }
    $("#terminal-interior").animate({
        top: -1 * $("#terminal-interior").height()
    }, {
        duration: 1000,
        complete: function () {
            $("#terminal").html("<div class=\"" + classes + "\" id=\"terminal-interior\">" + html + "</div>");
            callback();
        }
    })
}


// Compare two words and return the number of matching characters
function compareWords(first, second) {
    if (first.length !== second.length) {
        return 0;
    }

    first = first.toLowerCase();
    second = second.toLowerCase();

    let correct = 0;
    for (let i = 0; i < first.length; i++) {
        if (first[i] === second[i]) correct++;
    }
    return correct;
}

// Update the console display with a word
function updateConsole(word) {
    const cont = $("#console");
    const typeSpeed = 80;

    cont.html("").stop().css("fake-property", 0).animate({
        "fake-property": word.length
    }, {
        duration: typeSpeed * word.length,
        step: function (i) {
            const insert = ">" + word.substr(0, i);
            if (cont.text().substr(0, cont.text().length - 1) !== insert) {
                if (sound) $("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
            }
            cont.html(insert + "&#9608;");
        }
    });
}

// Update the output display with a line of text
function updateOutput(text) {
    outputLines.push(">" + text);

    let output = "";
    for (let i = columnHeight - 2; i > 0; i--) {
        output += outputLines[outputLines.length - i] + "<br />";
    }

    $("#output").html(output);
}

// Populate the info display with text
function populateInfo() {
    const cont = $("#info");

    cont.stop().css("fake-property", 0).animate({
        "fake-property": infoText.length
    }, {
        duration: 20 * infoText.length,
        step: function (delta) {
            const insert = infoText.substr(0, delta);
            if (cont.html().substr(0, cont.html().length - 1) !== insert) {
                $("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
            }
            cont.html(insert);
        }
    });
}

// Set up the initial output display
function setupOutput() {
    for (let i = 0; i < columnHeight; i++) {
        outputLines.push("");
    }
}

// Fill the pointer columns with random pointers
function fillPointerColumns() {
    const column1 = document.getElementById("column1");
    const column3 = document.getElementById("column3");

    let pointers = "";
    for (let i = 0; i < columnHeight; i++) {
        pointers += randomPointer() + "<br />";
    }
    column1.innerHTML = pointers;

    pointers = "";
    for (let i = 0; i < columnHeight; i++) {
        pointers += randomPointer() + "<br />";
    }
    column3.innerHTML = pointers;
}

// Fill the word columns with words and garbage characters
function fillWordColumns() {
    const column2 = document.getElementById("column2");
    const column4 = document.getElementById("column4");

    let column2Content = $(generateGarbageCharacters());
    let column4Content = $(generateGarbageCharacters());

    let allChars = column2Content;
    let start = Math.floor(Math.random() * wordColumnWidth);

    for (let i = 0; i < words.length / 2; i++) {
        const pos = start + i * Math.floor(allChars.length / (words.length / 2));
        const word = words[i].toUpperCase();
        for (let s = 0; s < difficulty; s++) {
            $(allChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
        }
    }

    allChars = addDudBrackets(allChars);
    printWords(column2, allChars);

    allChars = column4Content;
    start = Math.floor(Math.random() * wordColumnWidth);
    let maxNum = words.length;
    for (let i = 0; i < maxNum / 2; i++) {
        const pos = start + i * Math.floor(allChars.length / (maxNum / 2));
        const word = words[i + maxNum / 2].toUpperCase();
        for (let s = 0; s < difficulty; s++) {
            $(allChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
        }
    }
    allChars = addDudBrackets(allChars);
    printWords(column4, allChars);
}

// Add dud brackets to the nodes
function addDudBrackets(nodes) {
    const allBlankIndices = getContinuousBlanks(nodes);

    for (let i = 1; i < allBlankIndices.length; i++) {
        if (Math.round(Math.random() + 0.25)) {
            const brackets = bracketSets[Math.floor(Math.random() * bracketSets.length)];
            const chunkCenter = Math.floor(allBlankIndices[i].length / 2);
            const jStart = chunkCenter - dudLength / 2;
            const jEnd = chunkCenter + dudLength / 2;

            for (let j = jStart; j < jEnd; j++) {
                if (j === jStart) $(nodes[allBlankIndices[i][j]]).text(brackets[0]).addClass("dudcap");
                else if (j === jEnd - 1) $(nodes[allBlankIndices[i][j]]).text(brackets[1]).addClass("dudcap");

                $(nodes[allBlankIndices[i][j]]).addClass("dud");
            }
        }
    }

    return nodes;
}

// Get continuous blank nodes
function getContinuousBlanks(nodes) {
    const allNodes = $(nodes);
    const continuousBlanks = [[]];
    let cur = 0;

    $.each(allNodes, function (index, elem) {
        if (!$(elem).hasClass("word")) {
            continuousBlanks[cur].push(index);

            if (index + 1 !== allNodes.length && $(allNodes[index + 1]).hasClass("word")) {
                continuousBlanks.push([]);
                cur++;
            }
        }
    });

    return continuousBlanks;
}

// Print words and garbage characters to the container
function printWords(container, words) {
    const nodes = $(container).find(".character");

    nodes.each(function (index, elem) {
        $(elem).delay(5 * index).queue(function () {
            $(elem).replaceWith(words[index]);
            if (index === nodes.length - 1) {
                setupInteractions(container);
            }
        });
    });
}

// Shuffle an array
function shuffle(array) {
    let tmp, current, top = array.length;

    if (top) while (--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }

    return array;
}

// Generate a column of dots
function generateDotColumn() {
    let dots = "";

    for (let y = 0; y < columnHeight; y++) {
        for (let x = 0; x < wordColumnWidth; x++) {
            dots += "<span class='character'>.</span>";
        }
        dots += "<br />";
    }

    return dots;
}

// Generate a column of garbage characters
function generateGarbageCharacters() {
    let garbage = "";

    for (let y = 0; y < columnHeight; y++) {
        for (let x = 0; x < wordColumnWidth; x++) {
            garbage += "<span class='character'>" + gchars[Math.floor(Math.random() * gchars.length)] + "</span>";
        }
    }

    return garbage;
}

// Generate a random pointer string
function randomPointer() {
    if (sound) {
        return "0x" + ("0000" + Math.floor(Math.random() * 35535).toString(16).toUpperCase()).substr(-4);
    } else {
        const butt = ("0000" + Math.floor(Math.random() * 35535).toString(16).toUpperCase());
        return "0x" + butt.slice(butt.length - 4);
    }
}