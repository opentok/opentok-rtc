var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Cronograph', function() {

  var startTime = '00:00';

  function getContainer() {
    return document.querySelector('.duration');
  }

  function checkCounterUI(time) {
    expect(getContainer().textContent).to.equal(time);
  }

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/cronograph_spec.html'];
  });

  afterEach(function() {
    Cronograph.stop().reset();
  });

  describe('#init', function(){
    it('should export a init function', function() {
      expect(Cronograph.init).to.exist;
      expect(Cronograph.init).to.be.a('function');
    });

    it('should be initialized with 00:00', function() {
      Cronograph.init();
      checkCounterUI(startTime);
    });
  });

  describe('#start', function() {
    it('initializes the cronograph', sinon.test(function() {
      var clock = sinon.useFakeTimers();

      Cronograph.start();

      var beautify = function(value) {
        return (value < 10) ? ('0' + value) : value;
      }

      var seconds = 2 * 60 * 60; // Simulating 2 hours of meeting
      for (var i = 1; i < seconds; i++) {
        clock.tick(1000);
        checkCounterUI(beautify(Math.floor(i / 60)) + ':' +
                       beautify(Math.floor(i % 60)));
      }

      clock.restore();
    }));

    it('initializes the cronograph from 33 seconds', sinon.test(function() {
      var clock = sinon.useFakeTimers();

      Cronograph.init();
      checkCounterUI('00:00');

      Cronograph.start(33);
      clock.tick(20000);
      checkCounterUI('00:53');

      clock.restore();
    }));
  });

  describe('#stop', function() {
    it('freezes the cronograph', sinon.test(function() {
      var exptectedTime = '00:20'
      var clock = sinon.useFakeTimers();

      Cronograph.start();

      clock.tick(20000);
      checkCounterUI(exptectedTime);

      Cronograph.stop();

      clock.tick(2342423423);
      checkCounterUI(exptectedTime);

      clock.restore();
    }));
  });

  describe('#reset', function() {
    it('sets the counter to 00:00', sinon.test(function() {
      var exptectedTime = '00:20'
      var clock = sinon.useFakeTimers();

      Cronograph.start();

      clock.tick(20000);
      checkCounterUI(exptectedTime);

      Cronograph.reset();
      checkCounterUI(startTime);

      clock.restore();
    }));
  });

});
