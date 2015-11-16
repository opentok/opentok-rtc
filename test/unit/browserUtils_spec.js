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

});
