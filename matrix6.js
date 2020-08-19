var frame_delay_min = 70;
var frame_delay_resize = 500;
var double_click_delay = 200;
var easter_egg_banner_durability = 3;   // How many flows could wash a banner


var screen = {
    width: 0,
    height: 0,
    root: undefined,
    cell: [],
    flow: [],
    paused: false,
    theme: 'green',
    frame_timer: undefined,
    user: {
        pause: false,
        resized: false,
        double_click: false,
        single_click_timer: undefined,
    },
};


var easter_egg = {
    year: 0,
    month: 0,
    day: 0,
    banner: {},
    christmas: false,
    new_year: false,
    last_easter_egg: undefined,
};


function flow (col, head, len, visible) {
    this.visible = visible;
    this.col = col;
    this.head = head;
    this.tail = head - len;

    this.move = function () {
        if (this.visible && 0 <= this.head && this.head < screen.height) {
            screen.cell[this.head][this.col].removeClass('head');
        }
        this.head++;
        if (this.visible && 0 <= this.head && this.head < screen.height) {
            screen.cell[this.head][this.col].removeClass();

            let classes = ['cell'];
            classes.push(rand_bright() ? 'bright' : 'dark');
            classes.push('head');

            let key = serialize_coord(this.head, this.col);
            if (typeof easter_egg.banner[key] === 'string') {
                screen.cell[this.head][this.col].text(easter_egg.banner[key]);
                easter_egg.banner[key] = easter_egg_banner_durability;
                classes.push('gold');

            } else if (typeof easter_egg.banner[key] === 'number') {
                easter_egg.banner[key] -= 1;
                if (easter_egg.banner[key] <= 0) {
                    delete easter_egg.banner[key];
                }
                classes.push('gold');

            } else {
                classes.push(screen.theme);
                screen.cell[this.head][this.col].text(rand_char(this.head, this.col));
            }

            screen.cell[this.head][this.col].addClass(classes);
        }

        let key = serialize_coord(this.tail, this.col);
        if (this.visible && 0 <= this.tail && this.tail < screen.height) {
            if (typeof easter_egg.banner[key] === 'string') {
                screen.cell[this.tail][this.col].text(easter_egg.banner[key]);
                screen.cell[this.tail][this.col].addClass('gold');
                easter_egg.banner[key] = easter_egg_banner_durability;

            } else if (typeof easter_egg.banner[key] === 'number') {

            } else {
                screen.cell[this.tail][this.col].addClass('black');
            }
        }
        this.tail++;
    };

    this.finished = function () {
        return screen.height <= this.tail;
    };
}


$(function init () {
    console.log('https://github.com/pi314/matrix6/');

    var param = window.location.search.replace(/^\?/g, '').split('&');
    for (let i in param) {
        console.log(param);
        var tmp = param[i].split('=');
        var key = tmp[0];
        var val = tmp[1];

        switch (key.toLowerCase()) {
            case 'delay':
                frame_delay_min = parseInt(val);
                frame_delay_min = Math.max(0, 30);
                break;
        }
    }

    screen.root = $('#screen');
    screen.root.empty();

    soft_reset();

    screen.frame_timer = setTimeout(next_frame, frame_delay_min);

    $(window).resize(function () {
        screen.user.resized = true;

    }).keydown(function (event) {
        if (event.which == 13) {
            easter_egg_trigger();
        } else if (event.which == 32) {
            toggle_pause();
        }

    }).mousedown(function () {
        if (screen.user.single_click_timer) {
            clearTimeout(screen.user.single_click_timer);
            screen.user.single_click_timer = undefined;
            if (screen.paused) {
                return;
            }

            if (screen.theme == 'green') {
                screen.theme = 'cyan';
            } else {
                screen.theme = 'green';
            }
            return;
        }

        screen.user.single_click_timer = setTimeout(function () {
            screen.user.single_click_timer = undefined;
            toggle_pause();
        }, double_click_delay);
    });
});


function toggle_pause () {
    if (screen.user.pause != screen.paused) {
        return;
    }

    screen.user.pause = !screen.user.pause;
    if (!screen.user.pause && screen.paused) {
        if (screen.frame_timer) {
            clearTimeout(screen.frame_timer);
        }
        screen.frame_timer = setTimeout(next_frame, frame_delay_min);
    }
}


