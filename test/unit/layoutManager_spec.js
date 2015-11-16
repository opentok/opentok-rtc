var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LayoutManager', function() {

  function getContainer() {
    return document.getElementById('example');
  }

  function checkLayout(type) {
    expect(getContainer().dataset.currentLayoutType).to.be.equal(type);
  }

  var desktop = document.createElement('li');
  desktop.dataset.streamType = 'desktop';

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/layoutManager_spec.html'];
    sinon.stub(LayoutView, 'init');
    sinon.stub(LayoutView, 'append', function(id) {
      return id === 'desktop' ? desktop : document.createElement('li');
    });
    sinon.stub(LayoutView, 'remove');
    sinon.stub(ItemsHandler, 'init');
    sinon.stub(LazyLoader, 'dependencyLoad', function() { return Promise.resolve(); });
  });

  it('should exist', function() {
    expect(LayoutManager).to.exist;
  });

  after(function() {
    LayoutView.init.restore();
    LayoutView.append.restore();
    LayoutView.remove.restore();
    ItemsHandler.init.restore();
    LazyLoader.dependencyLoad.restore();
  });

  describe('#init', function() {
    it('should export a init function', function() {
      expect(LayoutManager.init).to.exist;
      expect(LayoutManager.init).to.be.a('function');
      LayoutManager.init('#example');
    });
  });

  describe('#append', function() {
    it('should set the float layout with one stream', function() {
      LayoutManager.append('1');
      checkLayout('float');
    });

    it('should keep the float layout with two streams', function() {
      LayoutManager.append('2');
      checkLayout('float');
    });

    it('should set the grid layout with three streams', function() {
      LayoutManager.append('3');
      checkLayout('grid');
    });

    it('should set the hangout horizontal layout while sharing the screen', function() {
      LayoutManager.append('desktop');
      checkLayout('hangout_horizontal');
    });
  });

  describe('#remove', function() {
    it('should keep hangout horizontal layout with three remaining streams after leaving of ' +
       'sharing the screen', function() {
      LayoutManager.remove('desktop');
      checkLayout('hangout_horizontal');
    });

    it('should set the float layout with two remaining streams after removing one', function() {
      LayoutManager.remove('3');
      checkLayout('float');
    });

    it('should keep the float layout with one stream after removing the second one', function() {
      LayoutManager.remove('2');
      checkLayout('float');
    });

    it('should keep the float layout with no streams', function() {
      LayoutManager.remove('1');
      checkLayout('float');
    });
  });

  describe('#event handlers: layoutMenuView:layout', function() {
    var sendUserLayoutEvent = function (type) {
      window.dispatchEvent(new CustomEvent('layoutMenuView:layout', {
        detail: {
          type: type
        }
      }));
    }

    it('should set the f2f_horizontal layout with two streams', function() {
      LayoutManager.append('1');
      LayoutManager.append('2');
      var expectedLayout = 'f2f_horizontal';
      sendUserLayoutEvent(expectedLayout);
      checkLayout(expectedLayout);
    });

    it('should set the f2f_vertical layout with two streams', function() {
      var expectedLayout = 'f2f_vertical';
      sendUserLayoutEvent(expectedLayout);
      checkLayout(expectedLayout);
    });

    it('should set the float layout with two streams', function() {
      var expectedLayout = 'float';
      sendUserLayoutEvent(expectedLayout);
      checkLayout(expectedLayout);
    });

    it('should not set any face2face layout with three streams', function() {
      LayoutManager.append('3');
      sendUserLayoutEvent('float');
      checkLayout('grid');

      sendUserLayoutEvent('f2f_horizontal');
      checkLayout('grid');

      sendUserLayoutEvent('f2f_vertical');
      checkLayout('grid');
    });

    it('should set any kind of hangouts with three streams', function() {
      checkLayout('grid');

      sendUserLayoutEvent('hangout_horizontal');
      checkLayout('hangout_horizontal');

      sendUserLayoutEvent('hangout_vertical');
      checkLayout('hangout_vertical');
    });
  });

});
