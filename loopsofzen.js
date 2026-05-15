// class for holding level setup data
class Square {
    constructor(n, w, s, e, size, shape) {
        this.n = n;
        this.w = w;
        this.s = s;
        this.e = e;
        this.size = size;
        this.shape = shape;
    }

    // implicitly rotates shapes 90 degrees clockwise
    rotate() {
        var temp = this.n;
        this.n = this.w;
        this.w = this.s;
        this.s = this.e;
        this.e = temp;
    }
}

// initialize game-wide values
const current_level_text = document.getElementById("current_level_text")
const level_complete_message = document.getElementById("level_complete_message");
var current_level = 1;
current_level_text.textContent=current_level;
var current_level_max = 1;

// create level inc/dec buttons and button rules
const previous_level_button = document.getElementById("previous_level");
previous_level_button.addEventListener("click", previous_level);
const next_level_button = document.getElementById("next_level");
next_level_button.addEventListener("click", next_level);

function level_buttons_enable_check() {
    if (current_level > 1) {
        previous_level_button.disabled = false
    } else {previous_level_button.disabled = true}

    if (current_level < current_level_max) {
        next_level_button.disabled = false
    } else {next_level_button.disabled = true}
}

level_buttons_enable_check();

function previous_level() {
    current_level -= 1;
    load_new_level();
}

function next_level() {
    current_level += 1;
    load_new_level();
}

function load_new_level() {
    level_complete_message.textContent="";
    current_level_text.textContent=current_level;
    level_buttons_enable_check();
    this_level();
}

