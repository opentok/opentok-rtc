var { assert } = chai;
var { expect } = chai;
var should = chai.should();

describe('LayoutMenuView', () => {
  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/layoutMenuView_spec.html'];
  });

  it('should exist', () => {
    expect(LayoutMenuView).to.exist;
  });

  describe('#init', () => {
    it('should export a init function', () => {
      expect(LayoutMenuView.init).to.exist;
      expect(LayoutMenuView.init).to.be.a('function');
    });

    it('should be initialized', () => {
      LayoutMenuView.init();
    });
  });

  describe('#event handlers: click', () => {
    it('should set the correct layout when grid is selected', ((done) => {
      var myLayoutGrid = {};

      sandbox.stub(BubbleFactory, 'get').callsFake(() => ({ toggle() {} }));

      sandbox.stub(window, 'CustomEvent').callsFake((name, data) => {
        expect(name).to.be.equal('layoutMenuView:layout');
        expect(data.detail.type).to.be.equal('grid');
        done();
      });

      document.querySelector('[data-layout-type="grid"').click();
      sandbox.restore();
    }));
  });

  describe('#event handlers: layoutManager:availableLayouts', () => {
    var checkOptions = function (layouts) {
      window.dispatchEvent(new CustomEvent('layoutManager:availableLayouts', {
        detail: {
          layouts,
        },
      }));

      Array.prototype.map.call(document.querySelectorAll('ul a'), (elem) => {
        var { layoutType } = elem.dataset;
        var isAvailable = !!layouts[layoutType];
        expect(elem.disabled).to.be.equal(!isAvailable);
      });
    };

    it('should disable all layouts for groups', () => {
      checkOptions({
        float: true,
        f2f_horizontal: true,
        f2f_vertical: true,
      });
    });

    it('should enable grid layout', () => {
      checkOptions({
        grid: true,
      });
    });
  });
});
