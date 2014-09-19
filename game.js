'use strict';



/**
 * @constructor
 */
function Game() {}


/**
 * Bind DOM Nodes
 * @param {DOMNode} parent Game parent node.
 * @return {Object} instance.
 */
Game.prototype.init = function(parent) {
  this.min_mines = 8;
  this.max_size = 50;

  parent.innerHTML = document.querySelector('#tpl_game').innerHTML;

  this.root = parent.querySelector('.outer');
  this.form = parent.querySelector('form');

  this.icon = this.root.querySelector('.icon');
  this.inner = this.root.querySelector('.game');

  this.digit_time = this.root.querySelector('.time');
  this.digit_mines = this.root.querySelector('.mines');

  this.form.addEventListener('submit', this.settings.bind(this));
  this.form.addEventListener('change', this.settings.bind(this));
  this.icon.addEventListener('mousedown', this.setup.bind(this));
  this.inner.addEventListener('mousedown', this.mousedown.bind(this));

  this.settings();

  return this;
};


/**
 * Set up game
 * @param {Event} e Submit form event.
 */
Game.prototype.settings = function(e) {
  e && e.preventDefault();
  var level = this.form.querySelector('input[name="level"]:checked').value;
  switch (level) {
    case 'beginner':
        this.width = 8;
        this.height = 8;
        this.mines = 10;
      break;
    case 'intermediate':
        this.width = 16;
        this.height = 16;
        this.mines = 40;
      break;
    case 'expert':
        this.width = 30;
        this.height = 16;
        this.mines = 99;
      break;
    case 'custom':
        this.verify();
      break;
  }

  this.setup();
};


/**
 * Init board and counters
 */
Game.prototype.setup = function() {
  this.state = 'pause';
  this.root.className = 'outer';
  this.cells = this.width * this.height;
  this.digit(this.digit_time, 0);
  this.digit(this.digit_mines, this.mines);
  this.icon.removeAttribute('data-value');

  this.open_cells = 0;
  this.flags = 0;

  this.allocate();
  this.draw();

  this.timer && window.clearInterval(this.timer);
  this.timer = 0;
};


/**
 * Check min and max values for width, height, mines
 * and update form fields
 */
Game.prototype.verify = function() {
  var min = this.min_mines,
      max = this.max_size,
      width = this.form.querySelector('[name="width"]'),
      height = this.form.querySelector('[name="height"]'),
      mines = this.form.querySelector('[name="mines"]');

  this.width = Math.min(Math.max(width.value | 0, min), max);
  this.height = Math.min(Math.max(height.value | 0, min), max);

  this.cells = this.width * this.height;
  this.mines = Math.max(Math.min(this.cells - 1, mines.value | 0), 1);

  width.value = this.width;
  height.value = this.height;
  mines.value = this.mines;
};


/**
 * Start game
 * @param {Number} x First click column.
 * @param {Number} y First click row.
 */
Game.prototype.start = function(x, y) {
  this.state = 'game';
  this.fill(x, y);
  this.starttime = new Date().getTime();
  this.timer = window.setInterval(this.time.bind(this), 1000);
  this.time();
};


/**
 * Process mousedown
 * @param {MouseEvent} e Mousedown.
 */
Game.prototype.mousedown = function(e) {
  if (e.target.nodeName !== 'TD') return;
  e.stopPropagation();
  e.preventDefault();
  var x = e.target.cellIndex,
      y = e.target.parentNode.rowIndex;

  if (this.state === 'end') return;
  if (this.state === 'pause') {this.start(x, y);}

  var rightClick = e.altKey || e.ctrlKey || e.metaKey;
  if (e.button === 0 && !rightClick) {this.click([x, y]);}
  if (e.button === 2 || rightClick) {this.flag(x, y);}
};


/**
 * Set/remove flag mark
 * @param {Number} x Column.
 * @param {Number} y Row.
 */
Game.prototype.flag = function(x, y) {
  var cell = this.table.rows[y].cells[x];
  if (cell.className === 'flag') {
    cell.removeAttribute('class');
    this.flags--;
  }
  else if (cell.className === '') {
    cell.className = 'flag';
    this.flags++;
  }
  this.digit(this.digit_mines, this.mines - this.flags);
};


/**
 * Game time
 */
Game.prototype.time = function() {
  var time = Math.round((new Date().getTime() - this.starttime) / 1000);
  this.digit(this.digit_time, time);
};


/**
 * Click cell
 * @param {Array} p [x, y].
 */
Game.prototype.click = function(p) {
  var x = p[0],
      y = p[1];
  if (this.table.rows[y].cells[x].className !== '') return;

  if (this.board[y][x] === 9) {
    this.table.rows[y].cells[x].className = 'fire';
    this.end();
  }
  else {
    this.open(x, y);
    if (this.board[y][x] === 0) {
      this.around(x, y).forEach(this.click, this);
    }
  }
};


