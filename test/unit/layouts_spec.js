var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Layouts', () => {
  var instance;

  function getContainer() {
    return document.getElementById('myContainer');
  }

  function getItems(number) {
    var items = {};

    for (var i = 0; i < number; i++) {
      items[i] = document.createElement('div');
    }

    return items;
  }

  var checkSizes = function (width, height) {
    var features = instance.features;
    expect(features.width).to.equal(width + '%');
    expect(features.height).to.equal(height + '%');
  };

  var visitItems = function (clazz) {
    var items = getItems(2);
    instance = new clazz(getContainer(), items);
    instance.rearrange();
    var features = instance.features;
    Object.keys(items).forEach((id) => {
      var item = items[id];
      expect(features.width).to.equal(item.style.width.replace(',', '.'));
      expect(features.height).to.equal(item.style.height.replace(',', '.'));
    });
  };

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/layouts_spec.html'];
  });

  describe('LayoutBase', () => {
    describe('#constructor', () => {
      it('should be initialized properly', () => {
        var expectedLayoutName = 'pepito';
        var container = getContainer();
        instance = new LayoutBase(container, {}, expectedLayoutName);

        expect(container.dataset.currentLayoutType).to.equal(expectedLayoutName);
      });
    });

    describe('#total', () => {
      it('should return the number total of items', () => {
        var expectedNumber = 3;
        instance = new Grid(getContainer(), getItems(expectedNumber));

        expect(instance.total).to.equal(expectedNumber);
      });
    });
  });

  describe('Grid', () => {
    describe('#constructor', () => {
      it('should be initialized properly', () => {
        var container = getContainer();
        instance = new Grid(container, {});

        expect(container.dataset.currentLayoutType).to.equal('grid');
      });
    });

    describe('#features', () => {
      it('should fit one item to the whole container', () => {
        instance = new Grid(getContainer(), getItems(1));
        checkSizes(100, 100);
      });

      it('should fit two items to the half of the container width', () => {
        instance = new Grid(getContainer(), getItems(2));
        checkSizes(50, 100);
      });

      it('should fit three/four items to the half container height and width', () => {
        var items = getItems(3);
        instance = new Grid(getContainer(), items);
        checkSizes(50, 50);

        items[3] = document.createElement('div');
        checkSizes(50, 50);
      });
    });

    describe('#rearrange', sinon.test(() => {
      it('should visit all items and set dimensions', () => {
        visitItems(Grid);
      });
    }));
  });

  describe('Float', () => {
    var checkSizes = function (width, height) {
      var features = instance.features;
      expect(features.width).to.equal('100%');
      expect(features.height).to.equal('100%');
    };

    function stubDraggable(ctx, callback) {
      ctx.stub(Utils, 'getDraggable', callback || (() => { // eslint-disable-line
        return Promise.resolve({
          on() {},
        });
      }));
    }

    describe('#constructor', () => {
      it('should be initialized properly', () => {
        var container = getContainer();
        instance = new Float(container, {});
        expect(container.dataset.currentLayoutType).to.equal('float');
      });

      it('should set the publisher as draggable', sinon.test(function (done) {
        var container = getContainer();
        var publisher = document.createElement('myPublisher');

        stubDraggable(this, () => (
           Promise.resolve({
             on(element) {
               expect(element).to.equal(publisher);
               done();
             }
           })
        ));

        instance = new Float(container, {
          publisher
        });
        expect(container.dataset.currentLayoutType).to.equal('float');
      }));
    });

    describe('#features', () => {
      it('should fit items to the whole container', () => {
        var items = getItems(1);
        instance = new Float(getContainer(), items);
        checkSizes(100, 100);

        items[1] = document.createElement('div');
        checkSizes(100, 100);
      });
    });

    describe('#rearrange', sinon.test(() => {
      it('should visit all items and set dimensions', () => {
        visitItems(Float);
      });
    }));

    describe('#destroy', () => {
      it('should disable drag feature for the publisher', sinon.test(function (done) {
        var publisher = document.createElement('div');
        stubDraggable(this, () => (
            Promise.resolve({
              on() {},
              off(element) {
                expect(element).to.equal(publisher);
                done();
              }
            })
        ));

        instance = new Float(getContainer(), {
          publisher,
        });
        instance.destroy();
      }));
    });
  });

  describe('F2FHorizontal', () => {
    describe('#constructor', () => {
      it('should be initialized properly', () => {
        var container = getContainer();
        instance = new F2FHorizontal(container, {});

        expect(container.dataset.currentLayoutType).to.equal('f2f_horizontal');
      });
    });

    describe('#features', () => {
      it('should fit one item to the total container height', () => {
        instance = new F2FHorizontal(getContainer(), getItems(1));
        checkSizes(100, 100);
      });

      it('should fit items to the half of the container height', () => {
        instance = new F2FHorizontal(getContainer(), getItems(2));
        checkSizes(100, 50);
      });
    });

    describe('#rearrange', sinon.test(() => {
      it('should visit all items and set dimensions', () => {
        visitItems(F2FHorizontal);
      });
    }));
  });

  describe('F2FVertical', () => {
    describe('#constructor', () => {
      it('should be initialized properly', () => {
        var container = getContainer();
        instance = new F2FVertical(container, {});

        expect(container.dataset.currentLayoutType).to.equal('f2f_vertical');
      });
    });

    describe('#features', () => {
      it('should fit one item to the total container width', () => {
        instance = new F2FHorizontal(getContainer(), getItems(1));
        checkSizes(100, 100);
      });

      it('should fit items to the half of the container width', () => {
        instance = new F2FVertical(getContainer(), getItems(2));
        checkSizes(50, 100);
      });
    });

    describe('#rearrange', sinon.test(() => {
      it('should visit all items and set dimensions', () => {
        visitItems(F2FVertical);
      });
    }));
  });

  describe('Hangouts', () => {
    var getItem = function (id, type) {
      var item = document.createElement('div');
      item.dataset.id = id;
      item.dataset.streamType = type || 'camera';
      return item;
    };

    var items = {
      publisher: getItem('publisher'),
      '7y4813y4134123': getItem('7y4813y4134123'),
      jjfnj43nj34nj4: getItem('jjfnj43nj34nj4'),
      '234fjwndfjjejj': getItem('234fjwndfjjejj'),
    };

    it('should be initialized properly with random item on stage', () => {
      var container = getContainer();
      expect(container.dataset.onStageCamera).to.not.exist;
      instance = new Hangout(container, items);
      expect(items).to.include.keys(container.dataset.onStageCamera);
      expect(instance.totalOnStage).to.equal(1);
      expect(instance.totalOnStrip).to.equal(3);
      expect(container.dataset.onStageCamera).to.not.equal('publisher');
    });

    it('should be initialized properly with selected camera', () => {
      var container = getContainer();
      var expectedItem = items.jjfnj43nj34nj4;
      instance = new Hangout(container, items, expectedItem);
      expect(instance.totalOnStage).to.equal(1);
      expect(instance.totalOnStrip).to.equal(3);
      expect(container.dataset.onStageCamera).to.equal(expectedItem.dataset.id);
    });

    it('should be initialized properly with selected screen', () => {
      var container = getContainer();
      var expectedItem = items.a = getItem('jjfnj43nj34nj4', 'screen');
      instance = new Hangout(container, items, expectedItem);
      expect(instance.totalOnStage).to.equal(1);
      expect(instance.totalOnStrip).to.equal(4);
      expect(container.dataset.onStageScreen).to.equal(expectedItem.dataset.id);
    });

    describe('#event handler: layoutManager:itemAdded', () => {
      it('should add screen shared to stage when there is not another one there', () => {
        var container = getContainer();
        instance = new Hangout(container, items, items.jjfnj43nj34nj4);
        expect(instance.totalOnStage).to.equal(1);
        var newItem = items.newScreen = getItem('newScreen', 'screen');
        window.dispatchEvent(new CustomEvent('layoutManager:itemAdded', {
          detail: {
            item: newItem,
          },
        }));
        expect(instance.totalOnStage).to.equal(2);
      });
    });

    describe('getItemType', () => {
      var createItem = function (type) {
        var element = document.createElement('div');
        element.dataset.streamType = type;
        return element;
      };

      it('should return camera when the stream is a regular subscriber', () => {
        expect(Hangout.getItemType(createItem('camera'))).to.equal('camera');
      });

      it('should return camera when the stream is the publisher', () => {
        expect(Hangout.getItemType(createItem('publisher'))).to.equal('camera');
      });

      it('should return screen when the stream is a screen shared', () => {
        expect(Hangout.getItemType(createItem('screen'))).to.equal('screen');
      });

      it('should return screen when the stream is unknown', () => {
        expect(Hangout.getItemType(createItem('pedjamijatovic'))).to.equal('screen');
      });
    });

    describe('HangoutHorizontal', () => {
      describe('#constructor', () => {
        it('should be initialized properly', () => {
          var container = getContainer();
          instance = new HangoutHorizontal(container, items);

          expect(container.dataset.currentLayoutType).to.equal('hangout_horizontal');
        });
      });

      describe('#features', () => {
        it('should fit items to container width divided by total minus one on stage', () => {
          instance = new HangoutHorizontal(getContainer(), items, items['7y4813y4134123']);
          var features = instance.features;
          var value = 100 / instance.totalOnStrip;
          expect(features.width).to.equal(value + '%');
          expect(features.height).to.equal('100%');
        });
      });

      describe('#rearrange', sinon.test(() => {
        it('should visit all items and set dimensions', () => {
          visitItems(HangoutHorizontal);
        });
      }));
    });

    describe('HangoutVertical', () => {
      describe('#constructor', () => {
        it('should be initialized properly', () => {
          var container = getContainer();
          instance = new HangoutVertical(container, items);

          expect(container.dataset.currentLayoutType).to.equal('hangout_vertical');
        });
      });

      describe('#features', () => {
        it('should fit items to container height divided by total minus one on stage ' +
           'and the shared screen', () => {
          instance = new HangoutVertical(getContainer(), items, items['7y4813y4134123']);
          var features = instance.features;
          expect(features.width).to.equal('100%');
          var value = 100 / instance.totalOnStrip;
          expect(features.height).to.equal(value + '%');
        });
      });

      describe('#rearrange', sinon.test(() => {
        it('should visit all items and set dimensions', () => {
          visitItems(HangoutVertical);
        });
      }));
    });
  });
});
