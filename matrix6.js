var frame_delay_min = 70;

var pause = false;
var paused = false;


var screen = {
    width: 0,
    height: 0,
    root: undefined,
    cell: [],
    flow: [],
};


function flow (col, head, len, visible) {
    this.visible = visible;
    this.col = col;
    this.head = head;
    this.tail = head - len;

    this.move = function () {
        this.head++;
        if (this.visible && 0 <= this.head && this.head < screen.height) {
            screen.cell[this.head][this.col].text(rand_char());
            screen.cell[this.head][this.col].removeClass('black bright dark');
            screen.cell[this.head][this.col].addClass(rand_bright() ? 'bright' : 'dark');
        }

        if (this.visible && 0 <= this.tail && this.tail < screen.height) {
            screen.cell[this.tail][this.col].addClass('black');
        }
        this.tail++;
    };

    this.finished = function () {
        return screen.height <= this.tail;
    };
}


$(function init () {
    var window_width = window.innerWidth;
    var window_height = window.innerHeight;
    var text_width = $('#sample').width();
    var text_height = $('#sample').height();

    screen.root = $('#screen');

    screen.width = Math.floor(window_width / text_width);
    screen.height = Math.floor(window_height / text_height);

    screen.root.empty();

    screen.cell = [];
    screen.flow = [];

    for (var r = 0; r < screen.height; r++) {
        var row = $('<div class="row">');
        screen.cell[r] = [];
        for (var c = 0; c < screen.width; c++) {
            screen.cell[r][c] = $('<span class="cell black">');
            screen.cell[r][c].text('|');
            row.append(screen.cell[r][c]);

            if (c % 2 == 0) {
                screen.flow[c] = [new flow(c, -rand_head(), rand_len(), rand_bright())];
            } else {
                screen.flow[c] = [];
            }
        }
        screen.root.append(row);
    }

    setTimeout(function () {
        next_frame();
    }, frame_delay_min);

    $(window).keydown(function (event) {
        if (event.which == 32) {
            pause = !pause;
            if (!pause && paused) {
                setTimeout(function () {
                    next_frame();
                }, frame_delay_min);
            }
        }
    });
});


function rand_char () {
    var sample_space = '1234567890-=!@#$%^&*()_+qwertyuiop[]QWERTYUIOP{}asdfghjkl;ASDFGHJKL:zxcvbnm/ZXCVBNM<>?';
    return sample_space[Math.floor(Math.random() * sample_space.length)];
}


function rand_bright () {
    return (Math.floor(Math.random() * 50) % 2 == 0) ? true : false;
}


function rand_head () {
    return Math.floor(Math.random() * (screen.height / 2) + 4);
}


function rand_len () {
    return Math.floor(Math.random() * (screen.height * 4 / 5) + screen.height / 8);
}


function next_frame () {
    for (var c = 0; c < screen.width; c++) {
        for (var f = 0; f < screen.flow[c].length; f++) {
            screen.flow[c][f].move();

            if (screen.flow[c][f].tail == 0) {
                screen.flow[c].push(new flow(c, -1, rand_len(), !(screen.flow[c][f].visible)));
                break;
            }

        }

        screen.flow[c] = screen.flow[c].filter(function (elem) {
            return !elem.finished();
        })
    }

    if (pause) {
        paused = true;
    } else {
        setTimeout(function () {
            next_frame();
        }, frame_delay_min);
    }
}
