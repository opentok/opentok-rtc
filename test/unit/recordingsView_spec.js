var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RecordingsView', function() {

  var model = {
    _listeners: {},
    _archives: {},
    _fire: function(data) {
      this._archives = data;
      this._listeners.value[0].method(data);
    },
    addEventListener: function(type, fc) {
      if (!(type in this._listeners)) {
        this._listeners[type] = [];
      }
      this._listeners[type].push({
        method: fc,
        context: undefined
      });
    },
    init: function() {
      return Promise.resolve();
    },
    get archives() {
      return this._archives;
    }
  };

  var archives = {
    one: {
      id: '1',
      localDownloadURL: 'http://xxx.com/',
      name: 'aUser1 aDate1',
      status: 'stopped'
    },
    two: {
      id: '2',
      localDownloadURL: 'http://yyy.com/',
      name: 'aUser2 aDate2',
      status: 'started'
    },
    three: {
      id: '3',
      localDownloadURL: 'http://zzz.com/',
      name: 'aUser3 aDate3',
      status: 'available'
    }
  };

  var container = null;

  before(function() {
    model._listeners = {};
    window.document.body.innerHTML =
      window.__html__['test/unit/recordingsView_spec.html'];
    container = document.querySelector('.videos.tc-list ul');
  });

  afterEach(function() {
    container.innerHTML = '';
  });

  describe('#init', function() {
    it('should exist', function() {
      expect(RecordingsView.init).to.exist;
      expect(RecordingsView.init).to.be.a('function');
    });

    it('should be initialized properly with only a listener for onvalue event', function() {
      RecordingsView.init(model);
      var keys = Object.keys(model._listeners);
      expect(keys.length).to.equal(1);
      expect(keys[0]).to.equal('value');
      expect(model._listeners.value.length).to.equal(1);
    });

    it('should render archives', function() {
      expect(container.children.length).to.equal(0);

      RecordingsView.init(model);

      model._fire(archives);

      expect(container.children.length).to.equal(3);

      var items = container.querySelectorAll('li > a');
      var keysArchives = Object.keys(archives);
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        var values = archives[keysArchives[i]];
        expect(item.textContent).to.equal(values.name);
        expect(item.href).to.equal(values.localDownloadURL);
        expect(item.parentNode.dataset.status).to.equal(values.status);
      }

      var items = container.querySelectorAll('li > i');
      var keysArchives = Object.keys(archives);
      for (var i = 0, l = items.length; i < l; i++) {
        var item = items[i];
        var values = archives[keysArchives[i]];
        expect(item.dataset.id).to.equal(values.id);
        expect(item.dataset.action).to.equal('delete');
      }
    });

    it('should delete archives', sinon.test(function(done) {
      RecordingsView.init(model);
      model._fire(archives);
      var id = archives.one.id;

      this.stub(window, 'dispatchEvent', function(event) {
        expect(event.type).to.equal('archive');
        expect(event.detail.id).to.equal(id);
        expect(event.detail.action).to.equal('delete');
        expect(event.detail.name).to.equal(archives.one.name);
        done();
      });

      var item = container.querySelector('li > i[data-id="' + id + '"]');
      item.click();
    }));
  });
});
