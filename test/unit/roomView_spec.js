var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RoomView', function() {

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/roomView_spec.html'];
  });

  it('should exist', function() {
    expect(RoomView).to.exist;
  });

  describe('#init()', function() {
    it('should export a init function', function() {
      expect(RoomView.init).to.exist;
      expect(RoomView.init).to.be.a('function');
    });

    it('should init the module', sinon.test(function() {
      this.stub(LayoutManager, 'init');
      RoomView.init();
    }));
  });

  describe('#roomControllerEvents', function() {
    it('should listen for roomController:controllersReady event', function() {
      expect(document.querySelectorAll('.menu [disabled]').length).to.equal(2);
      window.dispatchEvent(new CustomEvent('roomController:controllersReady'));
      expect(document.querySelectorAll('.menu [disabled]').length).to.equal(0);
    });
  });

});
