var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');

var Utils  = require('../../server/shared/utils.js');

describe('Utils', function(){

  it('should exist', function(){
    expect(Utils).to.exist;
  });

  describe('#MultiLevelLogger', function(){
    it('should exist and be a function', function(){
      expect(Utils.MultiLevelLogger).to.exist;
      expect(Utils.MultiLevelLogger).to.be.a('function');
    });

    it('is a constructor', function() {
      var logger = new Utils.MultiLevelLogger('Test', 5);
      expect(logger.logLevel).to.equal(5);
    });

    it('logLevel is a LHV and RHV', function() {
      var logger = new Utils.MultiLevelLogger('Test2', 0xFF);
      logger.logLevel = 5;
      expect(logger.logLevel).to.equal(5);
    });

    it('enableLevel activates some disabled bits', function() {
      var logger = new Utils.MultiLevelLogger('Test', 0xF0);
      logger.enableLevel(0x0A);
      expect(logger.logLevel).to.equal(0xFA);
    });

    it('enableLevel doesn\'t change active bits', function() {
      var logger = new Utils.MultiLevelLogger('Test', 0xF0);
      logger.enableLevel(0x1A);
      expect(logger.logLevel).to.equal(0xFA);
    });

    it('disableLevel deactivates enabled bits', function() {
      var logger = new Utils.MultiLevelLogger('Test', 0xF0);
      logger.disableLevel(0x10);
      expect(logger.logLevel).to.equal(0xE0);
    });

    it('disableLevel doesn\'t change disabled bits', function() {
      var logger = new Utils.MultiLevelLogger('Test', 0xF0);
      logger.disableLevel(0x0A);
      expect(logger.logLevel).to.equal(0xF0);
    });

    it('has default levels defined', function() {
      expect(Utils.MultiLevelLogger.DEFAULT_LEVELS).to.exist;
      expect(Utils.MultiLevelLogger.DEFAULT_LEVELS).to.be.a('object');
    });


    it('has functions for the default levels', function() {
      var logger = new Utils.MultiLevelLogger('Test', 0x0F);
      Object.keys(Utils.MultiLevelLogger.DEFAULT_LEVELS).
        forEach(function(aLevel) {
          expect(logger[aLevel]).to.be.a('function');
        });
    });

    it('uses console.log for the exit', sinon.test(function() {
      var mockConsole = this.mock(console);
      mockConsole.expects('log').once();
      var logger = new Utils.MultiLevelLogger('Test', 0xFF);
      logger.log('Test');
    }));

    it('if the level is disabled, the log is not called', sinon.test(function() {
      var mockConsole = this.mock(console);
      mockConsole.expects('log').never();
      var logger = new Utils.MultiLevelLogger('Test', 0xFF);
      logger.disableLevel(Utils.MultiLevelLogger.DEFAULT_LEVELS.log);
      logger.log('Test');
    }));

    it('if the level is enabled, the log is called', sinon.test(function() {
      var mockConsole = this.mock(console);
      mockConsole.expects('log').once();
      var logger = new Utils.MultiLevelLogger('Test', 0x00);
      logger.enableLevel(Utils.MultiLevelLogger.DEFAULT_LEVELS.log);
      logger.log('Test');
    }));
  });

  describe('#promisify', function(){
    it('returns a function', function(){
      expect(Utils.promisify(function() {})).to.be.a('function');
    });

    it('the returned function returns a promise', function() {
      var promisifiedFunction = Utils.promisify(function() {});
      expect(promisifiedFunction().then).to.be.a('function');
    });

    it('expects the last argument of the function to be a callback',
       sinon.test(function(done) {
      var clock = sinon.useFakeTimers();
      var origFunction = function(cb) {
        expect(cb).to.be.a('function');
        setTimeout(cb, 100);
      };
      var promisifiedFunction = Utils.promisify(origFunction);
      var callback = sinon.spy();
      origFunction(callback);
      clock.tick(101);
      var promise = promisifiedFunction();

      promise.then(() => {
        expect(callback.calledOnce).to.be.true;
        clock.restore();
        done();
      });
      clock.tick(101);
    }));
  });

});
