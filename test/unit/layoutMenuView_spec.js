var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LayoutMenuView', function(){

  before(function(){
    window.document.body.innerHTML = window.__html__['test/unit/layoutMenuView_spec.html'];
  });

  it('should exist', function(){
    expect(LayoutMenuView).to.exist;
  });

  describe('#init', function() {
    it('should export a init function', function() {
      expect(LayoutMenuView.init).to.exist;
      expect(LayoutMenuView.init).to.be.a('function');
    });

    it('should be initialized', function() {
      LayoutMenuView.init();
    });

    it('should listen for click events', sinon.test(function() {
      var myLayoutGrid = {};

      this.stub(BubbleFactory, 'get', function() {
        return { toggle: function() {} }
      });

      this.stub(window, 'LayoutManager', {
        layouts : {
          'grid': myLayoutGrid
        }
      });

      document.querySelector('[data-layout-type="grid"').click();
      expect(LayoutManager.userLayout).to.be.equal(myLayoutGrid);
    }));
  });

});
