var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('ItemsHandler', () => {
  var items = {};

  function getContainer() {
    return document.getElementById('myContainer');
  }

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/itemsHandler_spec.html'];
    Array.prototype.map.call(getContainer().querySelectorAll('section'), (element) => {
      items[element.id] = element;
    });
  });

  after(() => {
    window.document.body.innerHTML = null;
  });

  function dispatchCustomEvent(name, reason, id, enabled) {
    window.dispatchEvent(new CustomEvent(name, {
      detail: {
        id,
        reason,
        enabled: !!enabled,
      },
    }));
  }

  function clickButton(ctx, selector, id, type, cb) {
    var control = getContainer().querySelector(selector);

    ctx.stub(window, 'CustomEvent', (name, data) => {
      expect(name).to.equal('roomView:buttonClick');
      expect(data.detail.streamId).to.equal(id);
      expect(data.detail.name).to.equal(type);
      cb();
    });

    control.click();
  }

  function dblclick(elem) {
    var event = new MouseEvent('dblclick', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    elem.dispatchEvent(event);
  }

  describe('#init', () => {
    it('should export a init function', () => {
      expect(ItemsHandler.init).to.exist;
      expect(ItemsHandler.init).to.be.a('function');
    });

    it('should be initialized', () => {
      ItemsHandler.init(getContainer(), items);
    });
  });

  describe('#event handlers: click', () => {
    it('should send the correct event when video is selected in publisher',
      sinon.test(function (done) {
        clickButton(this, '#publisher i[data-icon="video"]', 'publisher', 'video', done);
      }));

    it('should send the correct event when audio is selected in publisher',
      sinon.test(function (done) {
        clickButton(this, '#publisher i[data-icon="mic"]', 'publisher', 'audio', done);
      }));

    it('should send the correct event when video is selected in subscribers',
      sinon.test(function (done) {
        clickButton(this, '#subscriber i[data-icon="video"]', 'subscriber', 'video', done);
      }));

    it('should send the correct event when audio is selected in subscribers',
      sinon.test(function (done) {
        clickButton(this, '#subscriber i[data-icon="audio"]', 'subscriber', 'audio', done);
      }));
  });

  describe('#event handlers: dblclick', () => {
    it('should send the correct event when user clicks twice', sinon.test(function (done) {
      this.stub(window, 'CustomEvent', (name, data) => {
        expect(name).to.equal('layoutView:itemSelected');
        expect(data.detail.item).to.equal(getContainer().querySelector('#subscriber'));
        done();
      });

      dblclick(getContainer().querySelector('#subscriber .dblclick_area'));
    }));
  });

  describe('#event handlers: roomController', () => {
    it('should set the correct status in UI when controller changes', () => {
      var check = function (id) {
        var reasonPrefix = (id === 'publisher') ? 'publish' : 'subscribe';

        var item = getContainer().querySelector('#' + id);
        var elem = item.querySelector('.video-action');

        expect(elem.classList.contains('enabled')).to.be.true;
        dispatchCustomEvent('roomController:video', reasonPrefix + 'Video', id);
        expect(elem.classList.contains('enabled')).to.be.false;
        expect(item.dataset.videoDisabled).to.be.equal('true');

        dispatchCustomEvent('roomController:videoEnabled', '', id);
        expect(item.dataset.videoDisabled).to.be.equal('false');

        dispatchCustomEvent('roomController:videoDisabled', '', id);
        expect(item.dataset.videoDisabled).to.be.equal('true');

        elem = getContainer().querySelector('#' + id + ' .audio-action');

        expect(elem.classList.contains('enabled')).to.be.true;
        dispatchCustomEvent('roomController:audio', reasonPrefix + 'Audio', id);
        expect(elem.classList.contains('enabled')).to.be.false;

        expect(item.dataset.disconnected).to.be.undefined;
        dispatchCustomEvent('roomController:disconnected', '', id);
        expect(item.dataset.disconnected).to.equal('true');
        dispatchCustomEvent('roomController:connected', '', id);
        expect(item.dataset.disconnected).to.equal('false');
      };

      check('publisher');
      check('subscriber');
    });
  });
});