/**
 * Get cell coordinates around x, y
 * @param {Number} x Column.
 * @param {Number} y Row.
 * @return {Array} coordinates.
 */
Game.prototype.around = function(x, y) {
  return [
    [x, y - 1], [x, y + 1],
    [x - 1, y - 1], [x - 1, y], [x - 1, y + 1],
    [x + 1, y - 1], [x + 1, y], [x + 1, y + 1]
  ].filter(function(p) {
    return (p[0] >= 0 && p[0] < this.width && p[1] >= 0 && p[1] < this.height);
  }, this);
};


/**
 * Open cell
 * @param {Number} x Column.
 * @param {Number} y Row.
 */
Game.prototype.open = function(x, y) {
  var val = this.board[y][x];
  this.table.rows[y].cells[x].className = 'open' + val;
  if (val > 0) {
    this.table.rows[y].cells[x].textContent = val;
  }
  this.open_cells++;
  if (this.cells - this.open_cells === this.mines) {
    this.end(true);
  }
};


/**
 * Draw board
 */
Game.prototype.draw = function() {
  var html = [];
  html.push('<table width="', this.width * 20 ,'">');
  for (var i = 0; i < this.height; i++) {
    html.push('<tr>');
    for (var j = 0; j < this.width; j++) {
      html.push('<td></td>');
    }
    html.push('</tr>');
  }
  html.push('</table>');
  this.inner.innerHTML = html.join('');
  this.table = this.inner.firstChild;
};


/**
 * Create two dimension array and fill with default values
 */
Game.prototype.allocate = function() {
  var val = this.mines > this.cells / 2 ? 9 : 0;
  var row = [];
  for (var i = 0; i < this.width; i++) { row[i] = val; }
  this.board = [];
  for (var j = 0; j < this.height; j++) { this.board[j] = row.slice() }
};


/**
 * Fill mines randomly except first click cell
 * @param {Number} ex First click column.
 * @param {Number} ey First click row.
 */
Game.prototype.fill = function(ex, ey) {
  var val = this.board[0][0] ? 0 : 9;
  var len = val ? this.mines : this.cells - this.mines;
  if (val === 0) {
    this.board[ey][ex] = 0;
    len--;
  }
  while (len > 0) {
    var rand = Math.round((this.cells - 1) * Math.random()),
        x = rand % this.width,
        y = (rand - x) / this.width;
    if (x === ex && y === ey) continue;
    if (this.board[y][x] !== val) {
      this.board[y][x] = val;
      len--;
    }
  }
  this.count();
};


/**
 * Count mines for all cells
 */
Game.prototype.count = function() {
  var board = this.board;
  function mine(p) { return board[p[1]][p[0]] === 9 ? 1 : 0; }
  function sum(p, c) { return p + c; };

  for (var i = 0; i < this.height; i++) {
    for (var j = 0; j < this.width; j++) {
      if (board[i][j] !== 9) {
        board[i][j] = this.around(j, i).map(mine).reduce(sum);
      }
    }
  }
};


/**
 * Show number in digits
 * @param {DOMNode} node Container.
 * @param {Number} value Value.
 */
Game.prototype.digit = function(node, value) {
  value = Math.max(value, -99) | 0;
  var digits = node.querySelectorAll('.digit'),
      val_str = (value / 1000).toFixed(3).substr(-3);
  val_str = value < 0 ? '-' + val_str.substr(1) : val_str;
  for (var i = 0; i < 3; i++) {
    digits[i].setAttribute('data-value', val_str[i]);
  }
};


/**
 * Show all mines
 * @param {String} type Class name 'flag' or 'mine'.
 */
Game.prototype.resume = function(type) {
  for (var i = 0; i < this.height; i++) {
    for (var j = 0; j < this.width; j++) {
      var cell = this.table.rows[i].cells[j];
      if (this.board[i][j] === 9) {
        if (cell.className === '') {
          cell.className = type;
        }
      }
      else if (cell.className === 'flag' && this.board[i][j] !== 9) {
        cell.className = 'mine_x';
      }
    }
  }
};


/**
 * End game
 * @param {Boolean} win Resume state.
 */
Game.prototype.end = function(win) {
  this.state = 'end';
  var state = win ? 'win' : 'fail';
  this.root.className += ' ' + state;
  this.resume(win ? 'flag' : 'mine');
  window.clearInterval(this.timer);
  this.timer = 0;
};


/**
 * Disable contextmenu
 * @return {Boolean} false.
 */
document.oncontextmenu = function() {return false};


var game = new Game().init(document.querySelector('.Minesweeper'));
