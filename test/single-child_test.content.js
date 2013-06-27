// Load in dependencies
var SingleChild = require('../lib/single-child.js'),
    fs = require('fs'),
    assert = require('assert'),
    request = require('request');

// Cleanup temporary files before starting
try { fs.unlinkSync('tmp.txt'); } catch (e) {}

module.exports = {
  // Generic namespace
  'A SingleChild': function () {
  },

  // Commands for the first test
  'running a self-terminating command': function () {
    // Create a script that writes time to `tmp.txt`
    this.child = new SingleChild('node', ['-e', 'require("fs").writeFileSync("tmp.txt", +new Date())']);
  },
  'when started': function (done) {
    // Start the child
    this.child.start();

    // Callback in a bit
    setTimeout(done, 100);
  },
  'runs the command': function () {
    // Load in the time
    var content = fs.readFileSync(__dirname + '/../tmp.txt', 'utf8');

    // Assert something is there
    assert.notEqual(content, '');

    // Save that something for later
    this.fsContent = content;
  },
  'when started again': 'when restarted',
  'when restarted': function (done) {
    // Start the child
    this.child.restart();

    // Callback in a bit
    setTimeout(done, 100);
  },
  'runs the command again': function () {
    // Load in the time
    var content = fs.readFileSync(__dirname + '/../tmp.txt', 'utf8');

    // Assert something is there
    assert.notEqual(content, this.fsContent);
  },

  // Commands for the second command
  'running a sustaining command': function () {
    // Create a script that writes time to `tmp.txt`
    this.child = new SingleChild('node', [
      '-e',
      [
        'var startTime = (+new Date()) + "";',
        'require("http").createServer(function (req, res) {',
        '  res.writeHead(200);',
        '  res.write(startTime);',
        '  res.end();',
        '}).listen(3000);'
      ].join('\n')
    ]);
  },
  'when pinged': function (done) {
    // Call out to our server
    var that = this;
    request('http://localhost:3000/', function (err, req, body) {
      // Save the response and callback
      console.log(body);
      that.serverContent = body;
      done(err);
    });
  },
  'the command is running': function () {
    // Assert the ping response was valid and save it for later
    assert(this.serverContent);
    this._serverContent = this.serverContent;
  },
  'the command is still running': function () {
    assert.strictEqual(this.serverContent, this._serverContent);
  },
  'the command has restarted': function () {
    assert.notEqual(this.serverContent, this._serverContent);
  }
};