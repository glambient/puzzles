// class for holding level setup data
class Hexagon {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        this.u0 = null;
        this.v0 = null;
        this.w0 = null;
        this.u1 = null;
        this.v1 = null;
        this.w1 = null;
    }

    // implicitly rotates shapes 60 degrees clockwise
    // the value of the Edge on each side is replaced with its neighbor
    rotate() {
        var temp = this.w1.topValue;
        this.w1.topValue = this.v1.topValue;
        this.v1.topValue = this.u1.topValue;
        this.u1.topValue = this.w0.bottomValue;
        this.w0.bottomValue = this.v0.bottomValue;
        this.v0.bottomValue = this.u0.bottomValue;
        this.u0.bottomValue = temp;
    }
}

class Edge {
    constructor(id) {
        this.id = id;
        // both sides are initialized to 0 and changed later
        // top side of the edge, on lower part of a Hexagon 
        this.topValue = 0;
        // bottom side of the edge, on upper part of a Hexagon
        this.bottomValue = 0;
    }
}





// initialize game-wide values
const currentLevelText = document.getElementById("currentLevelText")
const levelCompleteMessage = document.getElementById("levelCompleteMessage");
var currentLevel = 1;
currentLevelText.textContent=currentLevel;

// currentLevelMax is stored in localStorage
// if the user has played the game before, get currentLevelMax
var currentLevelMax = parseInt(localStorage.getItem("maxLevel")) || 1;

// create level inc/dec buttons and button rules
const previousLevelButton = document.getElementById("previousLevel");
previousLevelButton.addEventListener("click", previousLevel);
const nextLevelButton = document.getElementById("nextLevel");
nextLevelButton.addEventListener("click", nextLevel);

function levelButtonsEnableCheck() {
    if (currentLevel > 1) {
        previousLevelButton.disabled = false
    } else {previousLevelButton.disabled = true}

    if (currentLevel < currentLevelMax) {
        nextLevelButton.disabled = false
    } else {nextLevelButton.disabled = true}
}

levelButtonsEnableCheck();

function previousLevel() {
    currentLevel -= 1;
    loadNewLevel();
}

function nextLevel() {
    currentLevel += 1;
    loadNewLevel();
}

function loadNewLevel() {
    levelCompleteMessage.textContent="";
    currentLevelText.textContent=currentLevel;
    levelButtonsEnableCheck();
    thisLevel();
}

