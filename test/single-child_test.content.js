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
    this.content1 = content;
  },
  'when started again': function (done) {
    // Start the child
    this.child.restart();

    // Callback in a bit
    setTimeout(done, 100);
  },
  'runs the command again': function () {
    // Load in the time
    var content = fs.readFileSync(__dirname + '/../tmp.txt', 'utf8');

    // Assert something is there
    assert.notEqual(content, this.content1);
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
      that.content2 = body;
      done(err);
    });
  },
  'the command is running': function () {
    console.log(this.content2);
  }
};