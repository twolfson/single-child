// Load in dependencies
var SingleChild = require('../lib/single-child.js'),
    fs = require('fs'),
    assert = require('assert');

// Cleanup temporary files before starting
before(function () {
  try { fs.unlinkSync('tmp.txt'); } catch (e) {}
});

describe('A SingleChild', function () {
  describe('running a self-terminating command', function () {
    before(function () {
      // Create a script that writes time to `tmp.txt`
      this.child = new SingleChild('node', ['-e', 'require("fs").writeFileSync("tmp.txt", +new Date())']);
    });

    describe('when started', function () {
      before(function (done) {
        // Start the child
        this.child.start();

        // Callback in a bit
        setTimeout(done, 100);
      });

      it('runs the command', function () {
        // Load in the time
        console.log(process.cwd());
        var content = fs.readFileSync(__dirname + '/../tmp.txt', 'utf8');

        // Assert something is there
        assert.notEqual(content, '');

        // Save that something for later
        this.content1 = content;
      });

      describe('when started again', function () {
        it('runs the command again', function () {

        });
      });
    });
  });
});