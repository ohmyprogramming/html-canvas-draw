/*                                                                            */
/* Copyright (C) ohmyprogramming <github.com/ohmyprogramming>                 */
/*                                                                            */
/* HTML Canvas Drawing App, Which takes in coordinates of the drawed lines    */
/* and converts those points into Bezier curves for a better and smoother     */
/* representation of the drawing.                                             */
/*                                                                            */
/* Created: 2022-05-03 11:26 AM                                               */
/* Updated: 2022-06-20 02:13 PM                                               */
/*                                                                            */

/*                                                                            */
/* TODO(oxou):                                                                */
/* [ ] Undo/Redo support                                                      */
/* [X] Change brush size                                                      */
/*                                                                            */

var app = [];

app.canvas_element = document.querySelector("canvas#canvas-main");
app.canvas_context = app.canvas_element.getContext("2d");

app.options = [];
app.options.colors = [
    ["white",  "#fff"],
    ["black",  "#000"],
    ["gray",   "#888"],
    ["red",    "#f00"],
    ["green",  "#0f0"],
    ["blue",   "#00f"],
    ["cyan",   "#0ff"],
    ["yellow", "#ff0"],
    ["pink",   "#f0f"]
];

app.options.brushes = [
    // Cursor size, Brush Size (lineWidth)
    // 16 * 0.315 is formula for calculating the lineWidth
    [16,5],
    [24,8],
    [32,10],
    [40,13],
    [48,15],
    [56,18],
    [64,20],
];

app.options_element = document.querySelector("#options");
app.colors_element = document.querySelector("#colors");
app.brushes_element = document.querySelector("#brushes");

app.options.colors.forEach(function(color_object) {
    let color_name = color_object[0];
    let color_value = color_object[1];
    let color = document.createElement("div");
    color.setAttribute("class", "color " + color_name);
    color.style.backgroundColor = color_value;
    color.onclick = function() {
        set_brush_color(color_value);
    };
    app.colors_element.appendChild(color);
});

app.options.brushes.forEach(function(brush_object) {
    let cursor_size = brush_object[0];
    let brush_size = brush_object[1];
    let brush = document.createElement("div");
    brush.setAttribute("class", "brush brush-" + cursor_size);
    brush.onclick = function() {
        set_brush_size(brush_size);
        set_brush_cursor_size(cursor_size);
    };
    app.brushes_element.appendChild(brush);
});

function set_brush_color(v) {
    app.user.selectedColor = v;
}

function set_brush_size(v) {
    app.user.brushSize = v;
}

function set_brush_cursor_size(v) {
    app.canvas_element.setAttribute("class", "cursor-" + v);
}

app.element = [];

app.user = [];
app.user.selectedColor = "#f00";
app.user.brushSize = 5;

app.element.colors = document.querySelectorAll("#colors .color");
app.element.brushes = app.element.colors;

app.dpbuffer = []; // Drawn-points buffer, points in buffer that will be
                   // converted to bezier curves when onmouseup event is fired

app.mouse = [];
app.mouse.down = false; // mousedown state, used in the canvas mouse events

// Canvas context functions, directly tied to app.canvas_context
var cv = [];

cv.el  = app.canvas_element;
cv.tie = app.canvas_context; // tie as in "tied to", or ctx as in "context"

cv.imagedata = null;
cv.last_x = 0;
cv.last_y = 0;

cv.get_wh = function() {
    return [cv.el.clientWidth, cv.el.clientHeight];
};

cv.save_image_data = function() {
    let dim = cv.get_wh();
    cv.imagedata = cv.tie.getImageData(0, 0, dim[0], dim[1]);
};

cv.load_image_data = function() {
    cv.tie.putImageData(cv.imagedata, 0, 0);
    cv.imagedata = null; // Clear the image data
};

