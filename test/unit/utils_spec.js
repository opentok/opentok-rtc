var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Utils', function() {

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
