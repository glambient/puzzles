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
var current_level_max = 1;
current_level_text.textContent=current_level;

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
    var num_rows = puzzle_size;
    var num_cols = puzzle_size;

    /*
    link_frequency determines likelihood of an edge being a link.
    In the original game, a value of 2.5 is similar to the first 30 levels,
    while 2.0 is good for the next 20.
    This value must be > 1.0 for anything to appear.
    */
    var link_frequency = 2.0;

    // define north edges
    var grid_edges_N = Array.from(Array(num_rows+1), () => new Array(num_cols).fill(0));  // creates nested array of 0's
    for (var row = 1; row < num_rows; row++) {
        for (var col = 0; col < num_cols; col++) {
            grid_edges_N[row][col] = Math.min(Math.floor(Math.random() * link_frequency), 1);
        }
    }

    // define west edges
    var grid_edges_W = Array.from(Array(num_rows), () => new Array(num_cols+1).fill(0));
    for (var row = 0; row < num_rows; row++) {
        for (var col = 1; col < num_cols; col++) {
            grid_edges_W[row][col] = Math.min(Math.floor(Math.random() * link_frequency), 1);
        }
    }

    // for an extreme case where matrix is null
    // insert a random 1 as an edge
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

        for (var row = 0; row < num_rows; row++) {
            for (var col = 0; col < num_cols; col++) {
                // select correct square
                thisSquare = grid_squares[row][col];

                // determine if north and west edges are appropriately matched
                // to corresponding south and east edges
                // if a mismatch is detected, the puzzle is not complete

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
                
                // draw square
                switch (shape) {
                    case 0:  // empty square
                        break;
                    case 1:
                        ctx.beginPath();
                        ctx.moveTo(u*(col+1), u*(row+0.5));
                        ctx.lineTo(u*(col+0.5), u*(row+0.5));
                        ctx.stroke();
                        ctx.beginPath();
                        // arc(x, y, radius, rad begin, rad end)
                        ctx.arc(u*(col+0.5), u*(row+0.5), end_cap_size, 0, 2*Math.PI);
                        ctx.fill();
                        ctx.stroke();
                        break;
                    case 2:
                        ctx.beginPath();
                        ctx.moveTo(u*(col+0.5), u*(row+1));
                        ctx.lineTo(u*(col+0.5), u*(row+0.5));
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col+0.5), u*(row+0.5), end_cap_size, 0, 2*Math.PI);
                        ctx.fill();
                        ctx.stroke();
                        break;
                    case 3:
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row+1), u/2, Math.PI, 1.5*Math.PI);
                        ctx.stroke();
                        break;
                    case 4:
                        ctx.beginPath();
                        ctx.moveTo(u*(col), u*(row+0.5));
                        ctx.lineTo(u*(col+0.5), u*(row+0.5));
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col+0.5), u*(row+0.5), end_cap_size, 0, 2*Math.PI);
                        ctx.fill();
                        ctx.stroke();
                        break;
                    case 5:  // horizontal line
                        ctx.beginPath();
                        ctx.moveTo(u*(col), u*(row+0.5));
                        ctx.lineTo(u*(col+1), u*(row+0.5));
                        ctx.stroke();
                        break;
                    case 6:
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row+1), u/2, 1.5*Math.PI, 2*Math.PI);
                        ctx.stroke();
                        break;
                    case 7:  // 3 & 6
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row+1), u/2, 1.5*Math.PI, 2*Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row+1), u/2, Math.PI, 1.5*Math.PI);
                        ctx.stroke();
                        break;
                    case 8:
                        ctx.beginPath();
                        ctx.moveTo(u*(col+0.5), u*(row));
                        ctx.lineTo(u*(col+0.5), u*(row+0.5));
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col+0.5), u*(row+0.5), end_cap_size, 0, 2*Math.PI);
                        ctx.fill();
                        ctx.stroke();
                        break;                        
                    case 9:
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row), u/2, 0.5*Math.PI, Math.PI);
                        ctx.stroke();
                        break;
                    case 10:  // vertical line
                        ctx.beginPath();
                        ctx.moveTo(u*(col+0.5), u*(row));
                        ctx.lineTo(u*(col+0.5), u*(row+1));
                        ctx.stroke();
                        break;
                    case 11:  // 3 & 9
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row+1), u/2, Math.PI, 1.5*Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row), u/2, 0.5*Math.PI, Math.PI);
                        ctx.stroke();
                        break;
                    case 12:
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row), u/2, 0, 0.5*Math.PI);
                        ctx.stroke();
                        break;
                    case 13:  // 9 & 12
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row), u/2, 0.5*Math.PI, Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row), u/2, 0, 0.5*Math.PI);
                        ctx.stroke();
                        break;
                    case 14:  // 6 & 12
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row), u/2, 0, 0.5*Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row+1), u/2, 1.5*Math.PI, 2*Math.PI);
                        ctx.stroke();
                        break;
                    case 15:  // 3 & 6 & 9 & 12
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row+1), u/2, Math.PI, 1.5*Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col+1), u*(row), u/2, 0.5*Math.PI, Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row), u/2, 0, 0.5*Math.PI);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(u*(col), u*(row+1), u/2, 1.5*Math.PI, 2*Math.PI);
                        ctx.stroke();
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
            var col = Math.floor(event.pageX / u);
            var row = Math.floor(event.pageY / u);
            var clicked_square = grid_squares[row][col];

            // set bool for a completed puzzle
            levelComplete = true;
            
            // rotate this square
            clicked_square.rotate();

            // clear and redraw canvas
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