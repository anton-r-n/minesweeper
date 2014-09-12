'use strict';



/**
 * @constructor
 */
function Game() {};


Game.prototype.start = function(width, height, mines) {
  console.log('start');
  this.root = document.querySelector('.Minesweeper');
  this.open_cells = 0;

  this.width = width = Math.min(Math.max(width|0, 2), 100);
  this.height = height = Math.min(Math.max(height|0, 2), 100);
  this.mines = mines = Math.max(Math.min(width * height - 1, mines|0), 1);

  this.cells = width * height;

  this._initField(width, height, mines);
  this._fillMines(width, height, mines);
  this._countMines();
  this.draw();

  var self = this;
  this.root.addEventListener('mousedown', function(e) {
    if (e.target.nodeName !== 'TD') return;
    e.stopPropagation();
    e.preventDefault();
    var x = e.target.cellIndex,
        y = e.target.parentNode.rowIndex;
    self.click(x, y);
  });

  return this;
};


Game.prototype.click = function(x, y) {
  x = x|0;
  y = y|0;
  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
  if (this.table.rows[y].cells[x].className !== '') return;

  if (this.field[y][x] === 0) {
    this.fail();
  }
  else {
    this.open(x, y);
    if (this.field[y][x] === 1) {
      this.click(x, y - 1);
      this.click(x, y + 1);
      this.click(x - 1, y);
      this.click(x - 1, y - 1);
      this.click(x - 1, y + 1);
      this.click(x + 1, y);
      this.click(x + 1, y - 1);
      this.click(x + 1, y + 1);
    }
  }
};


Game.prototype.open = function(x, y) {
  this.table.rows[y].cells[x].className = 'open';
  if (this.field[y][x] > 1) {
    this.table.rows[y].cells[x].textContent = this.field[y][x] - 1;
  }
  this.open_cells++;
  if (this.cells - this.open_cells === this.mines) {
    this.win();
  }
};


Game.prototype.draw = function() {
  var html = [];
  html.push('<table>');
  for (var i = 0; i < this.height; i ++) {
    html.push('<tr>');
    for (var j = 0; j < this.width; j++) {
      html.push('<td></td>');
    }
    html.push('</tr>');
  }
  html.push('</table>');
  this.root.innerHTML = html.join('');
  this.table = this.root.firstChild;
};


Game.prototype.console = function() {
  console.log(this.field.reduce(function(a, b) {
    return a.toString() + '\n ' + b.toString();
  }));
};


Game.prototype._initField = function(width, height, mines) {
  var cells = width * height;
  var val = mines > cells / 2 ? 0 : 1;
  var row = [];
  for (var i = 0; i < width; i++) { row[i] = val; }
  this.field = [];
  for (var j = 0; j < height; j++) { this.field[j] = row.slice() }
};


Game.prototype._fillMines = function(width, height, mines) {
  var cells = width * height;
  var val = this.field[0][0] ? 0 : 1;
  var len = val === 1 ? cells - mines : mines;
  while (len > 0) {
    var rand = Math.round((cells - 1) * Math.random()),
        x = rand % width,
        y = (rand - x) / width;
    if (this.field[y][x] !== val) {
      this.field[y][x] = val;
      len--;
    }
  }
};


Game.prototype._countMines = function() {
  for (var i = 0; i < this.height; i++) {
    for (var j = 0; j < this.width; j++) {
      if (this.field[i][j] !== 0) {
        this.field[i][j] = this.count(j, i) + 1;
      }
    }
  }
};


Game.prototype.count = function(x, y) {
  var count = 0;
  count += this.count_y(x, y);
  if (x > 0) {
    count += this.count_y(x - 1, y);
  }
  if (x + 1 < this.width) {
    count += this.count_y(x + 1, y);
  }
  return count;
};


Game.prototype.count_y = function(x, y) {
  var count = 0;
  if (y > 0) {
    if (this.field[y - 1][x] === 0) {count++}
  }
  if (y + 1 < this.height) {
    if (this.field[y + 1][x] === 0) {count++}
  }
  if (this.field[y][x] === 0) {count++}
  return count;
};


Game.prototype.fail = function() {
  console.log('fail');
};


Game.prototype.win = function() {
  console.log('win');
};



var game = new Game().start(13, 15, 13);