cv.pixel_at = function(x, y, color) {
    cv.tie.beginPath();
    cv.tie.strokeStyle = color || "#fff";
    cv.tie.fillStyle = color || "#fff";
    cv.tie.fillRect(x, y, 4, 4);
    cv.tie.stroke();
    cv.tie.closePath();

    app.dpbuffer.push(x, y);
};

cv.line = function(x1, y1, x2, y2, color) {
    cv.tie.beginPath();
    cv.tie.strokeStyle = color || "#000";
    cv.tie.moveTo(x1, y1);
    cv.tie.lineTo(x2, y2);
    cv.tie.stroke();
    cv.tie.closePath();
};

cv.body_glue = function() {
    cv.tie.width = document.body.offsetWidth;
    cv.tie.height = document.body.offsetHeight;
    cv.el.width = document.body.offsetWidth;
    cv.el.height = document.body.offsetHeight;
};

cv.clear = function() {
    let dim = cv.get_wh();
    cv.tie.clearRect(0, 0, dim[0], dim[1]);
};

cv.bezier = function(cp1x, cp1y, cp2x, cp2y, x, y) {
    cv.tie.beginPath();
    cv.tie.moveTo(x, y);
    cv.tie.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    cv.tie.stroke();
};

cv.dpbuffer_connect_dots = function() {
    let pt = app.dpbuffer;
    let sz = pt.length;

    if (sz == 0)
        return;

    let lx, ly = 0;

    lx = pt[0];
    ly = pt[1];

    for (i = 0, j = 0; i < sz; i += 2) {
        x = pt[ i ];
        y = pt[ i + 1 ];

        cv.tie.beginPath();
        cv.tie.lineCap = "round"
        cv.tie.lineJoin = "round"
        cv.tie.strokeStyle = app.user.selectedColor;
        cv.tie.moveTo(lx + 2, ly + 2);
        cv.tie.lineTo(x + 2, y + 2);
        cv.tie.lineWidth = app.user.brushSize;
        cv.tie.stroke();

        lx = x;
        ly = y;
    }

    cv.tie.closePath();

    app.dpbuffer = [];
};


// EVENT MouseDown
cv.el.onmousedown =
cv.el.ontouchstart = function(ev) {
    // (which = 1 || button = 0) = MOUSE_BUTTON_PRIMARY
    if (ev.which == 1) {
        app.mouse.down = true;

        // Draw the initial pixel when the primary button is pressed
        cv.pixel_at(
            ev.clientX - 2,
            ev.clientY - 2,
            "#fff"
        );

        return;
    }

    app.mouse.down = false;
};

// EVENT MouseMove
cv.el.onmousemove =
cv.el.ontouchmove = function(ev) {
    if (app.mouse.down == false)
        return;

    let mx, my = 0;

    mx = ev.clientX - 2;
    my = ev.clientY - 2;

    cv.pixel_at(
        mx,
        my,
        "#fff"
    );
};

// EVENT MouseUp & MouseLeave
cv.el.onmouseup =
cv.el.onmouseleave =
cv.el.ontouchcancel =
cv.el.ontouchend = function(ev) {
    app.mouse.down = false;
    cv.dpbuffer_connect_dots();
};

/* -------------------------------------------------------------------------- */

document.body.onresize = function(ev) {
    cv.save_image_data();
    cv.body_glue(); // FIXME: Not working when saving and loading imagedata?
    cv.load_image_data();
    cv.update_onscreen_size();
};

cv.body_glue();

cv.update_onscreen_size = function() {
    let canvas_size = cv.get_wh();
    app.canvas_size_element.innerText = canvas_size[0] + "x" + canvas_size[1];
}

app.canvas_size_element = document.querySelector("#canvas-size");
cv.update_onscreen_size();

function xy_interp(x1, y1, x2, y2, step = 10) {
    let p1 = [x1, y1],
        p2 = [x2, y2];

    let new_dpbuffer = [];

    for (let i = 0; i < step; i++) {

    }
}