function soft_reset () {
    var window_width = window.innerWidth;
    var window_height = window.innerHeight;
    var text_width = $('#sample').width();
    var text_height = $('#sample').height();

    var screen_height_old = 0;

    if (screen.height > 0) {
        screen_height_old = screen.height;
    }

    screen.width = Math.floor(window_width / text_width);
    screen.height = Math.floor(window_height / text_height);

    // Cut off unnecessary rows
    for (var r = screen.height; r < screen.cell.length; r++) {
        screen.cell[r][0].parent().remove();
    }
    screen.cell = screen.cell.slice(0, screen.height);

    // Cut off unnecessary columns
    for (var r = 0; r < screen.cell.length; r++) {
        for (var c = screen.width; c < screen.cell[r].length; c++) {
            screen.cell[r][c].remove();
        }
        screen.cell[r] = screen.cell[r].slice(0, screen.width);
        screen.flow = screen.flow.slice(0, screen.width);
    }

    // Append rows and columns if necessary
    for (var r = 0; r < screen.height; r++) {
        var new_row = false;
        var row = null;
        if (r >= screen.cell.length) {
            new_row = true;
        }

        if (new_row) {
            row = $('<div class="row">');
            screen.cell[r] = [];
        } else {
            row = screen.cell[r][0].parent();
        }

        for (var c = screen.cell[r].length; c < screen.width; c++) {
            new_col = true;
            screen.cell[r][c] = $('<span class="cell black">');
            screen.cell[r][c].text('|');
            row.append(screen.cell[r][c]);
        }

        if (new_row) {
            screen.root.append(row);
        }
    }

    // Append new flows if necessary
    for (var c = screen.flow.length; c < screen.width; c++) {
        if (c % 2 == 0) {
            screen.flow[c] = [new flow(c, -rand_head(), rand_len(), rand_bright())];
        } else {
            screen.flow[c] = [];
        }
    }

    // Prevent flows out of screen (before resizing) to suddently show up
    for (var c = 0; c < screen.width; c++) {
        for (var f = 0; f < screen.flow[c].length; f++) {
            if (screen.flow[c][f].tail >= screen_height_old || screen.flow[c][f].head >= screen_height_old) {
                screen.flow[c][f].visible = false;
            }
        }
    }
}


function easter_egg_trigger () {
    let easter_egg_text = '';

    if (easter_egg.christmas) {
        easter_egg_text = 'MerryChristmas';
    } else if (easter_egg.new_year) {
        easter_egg_text = 'HappyNewYear';
    } else {
        let space = [
            'You are good',
            'Be nice to yourself',
            "Don't worry",
            'Everything will be fine',
            'Believe in yourself',
            'Follow your heart',
            'Dawn will come',
            'Stay determined',
            'Have a nice day',
        ];

        let idx = 0;
        do {
            idx = Math.floor(Math.random() * space.length);
        } while(easter_egg.last_easter_egg === idx);

        easter_egg_text = space[idx];
        easter_egg.last_easter_egg = idx;
    }

    if (!easter_egg_text.length) {
        return;
    }

    let easter_egg_banner = [
        ' '.repeat(easter_egg_text.length + 2),
        ' ' + easter_egg_text + ' ',
        ' '.repeat(easter_egg_text.length + 2),
    ];

    for (var i = 0; i < 5; i++) {
        let a = screen.height;
        let row = Math.floor(Math.random() * (a - easter_egg_banner.length));
        let b = (screen.width / 2) - easter_egg_banner[0].length;
        let easter_egg_start = Math.floor(Math.random() * b) * 2;
        let easter_egg_end = easter_egg_start + 2 * easter_egg_banner[0].length;
        let retry = false;

        // If the banner center line will overlap the other, change position
        for (var col = easter_egg_start; col < easter_egg_end; col += 2) {
            if (serialize_coord(row + 1, col) in easter_egg.banner) {
                retry = true;
            }
        }

        if (retry) {
            continue;
        }

        for (var line = 0; line < easter_egg_banner.length; line++) {
            for (var col = easter_egg_start; col < easter_egg_end; col += 2) {
                let ch = easter_egg_banner[line][Math.floor((col - easter_egg_start) / 2)];
                easter_egg.banner[serialize_coord(row + line, col)] = ch;
            }
        }
        break;
    }
}


function serialize_coord (row, col) {
    return [row, col].join(',')
}


function rand_char (row, col) {
    let sample_space = '1234567890-=!@#$%^&*()+qwertyuiop[]QWERTYUIOP{}asdfghjkl;ASDFGHJKL:zxcvbnm/ZXCVBNM<>?';
    let idx = Math.floor(Math.random() * sample_space.length);

    return sample_space[idx];
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
    screen.frame_timer = undefined;
    screen.paused = false;

    if (screen.user.pause) {
        screen.paused = true;
        return;
    }

    if (screen.user.resized) {
        soft_reset();
        screen.user.resized = false;

        screen.frame_timer = setTimeout(next_frame, frame_delay_resize);
        return;
    }

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

    var today = new Date();
    easter_egg.year = today.getFullYear();
    easter_egg.month = today.getMonth();
    easter_egg.day = today.getDate();

    if (easter_egg.month == 11 && easter_egg.day == 25) {
        easter_egg.christmas = true;
    } else if ((easter_egg.month == 11 && easter_egg.day >= 29) || (easter_egg.month == 0 && easter_egg.day <= 04)) {
        easter_egg.new_year = true;
    }

    screen.frame_timer = setTimeout(next_frame, frame_delay_min);
}
