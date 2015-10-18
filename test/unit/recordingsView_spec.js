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

  before(function() {
    model._listeners = {};
    window.document.body.innerHTML =
      window.__html__['test/unit/recordingsView_spec.html'];
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
      var container = document.querySelector('.videos.tc-list ul');
      expect(container.children.length).to.equal(0);

      var archives = {
        one: {
          localDownloadURL: 'http://xxx.com/',
          name: 'aUser1 aDate1',
          status: 'stopped'
        },
        two: {
          localDownloadURL: 'http://yyy.com/',
          name: 'aUser2 aDate2',
          status: 'started'
        },
        three: {
          localDownloadURL: 'http://zzz.com/',
          name: 'aUser3 aDate3',
          status: 'available'
        }
      };

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
        expect(item.dataset.status).to.equal(values.status);
      }
    });
  });
});
