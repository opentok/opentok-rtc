var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LayoutMenuView', function() {

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/layoutMenuView_spec.html'];
  });

  it('should exist', function() {
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
  });

  describe('#event handlers: click', function() {
    it('should set the correct layout when grid is selected', sinon.test(function(done) {
      var myLayoutGrid = {};

      this.stub(BubbleFactory, 'get', function() {
        return { toggle: function() {} }
      });

      this.stub(window, 'CustomEvent', function(name, data) {
        expect(name).to.be.equal('layoutMenuView:layout');
        expect(data.detail.type).to.be.equal('grid');
        done();
      });

      document.querySelector('[data-layout-type="grid"').click();
    }));
  });

  describe('#event handlers: layoutManager:availableLayouts', function() {
    var checkOptions = function (layouts) {
      window.dispatchEvent(new CustomEvent('layoutManager:availableLayouts', {
        detail: {
          layouts: layouts
        }
      }));

      Array.prototype.map.call(document.querySelectorAll('ul a'), function(elem) {
        var layoutType = elem.dataset.layoutType;
        var isAvailable = !!layouts[layoutType];
        expect(elem.disabled).to.be.equal(!isAvailable);
      });
    }

    it('should disable all layouts for groups', function() {
      checkOptions({
        float: true,
        f2f_horizontal: true,
        f2f_vertical: true
      });
    });

    it('should enable grid layout', function() {
      checkOptions({
        grid: true
      });
    });
  });

});
