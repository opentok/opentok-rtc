var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Publisher', function() {

  function getContainer() {
    return document.getElementById('publisher');
  }

  before(function() {
    window.document.body.innerHTML =
      window.__html__['test/unit/publisher_spec.html'];
  });

  describe('#init', function() {
    it('should export a init function', function() {
      expect(Publisher.init).to.exist;
      expect(Publisher.init).to.be.a('function');
    });

    it('should be initialized properly attaching listeners', sinon.test(function() {
      var container = getContainer();
      this.spy(container, 'addEventListener');

      Publisher.init();

      expect(container.childNodes.length).to.equal(2);

      var camera = container.querySelector('[data-icon="camera"]');
      expect(camera).to.exist;
      expect(camera.dataset.action).to.equal('video');

      var record = container.querySelector('[data-icon="record"]');
      expect(record).to.exist;

      expect(container.addEventListener.calledOnce).to.be.true;
      expect(container.addEventListener.firstCall.calledWith('click')).to.be.true;
    }));

    it('should send an event clicking on camera action', sinon.test(function(done) {
      var camera = getContainer().querySelector('[data-icon="camera"]');

      this.stub(window, 'CustomEvent', function(name, data) {
        expect(name).to.equal('roomView:pubButtonClick');
        expect(data.detail.name).to.equal('video');
        CustomEvent.restore();
        done();
      });

      expect(camera.classList.contains('enabled')).to.be.true;
      camera.click();
      expect(camera.classList.contains('enabled')).to.be.false;
    }));

  });

});
