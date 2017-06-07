var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Cronograph', () => {
  var startTime = '00:00';

  function getContainer() {
    return document.querySelector('.duration');
  }

  function checkCounterUI(time) {
    expect(getContainer().textContent).to.equal(time);
  }

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/cronograph_spec.html'];
  });

  afterEach(() => {
    Cronograph.stop().reset();
  });

  describe('#init', () => {
    it('should export a init function', () => {
      expect(Cronograph.init).to.exist;
      expect(Cronograph.init).to.be.a('function');
    });

    it('should be initialized with 00:00', () => {
      Cronograph.init();
      checkCounterUI(startTime);
    });
  });

  describe('#start', () => {
    it('initializes the cronograph', sinon.test(() => {
      var clock = sinon.useFakeTimers();

      Cronograph.start();

      var beautify = function (value) {
        return (value < 10) ? ('0' + value) : value;
      };

      var seconds = 2 * 60 * 60; // Simulating 2 hours of meeting
      for (var i = 1; i < seconds; i++) {
        clock.tick(1000);
        checkCounterUI(beautify(Math.floor(i / 60)) + ':' +
                       beautify(Math.floor(i % 60)));
      }

      clock.restore();
    }));

    it('initializes the cronograph from 33 seconds', sinon.test(() => {
      var clock = sinon.useFakeTimers();

      Cronograph.init();
      checkCounterUI('00:00');

      Cronograph.start(33);
      clock.tick(20000);
      checkCounterUI('00:53');

      clock.restore();
    }));

    it('initializes the cronograph with negative seconds', sinon.test(() => {
      var clock = sinon.useFakeTimers();

      Cronograph.init();
      checkCounterUI('00:00');

      Cronograph.start(-3);
      clock.tick(20000);
      checkCounterUI('00:20');

      clock.restore();
    }));
  });

  describe('#stop', () => {
    it('freezes the cronograph', sinon.test(() => {
      var exptectedTime = '00:20';
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

  describe('#reset', () => {
    it('sets the counter to 00:00', sinon.test(() => {
      var exptectedTime = '00:20';
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