// define gameplay
function this_level() {
    // initialize level-wide values
    var puzzle_size = current_level + 1;
    // grid size - this should be separate from m & n because of reasons
    var [num_rows, num_cols] = [puzzle_size, puzzle_size];

    /*
    link_frequency determines likelihood of an edge being a link.
    In the original game, a value of 2.5 is similar to the first 30 levels,
    while 2.0 is good for the next 20.
    This value must be > 1.0 for anything to appear.
    */
    var link_frequency = 2.0;

    // randomly change to 0 (no link) or 1 (link), weighted by link_frequency
    function linkLogic() {
        return Math.min(Math.floor(Math.random() * link_frequency), 1);
    }

    // define north edges
    // create nested array of 0's
    var grid_edges_N = Array.from(Array(num_rows+1), () => new Array(num_cols).fill(0));  
    // first and last row remain 0
    for (var row = 1; row < num_rows; row++) {
        for (var col = 0; col < num_cols; col++) {
            grid_edges_N[row][col] = linkLogic();
        }
    }

    // define west edges in the same way
    var grid_edges_W = Array.from(Array(num_rows), () => new Array(num_cols+1).fill(0));
    for (var row = 0; row < num_rows; row++) {
        for (var col = 1; col < num_cols; col++) {
            grid_edges_W[row][col] = linkLogic();
        }
    }

    // for an extreme case where matrix is null, insert a random 1 as an edge
    var random_row = Math.min(Math.floor(Math.random() * (puzzle_size - 2) + 1), 1);
    var random_col = Math.min(Math.floor(Math.random() * puzzle_size), 1);
    grid_edges_N[random_row][random_col] = 1;

    // create array of puzzle pieces
    var grid_squares = Array.from(Array(num_rows), () => new Array(num_cols));

    // set up canvas
    const canvas = document.getElementById("playwindow");
    const ctx = canvas.getContext("2d");

    canvas.addEventListener('click', canvasClicked);

    // get unit size
    const height = canvas.height;
    var u = height/puzzle_size;  // size of each square

    // define squares
    for (var row = 0; row < num_rows; row++) {
        for (var col = 0; col < num_cols; col++) {
            // create temporary variable square that helps define a new square within this matrix point
            var square = grid_squares[row][col] = new Square(
                                                grid_edges_N[row][col],
                                                grid_edges_W[row][col],
                                                grid_edges_N[row+1][col],
                                                grid_edges_W[row][col+1],
                                                u, 0);

            // at this point the square is a valid net
            // now rotate the square by a rand(1,3) value
            // the floor of 1 avoids automatic puzzle solving (not gracefully)
            var initial_rotation = Math.floor(Math.random() * 3) + 1;
            for (var i = 0; i < initial_rotation; i++) {
                square.rotate();
            }
        }
    }

    var levelComplete = false;

    function redraw() {
        // retrieve the canvas and clear it
        ctx.clearRect(0, 0, height, height);
        ctx.fillStyle = "white";

        // draw squares
        for (var row = 0; row < num_rows; row++) {
            for (var col = 0; col < num_cols; col++) {
                // select square to draw
                thisSquare = grid_squares[row][col];

                // determine if north and west edges are appropriately matched
                // to corresponding south and east edges
                // if a mismatch is detected, the puzzle is not complete
                // and levelComplete switches to False

                // check inner edges
                if (row > 0) {
                    if (thisSquare.n != grid_squares[row-1][col].s) {
                        levelComplete = false;
                    }
                }
                // check outer edges
                else if (row == 0) {
                    if (thisSquare.n != 0) {
                        levelComplete = false;
                    }
                } else if (row == num_rows) {
                    if (this.Square.s != 0) {
                        levelComplete = false;
                    }
                }

                // check inner edges
                if (col > 0) {
                    if (thisSquare.w != grid_squares[row][col-1].e) {
                        levelComplete = false;
                    }
                }
                // check outer edges
                else if (col == 0)  {
                    if (thisSquare.w != 0) {
                        levelComplete = false;
                    }
                } else if (col == num_cols) {
                    if (this.Square.e != 0) {
                        levelComplete = false;
                    }
                }  

                // calculate shape which will determine drawing
                shape = thisSquare.n*8 + thisSquare.w*4 + thisSquare.s*2 + thisSquare.e;
                // draw shapes
                ctx.lineWidth = u / 6;
                // ctx.lineCap = "round";  this needs layering in order to function
                var end_cap_size = u / 6;

                // abstract out face points where line segments end
                var pt_ctr = [u * (col+0.5), u * (row+0.5)];
                var pt_n = [u * (col+0.5), u * (row)];
                var pt_w = [u * (col), u * (row+0.5)];
                var pt_s = [u * (col+0.5), u * (row+1)];
                var pt_e = [u * (col+1), u * (row+0.5)];

                // drawing functions
                function drawTerminator(a) {
                    ctx.beginPath();
                    ctx.moveTo(a[0], a[1]);
                    ctx.lineTo(pt_ctr[0], pt_ctr[1]);
                    ctx.stroke();
                    ctx.beginPath();
                    // arc(x, y, radius, rad begin, rad end)
                    ctx.arc(pt_ctr[0], pt_ctr[1], end_cap_size, 0, 2*Math.PI);
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
                
                // draw square
                switch (shape) {
                    case 0:  // empty square
                        break;
                    case 1: // E
                        drawTerminator(pt_e);
                        break;
                    case 2: // S
                        drawTerminator(pt_s);
                        break;
                    case 3: // S E
                        drawCurve(pt_e, pt_s);
                        break;
                    case 4: // W
                        drawTerminator(pt_w);
                        break;
                    case 5:  // W E
                        drawLine(pt_w, pt_e);
                        break;
                    case 6:  // W S
                        drawCurve(pt_w, pt_s);
                        break;
                    case 7:  // W S E
                        drawCurve(pt_e, pt_s);
                        drawCurve(pt_s, pt_w);
                        break;
                    case 8:  // N
                        drawTerminator(pt_n);
                        break;                        
                    case 9:  // N E
                        drawCurve(pt_n, pt_e);
                        break;
                    case 10:  // N S
                        drawLine(pt_n, pt_s);
                        break;
                    case 11:  // N S E
                        drawCurve(pt_n, pt_e);
                        drawCurve(pt_e, pt_s);
                        break;
                    case 12:  // N W
                        drawCurve(pt_n, pt_w);
                        break;
                    case 13:  // N W E
                        drawCurve(pt_e, pt_n);
                        drawCurve(pt_n, pt_w);
                        break;
                    case 14:  // N W S
                        drawCurve(pt_n, pt_w);
                        drawCurve(pt_w, pt_s);
                        break;
                    case 15:  // N W S E
                        drawCurve(pt_n, pt_w);
                        drawCurve(pt_w, pt_s);
                        drawCurve(pt_s, pt_e);
                        drawCurve(pt_e, pt_n);
                        break;
                }
            }
        }
    }

    // draw upon load
    redraw();

    function canvasClicked(event) {
        // only enable canvas click events if the level is not complete
        if (!levelComplete) {
            // determine element that was clicked
            var col = Math.floor(event.offsetX / u);
            var row = Math.floor(event.offsetY / u);
            var clicked_square = grid_squares[row][col];

            // set bool for a completed puzzle
            levelComplete = true;
            
            // rotate this square
            clicked_square.rotate();

            // clear and redraw canvas, determine if levelComplete
            redraw();

            // if levelComplete is still true, no mismatched edges were detected. game ends
            if (levelComplete) {
                // show message
                level_complete_message.textContent="Level complete!";
                current_level_max += 1;
                level_buttons_enable_check();
            }
            // if false, click events are re-enabled
        }   
    }
}

this_level();