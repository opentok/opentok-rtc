var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
var sinon = require('sinon');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var ServerPersistence  = require('../../server/serverPersistence.js');

var mocks = {
  PersistenceProvider: require('../mocks/mock_persistenceProvider')
};

describe('ServerPersistence', function() {

  it('should exist and be a function', function() {
    expect(ServerPersistence).to.exist;
    expect(ServerPersistence).to.be.a('function');
  });

  describe('#constructor', function() {

    var rp;

    before(function() {
      rp = new ServerPersistence([], '', 0, mocks);
    });

    it('should return an object', function() {
      expect(rp).to.be.an('object');
    });

    var expectedAttributes = {
      'cached': 'null',
      'getKey': 'function',
      'setKey': 'function',
      'updateCache': 'function',
      'setKeyEx': 'function',
      'delKey': 'function'
    };

    Object.keys(expectedAttributes).forEach(attr => {
      it('should have the attributes ' + attr + ' which is a ' +
         expectedAttributes[attr], function() {
        expect(rp).to.have.property(attr).that.is.a(expectedAttributes[attr]);
        delete rp[attr];
      });
    });

    it('should not have any other attribute', function() {
      expect(Object.keys(rp)).to.be.deep.equal([]);
    });
  });


  var testCases = [
    {
      description: 'should fulfill a optional key with the default value when it is not present',
      input: [
        { key: 'optionalKeyNotPresent', defaultValue: 'defaultValueOKNP' }
      ],
      serverState: {
        mandatoryKeyPresent: 'MKP',
        optionalKeyPresent: 'OKP'
      },
      shouldThrow: false
    },
    {
      description: 'should fulfill a optional key with the actual value when it is present',
      input: [
        { key: 'optionalKeyPresent', defaultValue: 'defaultValueOKP' }
      ],
      serverState: {
        mandatoryKeyPresent: 'MKP',
        optionalKeyPresent: 'OKP'
      },
      shouldThrow: false
    },
    {
      description: 'should fulfill a mandatory key with the actual value when the key is present',
      input: [
        { key: 'mandatoryKeyPresent', defaultValue: null }
      ],
      serverState: {
        mandatoryKeyPresent: 'MKP',
        optionalKeyPresent: 'OKP'
      },
      shouldThrow: false
    },
    {
      description: 'should throw when a mandatory key is missing',
      input: [
        { key: 'mandatoryKeyNotPresent', defaultValue: null },
        { key: 'optionalKeyNotPresent', defaultValue: 'defaultValueOKNP' },
        { key: 'optionalKeyPresent', defaultValue: 'defaultValueOKP' }
      ],
      serverState: {
        mandatoryKeyPresent: 'MKP',
        optionalKeyPresent: 'OKP'
      },
      shouldThrow: true
    },
    {
      description: 'should work with different conditions at the same time',
      input: [
        { key: 'mandatoryKeyPresent', defaultValue: null },
        { key: 'optionalKeyNotPresent', defaultValue: 'defaultValueOKNP' },
        { key: 'optionalKeyPresent', defaultValue: 'defaultValueOKP' }
      ],
      serverState: {
        mandatoryKeyPresent: 'MKP',
        optionalKeyPresent: 'OKP'
      },
      shouldThrow: false
    }
  ];

  describe('#updateCache', function() {

    it('should return a promise', function() {
      var rp = new ServerPersistence([], '', 0, mocks);
      expect(rp.updateCache().then).to.be.a('function');
    });

    testCases.forEach(aCase => {
      aCase.output =
        aCase.input.
          reduce((previous, elem) => {
            previous[elem.key] = aCase.serverState[elem.key] || elem.defaultValue;
            return previous;
          }, { });

      it(aCase.description, function() {
        mocks.PersistenceProvider.setInternalState(aCase.serverState);
        var rp = new ServerPersistence(aCase.input, '', 0, mocks);
        if (aCase.shouldThrow) {
          return rp.updateCache().should.be.rejectedWith(/Missing required redis key:/);
        } else {
          return rp.updateCache().should.eventually.deep.equal(aCase.output);
        }
      });
    });
  });

  describe('#cached', function() {
    it('should be eventually equal to the result of updateCache', function() {
      var allExpectations = [];
      testCases.forEach(aCase => {
        if (aCase.shouldThrow)
          return;
        mocks.PersistenceProvider.setInternalState(aCase.serverState);
        var rp = new ServerPersistence(aCase.input, '', 0, mocks);
        allExpectations.push(rp.updateCache().then(cached => [cached, rp.cached]).
                             should.eventually.deep.equal([aCase.output, aCase.output]));
      });
      return Promise.all(allExpectations);
    });
  });

  describe('#setKey', function() {
    var rp;
    var serverState = { aExistingKey: 'aExistingValue' };

    beforeEach(function() {
      mocks.PersistenceProvider.setInternalState(serverState);
      rp =
        new ServerPersistence([{ key: 'cachedValue', defaultValue: 'defaultCached' }],
                              '', 0, mocks);
    });

    it('should return a promise', function() {
      expect(rp.setKey('aKey', 'aValue').then).to.be.a('function');
    });

  });

  describe('#getKey', function() {
    var rp;
    var serverState = { aExistingKey: 'aExistingValue' };

    beforeEach(function() {
      mocks.PersistenceProvider.setInternalState(serverState);
      rp =
        new ServerPersistence([{ key: 'cachedValue', defaultValue: 'defaultCached' }],
                              '', 0, mocks);
    });

    it('should return a promise', function() {
      expect(rp.getKey('aKey').then).to.be.a('function');
    });

    it('should return the value stored in Redis', function() {
      return expect(rp.getKey('aExistingKey')).to.eventually.be.equal('aExistingValue');
    });

    it('should return a value previously set with setKey', function() {
      expect(rp.setKey('aNewKey', 'aNewValue').
             then(() => rp.getKey('aNewKey'))).to.eventually.be.equal('aNewValue');
    });

    it('should return a cached value even if it is not in redis', function() {
      expect(rp.getKey('cachedValue')).to.eventually.be.equal('defaultCached');
    });
  });

});
