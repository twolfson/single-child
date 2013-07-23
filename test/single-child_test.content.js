// Load in dependencies
var SingleChild = require('../lib/single-child.js'),
    fs = require('fs'),
    assert = require('assert'),
    spawn = require('child_process').spawn,
    request = require('request');

// Cleanup temporary files before starting
try { fs.unlinkSync('tmp.txt'); } catch (e) {}

module.exports = {
  // Generic namespace
  'A SingleChild': function () {
  },

  // Common child actions
  'when started': function (done) {
    // Start the child
    this.child.start();

    // Callback in a bit
    setTimeout(done, 100);
  },
  'when started again': 'when restarted',
  'when restarted': function (done) {
    // Restart the child then callback a little after it starts
    this.child.restart(function () {
      setTimeout(done, 100);
    });
  },
  'when stopped': function (done) {
    this.child.stop(function () {
      setTimeout(done, 100);
    });
  },

  // Commands for the first test
  'running a self-terminating command': function () {
    // Create a script that writes time to `tmp.txt`
    this.child = new SingleChild('node', ['-e', 'require("fs").writeFileSync("tmp.txt", +new Date())']);
  },
  'runs the command': function () {
    // Load in the time
    var content = fs.readFileSync(__dirname + '/../tmp.txt', 'utf8');

    // Assert something is there
    assert.notEqual(content, '');

    // Save that something for later
    this.fsContent = content;
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
  },
  'when requested from': function (done) {
    // Call out to our server
    var that = this;
    request('http://localhost:3000/', function (err, req, body) {
      // Save the response and callback
      that.serverErr = err;
      that.serverContent = body;
      done();
    });
  },
  'the command has stopped': function () {
    assert(this.serverErr);
  },

  // Commands for the third batch
  'A program using SingleChild': function (done) {
    // Relocate to our directory
    process.chdir(__dirname);

    // Start a process which starts a SingleChild'd node server
    var cmd = [
          'var SingleChild = require("../lib/single-child"),',
          '    child = new SingleChild("node", ["-e", "' +
                [
                  "require('http').createServer(function (req, res) {",
                  "  res.writeHead(204);",
                  "  res.end();",
                  "}).listen(5000);"
                ].join('') +
              '"]);',
          'child.start();'
        ].join('\n'),
        child = spawn('node', ['-e', cmd]);

    // Save the child for later
    this.child = child;

    // When there is an error, spit it out
    child.stdout.on('data', function (content) {
      console.log(content + '');
    });
    child.stderr.on('data', function (content) {
      console.error(content + '');
    });

    // Callback when the process is done launching
    setTimeout(done, 200);
  },
  'is running its child': function (done) {
    // Ping our server
    request('http://localhost:5000/', function (err, res, body) {
      // Assert it is up and callback
      assert.strictEqual(err, null);
      assert.strictEqual(res.statusCode, 204);
      done();
    });
  },
  'when killed': function (done) {
    // Kill the child
    var child = this.child;
    child.kill('SIGINT');
    // child.kill();

    // When it is done closing, callback
    child.on('exit', function childKilled () {
      done();
      // setTimeout(done, 1000);
    });
    // require('child_process').exec('taskkill /pid ' + child.pid + ' /F', console.log);
  },
  'cleans up its children': function (done) {
    // Ping our server
    request('http://localhost:5000/', function (err, res, body) {
      // Assert it is down and callback
      // DEV: We are looking for an ECONNREFUSED
      console.log(err, body);
      assert.notEqual(err, null);
      done();
    });
  }
};