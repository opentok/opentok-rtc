var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RecordingsView', function() {

  var model = {
    init: function() {
      return Promise.resolve();
    }
  };

  before(function() {
    window.document.body.innerHTML =
      window.__html__['test/unit/recordingsView_spec.html'];
  });

  describe('#init', function() {
    it('should be initialized properly', function(done) {
      model.onValue = done.bind(this, null);

      RecordingsView.init(model);
    });

    it('should renders videos', function(done) {
      var container = document.querySelector('.videos.tc-list ul');
      expect(container.children.length).to.equal(0);

      var videos = {
        one: {
          url: 'http://xxx.com'
        },
        two: {
          url: 'http://yyy.net'
        },
      };

      model.onValue = function(callback) {
        callback(videos);

        expect(container.children.length).to.equal(2);
        var item = container.querySelectorAll('li > a');
        expect(item[0].textContent).to.equal(videos.one.url);
        expect(item[1].textContent).to.equal(videos.two.url);
        done();
      };

      RecordingsView.init(model);
    });
  });

});
