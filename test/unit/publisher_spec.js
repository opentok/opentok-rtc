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

      var video = container.querySelector('[data-icon="video"]');
      expect(video).to.exist;
      expect(video.dataset.action).to.equal('video');

      var record = container.querySelector('[data-icon="record"]');
      expect(record).to.exist;
    }));

    it('should send an event clicking on video action', sinon.test(function(done) {
      var video = getContainer().querySelector('[data-icon="video"]');

      this.stub(window, 'CustomEvent', function(name, data) {
        expect(name).to.equal('roomView:buttonClick');
        expect(data.detail.name).to.equal('video');
        done();
      });

      expect(video.parentNode.classList.contains('enabled')).to.be.true;
      video.click();
    }));

    it('should send an event clicking on micro action', sinon.test(function(done) {
      var micro = getContainer().querySelector('[data-icon="mic"]');

      this.stub(window, 'CustomEvent', function(name, data) {
        expect(name).to.equal('roomView:buttonClick');
        expect(data.detail.name).to.equal('audio');
        done();
      });

      expect(micro.parentNode.classList.contains('enabled')).to.be.true;
      micro.click();
    }));

  });

});
