// Load in the EventEmitter
var spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter,
    nimble = require('nimble');

/**
 * Spawn for a single child. Always guarantees only one child exists
 * @see child_process.spawn
 * @param {String} cmd Command to run
 * @param {String[]} [args] Array of arguments to pass with cmd
 * @param {Object} [options] Options to pass to `spawn` and for ourselves
 * @param {Mixed} [options.killSignal] Signal to pass to `kill` executions
 */
var CHILDREN = [];
function SingleChild(cmd, args, options) {
  // If there are arguments, fallback options
  if (Array.isArray(args)) {
    options = options || {};
  } else {
  // Otherwise, fallback args
    options = args || {};
    args = [];
  }

  // Save arguments to starting/restarting
  this.cmd = cmd;
  this.args = args;
  this.options = options || {};

  // Save the child for self killing
  CHILDREN.push(this);

  // Call the EventEmitter constructor
  EventEmitter.call(this);
}
var SingleChildProto = {
  start: function (cb) {
    // Emit a start and proxy to restart
    return this.restart.apply(this, arguments);
  },
  restart: function (cb) {
    // Stop the child
    var that = this;
    this.stop(function killedChild (code) {
      // Spawn a new child and emit start events
      that.emit('starting');
      var child = spawn(that.cmd, that.args, that.options);
      that.child = child;
      that.emit('started');

      child.stderr.on('data', function (c) {
        console.error(c + '');
      });

      // If the child leaves
      child.on('exit', function (code) {
        console.log('err', code);
        // Unset the child
        that.child = null;

        // Emit an exit event
        that.emit('exit', code);
      });

      // Callback with the child
      // DEV: It is important this runs before the child starts
      // so .stdout, .stderr hooks can be attached
      if (cb) {
        cb(null, child);
      }
    });
  },
  stop: function (cb) {
    // Emit a stop and proxy a SIGTERM to kill
    return this.kill({signal: 'SIGTERM'}, cb);
  },
  kill: function (options, cb) {
    // Fallback options
    if (!cb) {
      cb = options;
      options = {};
    }

    // console.log(cb, this.child);

    // If there is no child, callback shortly
    var child = this.child;
    if (!child) {
      if (cb) {
        process.nextTick(cb);
      }
      return;
    }

    // Emit a killing event
    this.emit('killing');


    console.log('hi');

    // When we leave, callback with the exit code
    var that = this;
    child.on('error', function () { console.error('error'); });
    child.on('close', function cleanupChild () {
      // Unset the child
      console.log('exited');
      that.child = null;

      // Emit a killed event
      that.emit('killed');

      // Callback with info
      if (cb) {
        cb.apply(this, arguments);
      }
    });

    // Grab the signal and send it
    // console.log(options.signal || this.options.killSignal, child.kill);
    child.kill();
  }
};
SingleChild.prototype = SingleChildProto;

// Duck-punch EventEmitter methods
var EventProto = EventEmitter.prototype,
    key;
for (key in EventProto) {
  SingleChildProto[key] = EventProto[key];
}

// When the process is leaving, kill all the children
process.on('SIGTERM', function slaughterChildren () {
  nimble.each(CHILDREN, function killChild (child, cb) {
    child.kill(function (err) {
      cb();
    });
  }, function leaveGracefully (err) {
    process.exit(0);
  });
});

// Export the child
module.exports = SingleChild;