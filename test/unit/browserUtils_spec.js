var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Utils', function() {

  it('should exist', function() {
    expect(Utils).to.exist;
  });

  describe('#isScreen', function() {
    it('should exist and be a function', function() {
      expect(Utils.isScreen).to.exist;
      expect(Utils.isScreen).to.be.a('function');
    });

    it('should return true when item is a desktop', function() {
      var item = document.createElement('div');
      item.dataset.streamType = 'desktop';
      expect(Utils.isScreen(item)).to.be.true;
    });

    it('should return true when item is a screen', function() {
      var item = document.createElement('div');
      item.dataset.streamType = 'screen';
      expect(Utils.isScreen(item)).to.be.true;
    });

    it('should return false when item is not desktop neither screen', function() {
      expect(Utils.isScreen(document.createElement('div'))).to.be.false;
    });
  });

  describe('#sendEvent', function(){
    it('should exist and be a function', function() {
      expect(Utils.sendEvent).to.exist;
      expect(Utils.sendEvent).to.be.a('function');
    });

    it('should send custom events', function(done) {
      var target = document.body;

      var eventName = 'myEvent';
      var data = {
        one: '1',
        two: '2'
      };

      target.addEventListener(eventName, function(evt) {
        expect(evt.type).to.equal(eventName);
        expect(evt.detail).to.deep.equal(data);
        done();
      });

      Utils.sendEvent(eventName, data, target);
    });
  });

});