// define gameplay
function thisLevel() {
    // initialize level-wide values
    var puzzleSize = Math.floor(currentLevel / 2) + 6;
    // establish the grid that will define the hexagons
    // this is separate from the actual collection of hexagons
    // rows are the longer function
    var numRows = puzzleSize;
    // inner function determines num_col relative to num_row
    // outer function determines appropriate number for drawing shapes
    // that will make a square-ish gameboard
    var relativeCols = Math.floor(numRows*Math.sqrt(3))
    var numCols = Math.floor(relativeCols / 3) * 3 + 1;

    // console.log(`number of rows: ${numRows}`);
    // console.log(`number of columns: ${numCols}`);

    // linkFrequency determines likelihood of an edge being a link.
    // This value must be > 1.0 for anything to appear.
    var linkFrequency = 3.0;
    if (currentLevel % 2 == 1) {
        linkFrequency = 2.0;
    }
    // console.log(`Link Frequency: ${linkFrequency}`);
    
    // click handler function
    function canvasClicked(event) {
        // only enable canvas click events if the level is not complete
        if (levelComplete == false) {
            // display number of incomplete links

            // retrieve Hexagon that was clicked
            var clickedCol = event.pageX / colWidth;
            var clickedRow = event.pageY / rowHeight;

            // console debugging
            // console.log(`Click Location: ${clickedCol},${clickedRow}`)

            const candidateHexagons = [-2, -1, 0, 1, 2].flatMap(dc =>
                [-1, 0, 1].map(dr => ({
                    col: Math.round(clickedCol + dc),
                    row: Math.round(clickedRow + dr)
                }))
            );

            // set comparison values
            var nearestHexagon = null;
            var nearestDistance = Infinity;

            // check candidates
            for (const {col, row} of candidateHexagons) {
                const thisCandidate = hexagonMap.get(`${col},${row}`);

                if (!thisCandidate) continue;

                // calculate the distance to
                const thisDistance = Math.hypot(
                    (thisCandidate.col * colWidth) - event.offsetX,
                    (thisCandidate.row * rowHeight) - event.offsetY
                );

                // console.log(`This hexagon: ${thisCandidate.col},${thisCandidate.row}`);
                // console.log(`This distance: ${thisDistance}`);

                // update best candidate by nearest distance
                // the center of a regular hexagon is closer to its edge
                // than the center of any tessellating hexagon
                if (thisDistance < nearestDistance) {
                    nearestDistance = thisDistance;
                    nearestHexagon = thisCandidate;
                }
            }
            
            // set bool for a completed puzzle
            levelComplete = false;
            
            // rotate this shape
            if (nearestHexagon) {
                nearestHexagon.rotate();
            }

            // clear and redraw canvas
            redraw();

            // if levelComplete is still true, no mismatched edges were detected. game ends
            if (levelComplete) {
                // show message
                levelCompleteMessage.textContent="Level complete!";
                // increase max level if applicable
                if (currentLevel == currentLevelMax) {
                    currentLevelMax += 1;
                    localStorage.setItem("maxLevel", currentLevelMax);
                }
                levelButtonsEnableCheck();
            }
            // if false, click events are re-enabled
        }   
    }

    // create an array of valid coords for hexagons
    const hexCoords = [];
    for (var row = 1; row < numRows; row++) {
        // if row is odd, offset by 5; if even, offset by 2
        const colOffset = row % 2 === 1 ? 5 : 2;
        for (var col = colOffset; col < numCols - 1; col += 6) {
            hexCoords.push([col, row]);
        }
    }

    const hexagons = [];
    const hexagonMap = new Map();
    const edges = [];
    var edgeIdCounter = 0;

    function linkLogic() {
        return Math.min(Math.floor(Math.random() * linkFrequency), 1)
    }

    // create hexagons based on list
    hexCoords.forEach((coordinatePair) => {
        // init a new hexagon
        [col, row] = coordinatePair;
        var hexagon = new Hexagon(col, row);

        // define its edges, creating an Edge if none exists
        
        // u0
        // determine where a neighboring hexagon would be and find if one is created there
        var u0_neighbor = hexagonMap.get(`${col-3},${row-1}`);
        // if there is
        if (u0_neighbor) {
            // get the Edge from that other hexagon
            hexagon.u0 = u0_neighbor.u1;
            // decide if linked, and apply to both topValue and bottomValue of edge
            linkValue = linkLogic();
            hexagon.u0.bottomValue = hexagon.u0.topValue = linkValue;
        } else {
            // if there isn't, create new Edge
            const edge = new Edge(edgeIdCounter++, 0, 0);
            edges.push(edge);
            hexagon.u0 = edge;
        }

        // v0
        var v0_neighbor = hexagonMap.get(`${col},${row-2}`);
        if (v0_neighbor) {
            hexagon.v0 = v0_neighbor.v1;
            hexagon.v0.bottomValue = hexagon.v0.topValue = linkLogic();
        } else {
            const edge = new Edge(edgeIdCounter++, 0, 0);
            edges.push(edge);
            hexagon.v0 = edge;
        }

        // w0
        var w0_neighbor = hexagonMap.get(`${col+3},${row-1}`);
        if (w0_neighbor) {
            hexagon.w0 = w0_neighbor.w1;
            hexagon.w0.bottomValue = hexagon.w0.topValue = linkLogic();
        } else {
            const edge = new Edge(edgeIdCounter++, 0, 0);
            edges.push(edge);
            hexagon.w0 = edge;
        }

        // u1
        var u1_neighbor = hexagonMap.get(`${col+3},${row+1}`);
        if (u1_neighbor) {
            hexagon.u1 = u0_neighbor.u0;
            hexagon.u1.bottomValue = hexagon.u1.topValue = linkLogic();
        } else {
            const edge = new Edge(edgeIdCounter++, 0, 0);
            edges.push(edge);
            hexagon.u1 = edge;
        }

        // v1
        var v1_neighbor = hexagonMap.get(`${col},${row+2}`);
        if (v1_neighbor) {
            hexagon.v1 = v1_neighbor.v0;
            hexagon.v1.bottomValue = hexagon.v1.topValue = linkLogic();
        } else {
            const edge = new Edge(edgeIdCounter++, 0, 0);
            edges.push(edge);
            hexagon.v1 = edge;
        }

        // w1
        var w1_neighbor = hexagonMap.get(`${col-3},${row+1}`);
        if (w1_neighbor) {
            hexagon.w0 = w1_neighbor.w0;
            hexagon.w1.bottomValue = hexagon.w1.topValue = linkLogic();
        } else {
            const edge = new Edge(edgeIdCounter++, 0, 0);
            edges.push(edge);
            hexagon.w1 = edge;
        }

        hexagons.push(hexagon);
        // console.log(`New Hexagon: ${hexagon.col},${hexagon.row}`);
        hexagonMap.set(`${hexagon.col},${hexagon.row}`, hexagon);
    });
    // console.log(`number of Hexagons created: ${hexagons.length}`);
    // console.log(`number of hexagon map objects created: ${hexagonMap.size}`);
    // console.log(`number of edges created: ${edgeIdCounter}`);

    // set up canvas
    const canvas = document.getElementById("playwindow");
    const ctx = canvas.getContext("2d");

    // needed to avoid buildup of click handlers
    if (canvas._clickHandler) {
        canvas.removeEventListener('click', canvas._clickHandler);
    }
    canvas._clickHandler = canvasClicked;
    canvas.addEventListener('click', canvasClicked);

    // get unit sizes
    let rowHeight = canvas.height / numRows;
    // console.log(`row height: ${rowHeight}`);
    let colWidth = rowHeight / Math.sqrt(3);
    // console.log(`column width: ${colWidth}`);
    
    // rotate each hexagon by a rand(0,5) value
    
    function performRandomHexagonRotation(hexagon) {
        for (var i = 0; i < Math.floor(Math.random() * 6); i++) {
            hexagon.rotate();
        }
    }
    hexagons.forEach(performRandomHexagonRotation);

    var levelComplete = false;

    function redraw() {
        // retrieve the canvas and clear it
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";

        // check if level is complete
        incompleteLinks = 0;
        // if Edge sides do not match, add to number of incomplete links
        edges.forEach((edge) => {
            // console.log(`edge: ${edge.topValue},${edge.bottomValue}`);
            incompleteLinks += (edge.topValue != edge.bottomValue);
        });
        if (incompleteLinks == 0) { levelComplete = true; }
        levelCompleteMessage.textContent=`Incomplete Links: ${incompleteLinks/2}`;

        // draw hexagons

        hexagons.forEach(drawHexagon);

        function drawHexagon(hexagon) {
            // calculate shape which will determine drawing
            shape = hexagon.u0.bottomValue + hexagon.v0.bottomValue*2 + hexagon.w0.bottomValue*4 +
                    hexagon.u1.topValue*8 + hexagon.v1.topValue*16 + hexagon.w1.topValue*32;

            // abstract out the face points where line segments will terminate
            var col = hexagon.col;
            var row = hexagon.row;
            var pt_ctr = [colWidth * col, rowHeight * row]
            var pt_u0 = [colWidth * (col - 1.5), rowHeight * (row - 0.5)];
            var pt_v0 = [colWidth * col, rowHeight * (row - 1)];
            var pt_w0 = [colWidth * (col + 1.5), rowHeight * (row - 0.5)];
            var pt_u1 = [colWidth * (col + 1.5), rowHeight * (row + 0.5)];
            var pt_v1 = [colWidth * col, rowHeight * (row + 1)];
            var pt_w1 = [colWidth * (col - 1.5), rowHeight * (row + 0.5)];

            // drawing functions
            function drawTerminator(a) {
                // draw line from referenced point to center
                ctx.beginPath();
                ctx.moveTo(pt_ctr[0], pt_ctr[1]);
                ctx.lineTo(a[0], a[1]);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(pt_ctr[0], pt_ctr[1], endCapSize, 0, 2*Math.PI);       // arc(center x, center y, radius, rad begin, rad end)
                ctx.fill();
                ctx.stroke();
            }
            function drawCurve(a, b) {
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.quadraticCurveTo(pt_ctr[0], pt_ctr[1], b[0], b[1]);
                ctx.stroke();
            }
            function drawLine(a, b) {
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.stroke();
            }

            // OPTIONAL BUT RECOMMENDED: draw hexagon border as a guide
            function drawHexagonGrid() {
                ctx.lineWidth = 1;
                ctx.strokeStyle = "gray";
                ctx.beginPath();
                ctx.moveTo(colWidth*(col-1), rowHeight*(row-1));
                ctx.lineTo(colWidth*(col+1), rowHeight*(row-1));
                ctx.lineTo(colWidth*(col+2), rowHeight*(row));
                ctx.lineTo(colWidth*(col+1), rowHeight*(row+1));
                ctx.lineTo(colWidth*(col-1), rowHeight*(row+1));
                ctx.lineTo(colWidth*(col-2), rowHeight*(row));
                ctx.lineTo(colWidth*(col-1), rowHeight*(row-1));
                ctx.stroke();
            }
            if (!levelComplete) {drawHexagonGrid()};
            
            // draw line segments based on relevant points
            ctx.lineWidth = colWidth / 3;
            ctx.strokeStyle = "black";
            var endCapSize = colWidth / 2;
            // console.log(`Hexagon: ${hexagon.col},${hexagon.row} -- shape: ${shape}`)
            switch (shape) {
                case 0:   // empty hexagon
                    break;
                case 1:   // u0
                    drawTerminator(pt_u0);
                    break;
                case 2:   // v0
                    drawTerminator(pt_v0);
                    break;
                case 3:   // v0 u0
                    drawCurve(pt_v0, pt_u0);
                    break;
                case 4:   // w0
                    drawTerminator(pt_w0);
                    break;
                case 5:   // w0 u0
                    drawCurve(pt_w0, pt_u0);
                    break;
                case 6:   // w0 v0
                    drawCurve(pt_v0, pt_w0);
                    break;
                case 7:   // w0 v0 u0
                    drawCurve(pt_w0, pt_u0);
                    drawCurve(pt_u0, pt_v0);
                    drawCurve(pt_v0, pt_w0);
                    break;
                case 8:   // u1
                    drawTerminator(pt_u1);
                    break;
                case 9:   // u1 u0
                    drawLine(pt_u1, pt_u0);
                    break;
                case 10:  // u1 v0
                    drawCurve(pt_u1, pt_v0);
                    break;
                case 11:  // u1 v0 u0
                    drawLine(pt_u1, pt_u0);
                    drawCurve(pt_u1, pt_v0);
                    break;
                case 12:  // u1 w0
                    drawCurve(pt_u1, pt_w0);
                    break;
                case 13:  // u1 w0 u0
                    drawLine(pt_u1, pt_u0);
                    drawCurve(pt_u0, pt_w0);
                    break;
                case 14:  // u1 w0 v0
                    drawCurve(pt_u1, pt_v0);
                    drawCurve(pt_v0, pt_w0);
                    drawCurve(pt_w0, pt_u1);
                    break;
                case 15:  // u1 w0 v0 u0
                    drawCurve(pt_u1, pt_v0);
                    drawCurve(pt_w0, pt_u0);
                    break;
                case 16:  // v1
                    drawTerminator(pt_v1);
                    break;
                case 17:  // v1 u0
                    drawCurve(pt_v1, pt_u0);
                    break;
                case 18:  // v1 v0
                    drawLine(pt_v1, pt_v0);
                    break;
                case 19:  // v1 v0 u0
                    drawLine(pt_v0, pt_v1);
                    drawCurve(pt_u0, pt_v1);
                    break;
                case 20:  // v1 w0
                    drawCurve(pt_v1, pt_w0);
                    break;
                case 21:  // v1 w0 u0
                    drawCurve(pt_v1, pt_w0);
                    drawCurve(pt_w0, pt_u0);
                    drawCurve(pt_u0, pt_v1);
                    break;
                case 22:  // v1 w0 v0
                    drawLine(pt_v1, pt_v0);
                    drawCurve(pt_v1, pt_w0);
                    break;
                case 23:  // v1 w0 v0 u0
                    drawLine(pt_v1, pt_v0);
                    drawCurve(pt_w0, pt_u0);
                    break;
                case 24:  // v1 u1
                    drawCurve(pt_v1, pt_u1);
                    break;
                case 25:  //  v1 u1 u0
                    drawLine(pt_u1, pt_u0);
                    drawCurve(pt_v1, pt_u0);
                    break;
                case 26:  // v1 u1 v0
                    drawLine(pt_v1, pt_v0);
                    drawCurve(pt_u1, pt_v0);
                    break;
                case 27:  // v1 u1 v0 u0
                    drawLine(pt_u1, pt_u0);
                    drawLine(pt_v1, pt_v0);
                    break;
                case 28:  // v1 u1 w0
                    drawCurve(pt_v1, pt_w0);
                    drawCurve(pt_w0, pt_u1);
                    drawCurve(pt_u1, pt_v1);
                    break;
                case 29:  // v1 u1 w0 u0
                    drawLine(pt_u1, pt_u0);
                    drawCurve(pt_w0, pt_v1);
                    break;
                case 30:  // v1 u1 w0 v0
                    drawCurve(pt_v1, pt_w0);
                    drawCurve(pt_v0, pt_u1);
                    break;
                case 31:  // v1 u1 w0 v0 u0
                    drawLine(pt_v1, pt_v0);
                    drawLine(pt_u1, pt_u0);
                    drawLine(pt_w0, pt_ctr);
                    break;
                case 32:  // w1
                    drawTerminator(pt_w1);
                    break;
                case 33:  // w1 u0
                    drawCurve(pt_w1, pt_u0);
                    break;
                case 34:  // w1 v0
                    drawCurve(pt_w1, pt_v0);
                    break;
                case 35:  // w1 v0 u0
                    drawCurve(pt_w1, pt_v0);
                    drawCurve(pt_v0, pt_u0);
                    drawCurve(pt_u0, pt_w1);
                    break;
                case 36:  // w1 w0
                    drawLine(pt_w1, pt_w0);
                    break;
                case 37:  // w1 w0 u0
                    drawLine(pt_w1, pt_w0);
                    drawCurve(pt_u0, pt_w0);
                    break;
                case 38:  // w1 w0 v0
                    drawLine(pt_w1, pt_w0);
                    drawCurve(pt_w1, pt_v0);
                    break;
                case 39:  // w1 w0 v0 u0
                    drawCurve(pt_w1, pt_v0);
                    drawCurve(pt_w0, pt_u0);
                    break;
                case 40:  // w1 u1
                    drawCurve(pt_w1, pt_u1);
                    break;
                case 41:  // w1 u1 u0
                    drawLine(pt_u1, pt_u0);
                    drawCurve(pt_u1, pt_w1);
                    break;
                case 42:  // w1 u1 v0
                    drawCurve(pt_w1, pt_u1);
                    drawCurve(pt_u1, pt_v0);
                    drawCurve(pt_v0, pt_w1);
                    break;
                case 43:  // w1 u1 v0 u0
                    drawLine(pt_u1, pt_u0);
                    drawCurve(pt_w1, pt_v0);
                    break;
                case 44:  // w1 u1 w0
                    drawLine(pt_w1, pt_w0);
                    drawCurve(pt_u1, pt_w1);
                    break;
                case 45:  // w1 u1 w0 u0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_u1, pt_u0);
                    break;
                case 46:  // w1 u1 w0 v0
                    drawLine(pt_w1, pt_w0);
                    drawCurve(pt_u1, pt_v0);
                    break;
                case 47:  // w1 u1 w0 v0 u0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_u1, pt_u0);
                    drawLine(pt_v0, pt_ctr);
                    break;
                case 48:  // w1 v1
                    drawCurve(pt_w1, pt_v1);
                    break;
                case 49:  // w1 v1 u0
                    drawCurve(pt_u0, pt_v1);
                    drawCurve(pt_v1, pt_w1);
                    drawCurve(pt_w1, pt_u0);
                    break;
                case 50:  // w1 v1 v0
                    drawLine(pt_v1, pt_v0);
                    drawCurve(pt_v0, pt_w1);
                    break;
                case 51:  // w1 v1 v0 u0
                    drawCurve(pt_v1, pt_u0);
                    drawCurve(pt_w1, pt_v0);
                    break;
                case 52:  // w1 v1 w0
                    drawLine(pt_w1, pt_w0);
                    drawCurve(pt_w0, pt_v1);
                    break;
                case 53:  // w1 v1 w0 u0
                    drawCurve(pt_v1, pt_u0);
                    drawLine(pt_w0, pt_w1);
                    break;
                case 54:  // w1 v1 w0 v0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_v1, pt_v0);
                    break;
                case 55:  // w1 v1 w0 v0 u0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_v1, pt_v0);
                    drawLine(pt_u0, pt_ctr);
                    break;
                case 56:  // w1 v1 u1
                    drawCurve(pt_u1, pt_w1);
                    drawCurve(pt_w1, pt_v1);
                    drawCurve(pt_v1, pt_u1);
                    break;
                case 57:  // w1 v1 u1 u0
                    drawCurve(pt_v1, pt_u0);
                    drawCurve(pt_w1, pt_u1);
                    break;
                case 58:  // w1 v1 u1 v0
                    drawLine(pt_v1, pt_v0);
                    drawCurve(pt_w1, pt_u1);
                    break;
                case 59:  // w1 v1 u1 v0 u0
                    drawLine(pt_v1, pt_v0);
                    drawLine(pt_u1, pt_u0);
                    drawLine(pt_w1, pt_ctr);
                    break;
                case 60:  //  w1 v1 u1 w0
                    drawCurve(pt_w1, pt_u1);
                    drawCurve(pt_v1, pt_w0);
                    break;
                case 61:  //  w1 v1 u1 w0 u0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_u1, pt_u0);
                    drawLine(pt_v1, pt_ctr);
                    break;
                case 62:  //  w1 v1 u1 w0 v0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_v1, pt_v0);
                    drawLine(pt_u1, pt_ctr);
                    break;
                case 63:  //  w1 v1 u1 w0 v0 u0
                    drawLine(pt_w1, pt_w0);
                    drawLine(pt_v1, pt_v0);
                    drawLine(pt_u1, pt_u0);
                    break;
            }
        }
    }

    // draw upon load
    redraw();
}
thisLevel();