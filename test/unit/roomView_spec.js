var { assert } = chai;
var { expect } = chai;
var should = chai.should();
var sinonTest = require('sinon-test');

var test = sinonTest(sinon);
sinon.test = test;

describe('RoomView', () => {
  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/roomView_spec.html'];
  });

  it('should exist', () => {
    expect(RoomView).to.exist;
  });

  describe('#init()', () => {
    it('should export a init function', () => {
      expect(RoomView.init).to.exist;
      expect(RoomView.init).to.be.a('function');
    });

    it('should init the module', sinon.test(function () {
      this.stub(LayoutManager, 'init');
      RoomView.showRoom();
      RoomView.init();
    }));
  });

  describe('#roomControllerEvents', () => {
    it('should listen for roomController:controllersReady event', () => {
      expect(document.querySelectorAll('#call-controls [disabled]').length).to.equal(6);
      expect(document.querySelectorAll('#top-banner [disabled]').length).to.equal(3);
      RoomView.showRoom();
      window.dispatchEvent(new CustomEvent('roomController:controllersReady'));
      var selectorStr = '#top-banner [disabled], .call-controls [disabled]'
        + ':not(#toggle-publisher-video):not(#toggle-publisher-audio):not(#annotate)';
      expect(document.querySelectorAll(selectorStr).length).to.equal(0);
    });
  });
});
