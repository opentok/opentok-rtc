var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Draggable', function() {

  var DRAG_TIMEOUT = 200;

  var item = document.createElement('div');

  afterEach(function() {
    item.dataset.translatedX = item.dataset.translatedY = 0;
    Draggable.off(item);
  });

  function checkTranslation(x, y) {
    expect(item.style.transform).to.equal('translate(' + x + 'px, ' + y + 'px)');
  }

  function sendMouseEvent(type, coords, target) {
    var evt = document.createEvent('MouseEvent');
    evt.initMouseEvent(type, true, true, window,
      0, coords.x, coords.y, coords.x, coords.y,
      false, false, false, false, 0, null);
    (target || item).dispatchEvent(evt);
  }

  describe('#on', function() {
    it('should export an on function', function() {
      expect(Draggable.on).to.exist;
      expect(Draggable.on).to.be.a('function');
    });

    it('should not translate the element initially', function() {
      Draggable.on(item);
      checkTranslation(0, 0);
    });

    it('should keep the previous position', function() {
      item.dataset.translatedX = item.dataset.translatedY = 10;
      Draggable.on(item);
      checkTranslation(10, 10);
    });

    describe('#event dispatcher: dragstart', function() {
      var checkHoldstartEvent = function(ctx, x, y, done) {
        ctx.stub(window, 'CustomEvent', function(name, data) {
          expect(name).to.equal('dragstart');
          expect(data.detail.pageX).to.equal(x);
          expect(data.detail.pageY).to.equal(y);
          done();
        });
      };

      it('should send the event after holding the element during ' + DRAG_TIMEOUT +
         'ms', sinon.test(function(done) {
        var clock = sinon.useFakeTimers();
        var x = 2;
        var y = 2;

        checkHoldstartEvent(this, x, y, function() {
          clock.restore();
          done();
        });

        Draggable.on(item);
        sendMouseEvent('mousedown', { x: x, y: y });
        clock.tick(DRAG_TIMEOUT);
      }));

      it('should send the event if the cursor is moved more than 10px', sinon.test(function(done) {
        var clock = sinon.useFakeTimers();
        var x = 2;
        var y = 2;

        checkHoldstartEvent(this, x, y, function() {
          clock.restore();
          done();
        });

        Draggable.on(item);
        sendMouseEvent('mousedown', { x: x, y: y });
        clock.tick(50);
        sendMouseEvent('mousemove', { x: x + 11, y: y });
        clock.tick(DRAG_TIMEOUT - 50);
      }));

      it('should translate the element following mouse events', sinon.test(function() {
        var clock = sinon.useFakeTimers();
        var x = 0;
        var y = 0;

        Draggable.on(item);
        sendMouseEvent('mousedown', { x: x, y: y });
        clock.tick(DRAG_TIMEOUT);
        expect(item.classList.contains('dragging')).to.be.true;
        checkTranslation(0, 0);

        sendMouseEvent('mousemove', { x: x + 1, y: y }, window);
        checkTranslation(1, 0);

        sendMouseEvent('mousemove', { x: x, y: y + 1333}, window);
        checkTranslation(0, 1333);

        sendMouseEvent('mousemove', { x: x - 4, y: y + 888}, window);
        checkTranslation(-4, 888);
      }));

      it('should set a class name while dragging and remove this after releasing the cursor',
        sinon.test(function() {
          var clock = sinon.useFakeTimers();
          var x = 0;
          var y = 0;

          Draggable.on(item);
          expect(item.classList.contains('dragging')).to.be.false;

          sendMouseEvent('mousedown', { x: x, y: y });
          clock.tick(DRAG_TIMEOUT);
          expect(item.classList.contains('dragging')).to.be.true;

          sendMouseEvent('mouseup', { x: x, y: y }, window);
          expect(item.classList.contains('dragging')).to.be.false;
        })
      );
    });
  });
});
