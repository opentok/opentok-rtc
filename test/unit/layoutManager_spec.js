var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LayoutManager', () => {
  function getContainer() {
    return document.getElementById('example');
  }

  function checkLayout(type) {
    expect(getContainer().dataset.currentLayoutType).to.be.equal(type);
  }

  var desktop = document.createElement('li');
  desktop.dataset.streamType = 'desktop';

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/layoutManager_spec.html'];
    function getLayoutElement() {
      var li = document.createElement('li');
      var span = document.createElement('span');
      li.appendChild(span);
      span.classList.add('opentok-stream-container');
      return li;
    }
    sinon.stub(LayoutView, 'init');
    sinon.stub(LayoutView, 'append', (id) => { return id === 'desktop' ? desktop : getLayoutElement(); }); // eslint-disable-line arrow-body-style
    sinon.stub(LayoutView, 'remove');
    sinon.stub(ItemsHandler, 'init');
    sinon.stub(LazyLoader, 'dependencyLoad', () => Promise.resolve());
  });

  it('should exist', () => {
    expect(LayoutManager).to.exist;
  });

  after(() => {
    LayoutView.init.restore();
    LayoutView.append.restore();
    LayoutView.remove.restore();
    ItemsHandler.init.restore();
    LazyLoader.dependencyLoad.restore();
  });

  describe('#init', () => {
    it('should export a init function', () => {
      expect(LayoutManager.init).to.exist;
      expect(LayoutManager.init).to.be.a('function');
      LayoutManager.init('#example');
    });
  });

  describe('#append', () => {
    var addedElements = [];

    it('should set the float layout with one stream', () => {
      addedElements.push(LayoutManager.append('1'));
      checkLayout('float');
    });

    it('should keep the float layout with two streams', () => {
      addedElements.push(LayoutManager.append('2'));
      checkLayout('float');
    });

    it('should set the grid layout with three streams', () => {
      addedElements.push(LayoutManager.append('3'));
      checkLayout('grid');
    });

    it('should set the hangout vertical layout while sharing the screen', () => {
      addedElements.push(LayoutManager.append('desktop'));
      checkLayout('hangout_vertical');
    });

    it('should always return a reference to the element added', () => {
      addedElements.every((item) => { // eslint-disable-line array-callback-return
        expect(item).to.be.defined;
      });
    });
  });

  describe('#remove', () => {
    it('should set the grid layout with three remaining streams after leaving of ' +
       'sharing the screen', () => {
      LayoutManager.remove('desktop');
      checkLayout('grid');
    });

    it('should set the float layout with two remaining streams after removing one', () => {
      LayoutManager.remove('3');
      checkLayout('float');
    });

    it('should keep the float layout with one stream after removing the second one', () => {
      LayoutManager.remove('2');
      checkLayout('float');
    });

    it('should keep the float layout with no streams', () => {
      LayoutManager.remove('1');
      checkLayout('float');
    });
  });

  describe('#event handlers: layoutMenuView:layout', () => {
    var sendUserLayoutEvent = function (type) {
      window.dispatchEvent(new CustomEvent('layoutMenuView:layout', {
        detail: {
          type,
        },
      }));
    };

    it('should set the f2f_horizontal layout with two streams', () => {
      LayoutManager.append('1');
      LayoutManager.append('2');
      var expectedLayout = 'f2f_horizontal';
      sendUserLayoutEvent(expectedLayout);
      checkLayout(expectedLayout);
    });

    it('should set the f2f_vertical layout with two streams', () => {
      var expectedLayout = 'f2f_vertical';
      sendUserLayoutEvent(expectedLayout);
      checkLayout(expectedLayout);
    });

    it('should set the float layout with two streams', () => {
      var expectedLayout = 'float';
      sendUserLayoutEvent(expectedLayout);
      checkLayout(expectedLayout);
    });

    it('should not set any face2face layout with three streams', () => {
      LayoutManager.append('3');
      sendUserLayoutEvent('float');
      checkLayout('grid');

      sendUserLayoutEvent('f2f_horizontal');
      checkLayout('grid');

      sendUserLayoutEvent('f2f_vertical');
      checkLayout('grid');
    });

    it('should set any kind of hangouts with three streams', () => {
      checkLayout('grid');

      sendUserLayoutEvent('hangout_horizontal');
      checkLayout('hangout_horizontal');

      sendUserLayoutEvent('hangout_vertical');
      checkLayout('hangout_vertical');
    });
  });

  describe('#getItemById', () => {
    it('should return an ancestor of the element returned by append', () => {
      var childElement = LayoutManager.append('testItemById');
      var parentElement = LayoutManager.getItemById('testItemById');
      while (childElement && parentElement !== childElement) {
        childElement = childElement.parentNode;
      }
      expect(parentElement).to.be.equal(childElement);
    });
  });
});
