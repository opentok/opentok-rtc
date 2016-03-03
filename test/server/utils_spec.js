var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

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

  describe('#promisify', function() {
    it('returns a function', function() {
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

    it('allows promisifying functions that pass more than one argument to the cb,' +
       'resolving to an array of the arguments', function() {
      var origFunction = function(cb) {
        cb(null, 1,2,3);
      };

      var promisifiedFunction = Utils.promisify(origFunction, 3);
      expect(promisifiedFunction()).to.eventually.be.deep.equal([1,2,3]);
    });

    it('allows restricting the number of arguments it resolves to', function() {
      var origFunction = function(cb) {
        cb(null, 1,2,3);
      };

      var promisifiedFunction = Utils.promisify(origFunction, 2);
      expect(promisifiedFunction()).to.eventually.be.equal([1,2]);
    });

    it('defaults to resolving to the first cb argument only', function() {
      var origFunction = function(cb) {
        cb(null, 1,2,3);
      };

      var promisifiedFunction = Utils.promisify(origFunction);
      expect(promisifiedFunction()).to.eventually.be.equal(1);
    });

    it('allows setting the correct "this" for the new function', function() {
      var anObj = {
        key: 'value'
      };
      var origFunction = function(cb) {
        cb(null, this.key);
      };

      var promisifiedFunction = Utils.promisify(origFunction, 1, anObj);
      expect(promisifiedFunction()).to.eventually.be.equal(anObj.key);
    });

  });

  describe('CachifiedObject', function() {
    it('exists and is a function', function() {
      expect(Utils.CachifiedObject).to.exist;
      expect(Utils.CachifiedObject).to.be.a('function');
    });

    it('takes a constructor as first argument and returns an instance of that object', function() {
      var date = Utils.CachifiedObject(Date);
      expect(date instanceof Date).to.be.true;
      function SomeObject() {
      };
      var obj = Utils.CachifiedObject(SomeObject);
      expect(obj instanceof SomeObject).to.be.true;
    });

    it('can construct an object with any number of arguments', function() {
      var date = Utils.CachifiedObject(Date);
      expect(date instanceof Date).to.be.true;
      date = Utils.CachifiedObject(Date, 2012);
      expect(date instanceof Date).to.be.true;
      date = Utils.CachifiedObject(Date, 2012, 2);
      expect(date instanceof Date).to.be.true;
      function SomeObject(att1, att2, att3) {
        this.att1 = att1;
        this.att2 = att2;
        this.att3 = att3;
      }

      var obj = Utils.CachifiedObject(SomeObject);
      expect(obj).to.deep.equal({ att1: undefined, att2: undefined, att3: undefined });

      obj = Utils.CachifiedObject(SomeObject, 1);
      expect(obj).to.deep.equal({ att1: 1, att2: undefined, att3: undefined });

      obj = Utils.CachifiedObject(SomeObject, 1, 2);
      expect(obj).to.deep.equal({ att1: 1, att2: 2, att3: undefined });

      obj = Utils.CachifiedObject(SomeObject, 1, 2, 3);
      expect(obj).to.deep.equal({ att1: 1, att2: 2, att3: 3 });

      obj = Utils.CachifiedObject(SomeObject, 1, 2, 3, 4);
      expect(obj).to.deep.equal({ att1: 1, att2: 2, att3: 3 });
    });

    it('actually caches the result', function() {
      var date = Utils.CachifiedObject(Date);
      var date2 = Utils.CachifiedObject(Date);
      expect(date === date2).to.be.true;
    });

    describe('#getCached', function() {
      it('exists and is a function', function() {
        expect(Utils.CachifiedObject.getCached).to.exist;
        expect(Utils.CachifiedObject.getCached).to.be.a('function');
      });

      it('returns undefined for a non existing entry', function() {
        function NewObject() {
        }
        var cached = Utils.CachifiedObject.getCached(NewObject);
        expect(cached).to.be.undefined;
      });

      it('returns the cached object if the object has been cached', function() {
        function NewObject() {
        }
        var toBeCached = Utils.CachifiedObject(NewObject);
        var cached = Utils.CachifiedObject.getCached(NewObject);
        expect(cached).to.be.equals(toBeCached);
      });
    });
  });

  describe('#isA', function() {
    var testCases = [
      {
        description: 'two simple types, same types',
        template: 'string',
        testObject: 'hola',
        expected: true
      },
      {
        description: 'two simple types, different types',
        template: 'string',
        testObject: 123,
        expected: false
      },
      {
        description: 'a simple type and a object',
        template: { a: 'string', b: 12 },
        testObject: 'hola',
        expected: false
      },
      {
        description: 'a simple type and a object, inverse',
        template: 'string',
        testObject: { c: 'hola'},
        expected: false
      },
      {
        description: 'a simple object, same structure',
        template: { a: 'string', b: 12 },
        testObject: { a: 'hola', b: 123 },
        expected: true
      },
      {
        description: 'a simple object, different types',
        template: { a: 'string', b: 12 },
        testObject: { a: 'hola', b: 'hola' },
        expected: false
      },
      {
        description: 'a simple object, different structure',
        template: { a: 'string', b: 12 },
        testObject: { a: 'hola' },
        expected: false
      },
      {
        description: 'a nested object, same structure',
        template: { a: 'string', b: 12, c: { d: 'string', e: 12 }},
        testObject: { a: 'hola', b: 14, c: { d: 'hey', e: 14 }},
        expected: true
      },
      {
        description: 'a nested object, different types',
        template: { a: 'string', b: 12, c: { d: 'string', e: 12 }},
        testObject: { a: 12, b: 14, c: { d: 'hey', e: 14 }},
        expected: false
      },
      {
        description: 'a nested object, different subtypes',
        template: { a: 'string', b: 12, c: { d: 'string', e: 12 }},
        testObject: { a: 'hola', b: 14, c: { d: 12, e: 14 }},
        expected: false
      },
      {
        description: 'a nested object, object is a subtype',
        template: { a: 'string', b: 12, c: { d: 'string', e: 12 }},
        testObject: { a: 'hola', b: 14, c: { d: 'hola', e: 14, f: {} }},
        expected: true
      },
      {
        description: 'a nested object, with a simple array',
        template: { a: 'string', b: 12, c: [1]},
        testObject: { a: 'hola', b: 14, c: [2,3,4] },
        expected: true
      },
      {
        description: 'a nested object, with a simple array, different element types',
        template: { a: 'string', b: 12, c: [1]},
        testObject: { a: 'hola', b: 14, c: ['hola', 'adios'] },
        expected: false
      },
      {
        description: 'a nested object, with a object array, different element types',
        template: { a: 'string', b: 12, c: [1]},
        testObject: { a: 'hola', b: 14, c: ['hola', 'adios'] },
        expected: false
      },
      {
        description: 'a nested object, with a simple array, different element types',
        template: { a: 'string', b: 12, c: [1]},
        testObject: { a: 'hola', b: 14, c: ['hola', 'adios'] },
        expected: false
      },
      {
        description: 'a nested object, with a object array, same element types',
        template: { a: 'string', b: 12, c: [{a: 1, b: 'string'}]},
        testObject: { a: 'hola', b: 14, c: [{a: 14, b: 'hey'}] },
        expected: true
      },
      {
        description: 'a nested object, with a object array, different element types',
        template: { a: 'string', b: 12, c: [{a: 1, b: 'string'}]},
        testObject: { a: 'hola', b: 14, c: [{a: 14, b: 14}] },
        expected: false
      },
      {
        description: 'a nested object, with a object array, empty array on the object',
        template: { a: 'string', b: 12, c: [{a: 1, b: 'string'}]},
        testObject: { a: 'hola', b: 14, c: [] },
        expected: false
      },
      {
        description: 'a nested object, with a object array, both arrays empty',
        template: { a: 'string', b: 12, c: []},
        testObject: { a: 'hola', b: 14, c: [] },
        expected: true
      },
      {
        description: 'a nested object, with a object array, with several correct elements',
        template: { a: 'string', b: 12, c: [1]},
        testObject: { a: 'hola', b: 14, c: [2,3,4,5,6,7] },
        expected: true
      },
      {
        description: 'a nested object, with a object array, with incorrect elements',
        template: { a: 'string', b: 12, c: [1]},
        testObject: { a: 'hola', b: 14, c: [2,3,4,'a'] },
        expected: false
      }
    ];

    testCases.forEach(aTestCase => {
      it('should return ' + aTestCase.expected + ' for ' + aTestCase.description, function() {
        expect(Utils.isA(aTestCase.template, aTestCase.testObject)).to.be.equal(aTestCase.expected);
      });
    });
  });

  describe('#boooleanify', function() {
    var testCases = [
      { input: 'true', output: true },
      { input: 'TRUE', output: true },
      { input: 0, output: false },
      { input: 1, output: true },
      { input: '0', output: false },
      { input: '1', output: true },
      { input: 'true', output: true },
      { input: 'something', output: false },
      { input: true, output: true },
      { input: false, output: false }
    ];
    it('exists and is a function', function() {
      expect(Utils.booleanify).to.exist;
      expect(Utils.booleanify).to.be.a.function;
    });

    testCases.forEach(function(aTC) {
      it('should return ' + aTC.output + ' for ' + aTC.input + '(' + typeof aTC.input + ')',
         function() {
        expect(Utils.booleanify(aTC.input)).to.be.equal(aTC.output);
      });
    });
  });

  describe('#extendCopy', function() {
    var testCases = [
      { description: 'an empty object for an empty input object and no extra attr.',
        inputA: {}, inputB: undefined, output: {} },
      { description: 'a shallow copy of the input object with no extra attr.',
        inputA: {a: 'a', 'b': 'b'}, inputB: undefined, output: {a: 'a', 'b': 'b'} },
      { description: 'a shallow copy of second attribute if the first one is an empty object',
        inputA: {}, inputB: { a: 'a', 'b': 'b' }, output: {a: 'a', 'b': 'b'} },
      { description: 'a object with the attributes of both parameters',
        inputA: { a: 'a', 'b': 'b' }, inputB: {c: 'c'}, output: {a: 'a', b: 'b', c: 'c'} },
      { description: 'a object with the attributes of both parameters and the values of the second',
        inputA: { a: 'a', 'b': 'b', c: 'C'}, inputB: {c: 'c'}, output: {a: 'a', b: 'b', c: 'c'} },
      { description: 'a object with the attributes of both parameters, extended with the ' +
          'new values, and with the values of the second parameter for shared attrs',
        inputA: { a: 'a', 'b': 'b', c: 'C'}, inputB: {c: 'c', d: 'd'},
        output: {a: 'a', b: 'b', c: 'c', d: 'd'} }
    ];

    it('exists and is a function', function() {
      expect(Utils.extendCopy).to.exist;
      expect(Utils.extendCopy).to.be.a.function;
    });

    testCases.forEach(function(aTC) {
      it('should return ' + aTC.description, function() {
        expect(Utils.extendCopy(aTC.inputA, aTC.inputB)).to.be.deep.equal(aTC.output);
        expect(Utils.extendCopy(aTC.inputA, aTC.inputB)).not.to.be.equal(aTC.output);
      });
    });

  });

});
