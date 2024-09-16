// Helper functions
// Helper function to loop 'x' times and perform an action
const loopTimes = (times, action) => {
    Array.from({ length: times }).forEach((_, index) => action(index));
};

const randomCharacter = () => String.fromCharCode(Math.floor(Math.random() * 26) + 65);

const getRandomNumberInclusive = (x, y) => Math.floor(Math.random() * (y - x + 1)) + x;

// Global game state
window.boardTopOffset = 30;
window.reservedWordSpots = [];
window.currentGameSize = { width: 20, height: 20 }
window.rules = {
    allowDiagonals: true,
    maxWordInsertionAttempts: 100
};

// Main code
const regenerate = () => {
    // Initialize the board with default values
    initializeBoard(window.currentGameSize.width, window.currentGameSize.height);

    insertWordsIntoBoard([
        "why", "wont", "it", "FUCKING", "work"
    ]);
}

window.addEventListener('load', regenerate);

const insertWordsIntoBoard = (words) => {
    const directions = [
        "horizontal",
        "horizontal_r",
        "vertical",
        "vertical_r",

        // Only allow diagonals if corresponding rule is set
        ... (window.rules.allowDiagonals ? [
            "diagonal",
            "diagonal_r"
        ] : [])
    ];

    // Attempt to find a place for each word
    let allSuccess = true;
    words.forEach(word => {
        let succes = false;
        let attemptCounter = 0;

        while ((!succes) && window.rules.maxWordInsertionAttempts > attemptCounter) {
            ++attemptCounter;
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
            // TODO: Make sure to only pick coordinates where the word will be guarenteed to fit
            const startingCoordinates = {
                x: getRandomNumberInclusive(0, window.currentGameSize.width),
                y: getRandomNumberInclusive(0, window.currentGameSize.height)
            };

            succes = attemptWordInsertion(word, randomDirection, startingCoordinates);
        }
        
        if (!succes)
            allSuccess = false;
    });

    if (allSuccess)
        renderGeneratedWordsIntoGameBoard();
    else
        ; // TODO: let the user know the program failed to generate the word-search
}

const renderGeneratedWordsIntoGameBoard = () => {
    window.reservedWordSpots.forEach(reservedWordSpot => {
        // Find the corresponding spot by id, and set the correct values;
        const spotTag = `row-${reservedWordSpot.coords.xCoord}-column-${reservedWordSpot.coords.yCoord}`;
        const spot = document.getElementById(spotTag);
        

        console.log(spotTag, spot, reservedWordSpot.letter);
        if (spot == null)
            return;

        spot.innerText = reservedWordSpot.letter;

        if (!spot.classList.contains('to-find-spot'))
            spot.classList.add('to-find-spot');

        
    });
}

const attemptWordInsertion = (word, randomDirection, startingCoordinates) => {
    const wordLength = word.length;

    // Calculate the ending coordinates based on the word length
    // and starting coordinates
    let endingCoordinates = {
        x: 0,
        y: 0
    };

    if (randomDirection == "horizontal")
        endingCoordinates = {
            x: startingCoordinates.x + (wordLength - 1),
            y: startingCoordinates.y
        }
    else if (randomDirection == "horizontal_r")
        endingCoordinates = {
            x: startingCoordinates.x - (wordLength - 1),
            y: startingCoordinates.y
        }
    else if (randomDirection == "vertical")
        endingCoordinates = {
            x: startingCoordinates.x,
            y: startingCoordinates.y + (wordLength - 1)
        }
    else if (randomDirection == "vertical_r")
        endingCoordinates = {
            x: startingCoordinates.x,
            y: startingCoordinates.y - (wordLength - 1)
        }
    else if (randomDirection == "diagonal")
        endingCoordinates = {
            x: startingCoordinates.x + (wordLength - 1),
            y: startingCoordinates.y + (wordLength - 1)
        }
    else if (randomDirection == "diagonal_r")
        endingCoordinates = {
            x: startingCoordinates.x - (wordLength - 1),
            y: startingCoordinates.y - (wordLength - 1)
        }

    // Check if ending coordinates are within the game boundaries. If it is
    // not, then we should return false since the insertion attempt has failed.
    if (
        (endingCoordinates.x < 0) ||
        (endingCoordinates.y < 0) ||
        (endingCoordinates.x > window.currentGameSize.width - 1) ||
        (endingCoordinates.y > window.currentGameSize.height - 1)
    ) {
        return false;
    }

    console.log('passed first check with word ' + word + ' with coords: ', endingCoordinates)

    // Generate the columns that need to be updated
    let letterEntries = [];
    [...word].forEach((letter, index) => {
        let xCoord = startingCoordinates.x;
        let yCoord = startingCoordinates.y;

        if (randomDirection == "horizontal")
            xCoord += index;
        else if (randomDirection == "horizontal_r")
            xCoord -= index;
        else if (randomDirection == "vertical")
            yCoord += index;
        else if (randomDirection == "vertical_r")
            yCoord -= index;
        else if (randomDirection == "diagonal") {
            xCoord += index;
            yCoord += index;
        } else if (randomDirection == "diagonal_r") {
            xCoord += index;
            yCoord += index;
        }
        
        const entry = {
            letter: letter,
            coords: {
                xCoord: xCoord,
                yCoord: yCoord
            }
        }

        letterEntries.push(entry);
    });
    
    // Check if letter entries collide with other existing reserved letters
    let containsCollision = false;
    letterEntries.forEach(letterEntry => {
        let wordHadCollision = window.reservedWordSpots.some(ReservedEntry => {
            if (
                (ReservedEntry.letter !== letterEntry.letter) && // <=== GOD FUCKING DAMNIT WHY DO YOU REFUSE TO WORK!!!
                (ReservedEntry.coords.xCoord == letterEntry.coords.xCoord) &&
                (ReservedEntry.coords.yCoord == letterEntry.coords.yCoord)
            )
                return true;

            return false;
        });

        if (wordHadCollision)
            containsCollision = true;
    });

    if (containsCollision)
        return false;

    // Add the letter entries into the existing set of reserved word spots
    console.log(`found a way to add: `, letterEntries)
    window.reservedWordSpots = [...window.reservedWordSpots, ...letterEntries]

    return true;
    // console.log(`Attempting random insertion of word ${word}: ${randomDirection} starting from (${startingCoordinates.x}, ${startingCoordinates.y})`);
}

const initializeBoard = (width, height) => {
    const size = { width: width, height: height };

    const game = document.getElementById('wordfind-board');

    // Clear all of the game state
    game.innerHTML = '';
    window.reservedWordSpots = [];

    // Generate all of the rows
    loopTimes(size.height, rowIndex => {
        // Create the row element and set the id
        const newRow = document.createElement('tr');
        newRow.id = `row-${rowIndex}`;

        // Create the column elements within the row
        loopTimes(size.width, columnIndex => {
            const newColumn = document.createElement('td');
            newColumn.id = `row-${rowIndex}-column-${columnIndex}`;
            newColumn.innerText = randomCharacter();
            newRow.appendChild(newColumn);
        });

        // Now append the entire row at once to the game
        game.appendChild(newRow);
    });

    // Change board styling based on the number of cells in the board
    const boardTopOffsetPerCell = window.boardTopOffset / size.height;
    document.querySelectorAll('#wordfind-board td').forEach(e => {
        e.style.cssText = `
            height: min(calc(100vh / ${size.height}), calc(100vw / ${size.height}));
            width: min(calc(100vh / ${size.width}), calc(100vw / ${size.width}));
        `;
    });
}