var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Utils', function() {

  it('should exist', function() {
    expect(Utils).to.exist;
  });

  describe('#isScreen', function() {
    it('should exist and be a function', function() {
      expect(Utils.isScreen).to.exist;
      expect(Utils.isScreen).to.be.a('function');
    });

    it('should return true when item is a desktop', function() {
      var item = document.createElement('div');
      item.dataset.streamType = 'desktop';
      expect(Utils.isScreen(item)).to.be.true;
    });

    it('should return true when item is a screen', function() {
      var item = document.createElement('div');
      item.dataset.streamType = 'screen';
      expect(Utils.isScreen(item)).to.be.true;
    });

    it('should return false when item is not desktop neither screen', function() {
      expect(Utils.isScreen(document.createElement('div'))).to.be.false;
    });
  });

  describe('#sendEvent', function(){
    it('should exist and be a function', function() {
      expect(Utils.sendEvent).to.exist;
      expect(Utils.sendEvent).to.be.a('function');
    });

    it('should send custom events', function(done) {
      var target = document.body;

      var eventName = 'myEvent';
      var data = {
        one: '1',
        two: '2'
      };

      target.addEventListener(eventName, function(evt) {
        expect(evt.type).to.equal(eventName);
        expect(evt.detail).to.deep.equal(data);
        done();
      });

      Utils.sendEvent(eventName, data, target);
    });
  });

  describe('#decodeStr', function(){
    it('should exist and be a function', function() {
      expect(Utils.decodeStr).to.exist;
      expect(Utils.decodeStr).to.be.a('function');
    });

    it('should decode strings', function() {
      var str = 'Collaboration%20Demo';
      expect(Utils.decodeStr(str)).to.equal('Collaboration Demo');
      str = 'Collaboration+Demo';
      expect(Utils.decodeStr(str)).to.equal('Collaboration+Demo');
    });
  });

  describe('#setDisabled', function() {
    it('should exist and be a function', function() {
      expect(Utils.setDisabled).to.exist;
      expect(Utils.setDisabled).to.be.a('function');
    });

    it('should disable/enable DOM elements', function() {
      var elem = document.createElement('div');
      [true, false].forEach(function(aValue) {
        Utils.setDisabled(elem, aValue);
        expect(elem.disabled).to.be.equal(aValue);
      });
    });
  });

  describe('#generateSearchStr', function() {
    it('should exist and be a function', function() {
      expect(Utils.generateSearchStr).to.exist;
      expect(Utils.generateSearchStr).to.be.a('function');
    });

    it('should throw a TypeError on undefined', sinon.test(function() {
      this.spy(Utils, 'generateSearchStr');
      try {
        Utils.generateSearchStr(undefined);
      } catch(e) {}
      expect(Utils.generateSearchStr.threw('TypeError')).to.be.true;
    }));

    var useCases = [
      {
        input: {key: 'value'},
        output: '?key=value'
      },
      {
        input: {key: 'value', key2: 'value2'},
        output: '?key=value&key2=value2'
      },
      {
        input: {key: 'value', key2: ['value2', 'value3']},
        output: '?key=value&key2=value2&key2=value3'
      },
      {
        input: {key: 'value', key2: undefined, key3: 'value3'},
        output: '?key=value&key2&key3=value3'
      },
      {
        input: {key: 'value', key2: undefined,
                key3: ['value3', 'value4', 'value5'], key4: undefined},
        output: '?key=value&key2&key3=value3&key3=value4&key3=value5&key4'
      }
    ];

    useCases.forEach(function(useCase) {
      it('should generate ' + useCase.output + ' for ' + JSON.stringify(useCase.input), function() {
        expect(Utils.generateSearchStr(useCase.input)).to.be.equal(useCase.output);
      });
    });

  });

  describe('#parseSearch', function() {
    it('should exist and be a function', function() {
      expect(Utils.parseSearch).to.exist;
      expect(Utils.parseSearch).to.be.a('function');
    });

    it('should throw a TypeError on undefined', sinon.test(function() {
      this.spy(Utils, 'parseSearch');
      try {
        Utils.parseSearch(undefined);
      } catch(e) {}
      expect(Utils.parseSearch.threw('TypeError')).to.be.true;
    }));

    var results = [];

    var useCases = [
      {
        input: '',
        output: {
          '': null
        },
        getFirst: {
          input: '',
          output: null
        }
      },
      {
        input: 'SomeChain',
        output: {
          'omeChain': null
        },
        getFirst: {
          input: 'omeChain',
          output: null
        }
      },
      {
        input: '?someVariable',
        output: {
          'someVariable': null
        },
        getFirst: {
          input: 'someVariable',
          output: null
        }
      },
      {
        input: '?someVariable=someValue',
        output: {
          'someVariable': 'someValue'
        },
        getFirst: {
          input: 'someVariable',
          output: 'someValue'
        }
      },
      {
        input: '?someVariable=some+Value',
        output: {
          'someVariable': 'some+Value'
        },
        getFirst: {
          input: 'someVariable',
          output: 'some Value'
        }
      },
      {
        input: '?someVariable=some%20Value',
        output: {
          'someVariable': 'some Value'
        },
        getFirst: {
          input: 'someVariable',
          output: 'some Value'
        }
      },
      {
        input: '?someVariable=someValue&variableWithoutValue&someOtherVariable=someOtherValue',
        output: {
          'someVariable': 'someValue',
          'variableWithoutValue': null,
          'someOtherVariable': 'someOtherValue'
        },
        getFirst: {
          input: 'someVariable',
          output: 'someValue'
        }
      },
      {
        input: '?someVariable=someValue&variableWithoutValue&someVariable=someOtherValue',
        output: {
          'someVariable': ['someValue', 'someOtherValue'],
          'variableWithoutValue': null
        },
        getFirst: {
          input: 'someVariable',
          output: 'someValue'
        }
      },
      {
        input: '?var1=val1&var2&var1=val2&var1=val2&var3&var3=val3',
        output: {
          'var1': ['val1', 'val2', 'val2'],
          'var2': null,
          var3: [null, 'val3']
        },
        getFirst: {
          input: 'var3',
          output: null
        }
      }
    ];

    useCases.forEach(function(useCase) {
      it('should generate as params' + JSON.stringify(useCase.output) + ' for ' +
         useCase.input, function() {
        var result = Utils.parseSearch(useCase.input);
        expect(result.params).to.be.deep.equal(useCase.output);
        results.push(result);
      });
    });

    describe('#getFirstValue', function() {
      it('should always return a getFirstValue method on the object\'\'', sinon.test(function() {
        results.forEach(function(aResult) {
          expect(aResult.getFirstValue).to.exist;
          expect(aResult.getFirstValue).to.be.a.function;
        });
      }));

      results.forEach(function(result, index) {
        it('should return ' + useCases[index].getFirst.output + ' when called with ' +
           useCases[index].getFirst.input + 'on the use case #' + index, function() {
             var useCase = useCases[index].getFirst;
             expect(result.getFirstValue(useCase.input)).to.be.equal(useCase.output);
        });
      });

    });

  });

  describe('#isChrome', function() {

    var realUserAgent = null,
        realVendor = null,
        customUserAgent = '',
        customVendor = '';

    before(function() {
      realUserAgent = navigator.userAgent;
      Object.defineProperty(window.navigator, 'userAgent', {
        configurable: true,
        get: function() {
          return customUserAgent;
        }
      });

      realVendor = navigator.vendor;
      Object.defineProperty(window.navigator, 'vendor', {
        configurable: true,
        get: function() {
          return customVendor;
        }
      });
    });

    after(function() {
      realUserAgent = customUserAgent;
      realVendor = customVendor;
    });

    it('should exist and be a function', function() {
      expect(Utils.isChrome).to.exist;
      expect(Utils.isChrome).to.be.a('function');
    });

    it('should return true when browser is chrome', function() {
      customUserAgent = 'Chrome';
      customVendor = 'google inc';
      expect(Utils.isChrome()).to.be.true;
    });

    it('should return false when browser is firefox', function() {
      customUserAgent = 'Mozilla/5.0';
      expect(Utils.isChrome()).to.be.false;
    });

    it('should return false when browser is IE', function() {
      customUserAgent = 'msie';
      expect(Utils.isChrome()).to.be.false;
    });

  });

});
