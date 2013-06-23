// Load in dependencies
var SingleChild = require('../lib/single-child.js');

describe('A SingleChild', function () {
  describe('running a self-terminating command', function () {
    before(function (done) {
      var child = new SingleChild('node', ['-e', 'require("fs").writeFileSync("tmp.txt", +new Date())']);
    });

    describe('when started', function () {
      it('runs the command', function () {
      });

      describe('when started again', function () {
        it('runs the command again', function () {

        });
      });
    });
  });
});