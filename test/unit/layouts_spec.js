var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('Layouts', function() {

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

  var checkSizes = function(width, height) {
    var features = instance.features;
    expect(features.width).to.equal((width - instance._PADDING) + '%');
    expect(features.height).to.equal((height - instance._PADDING) + '%');
  }

  var visitItems = function(clazz) {
    var items = getItems(2);
    instance = new clazz(getContainer(), items);
    instance.rearrange();
    var features = instance.features;
    Object.keys(items).forEach(function(id) {
      var item = items[id];
      expect(features.width).to.equal(item.style.width.replace(',', '.'));
      expect(features.height).to.equal(item.style.height.replace(',', '.'));
    });
  }

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/layouts_spec.html'];
  });

  describe('LayoutBase', function() {

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var expectedLayoutName = 'pepito';
        var container = getContainer();
        instance = new LayoutBase(container, {}, expectedLayoutName);

        expect(container.dataset.currentLayoutType).to.equal(expectedLayoutName);
      });
    });

    describe('#total', function() {
      it('should return the number total of items', function() {
        var expectedNumber = 3;
        instance = new Grid(getContainer(), getItems(expectedNumber));

        expect(instance.total).to.equal(expectedNumber);
      });
    });

  });

  describe('Grid', function() {

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var container = getContainer();
        instance = new Grid(container, {});

        expect(container.dataset.currentLayoutType).to.equal('grid');
      });
    });

    describe('#features', function() {
      it('should fit one item to the whole container', function() {
        instance = new Grid(getContainer(), getItems(1));
        checkSizes(100, 100);
      });

      it('should fit two items to the half of the container width', function() {
        instance = new Grid(getContainer(), getItems(2));
        checkSizes(50, 100);
      });

      it('should fit three/four items to the half container height and width', function() {
        var items = getItems(3);
        instance = new Grid(getContainer(), items);
        checkSizes(50, 50);

        items[3] = document.createElement('div');
        checkSizes(50, 50);
      });
    });

    describe('#rearrange', sinon.test(function() {
      it('should visit all items and set dimensions', function() {
        visitItems(Grid);
      });
    }));

  });

  describe('Float', function() {

    var checkSizes = function(width, height) {
      var features = instance.features;
      expect(features.width).to.equal('100%');
      expect(features.height).to.equal('100%');
    }

    function stubDraggable(ctx, callback) {
      ctx.stub(Utils, 'getDraggable', callback || function() {
        return Promise.resolve({
            on: function() {}
        });
      });
    }

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var container = getContainer();
        instance = new Float(container, {});
        expect(container.dataset.currentLayoutType).to.equal('float');
      });

      it('should set the publisher as draggable', sinon.test(function(done) {
        var container = getContainer();
        var publisher = document.createElement('myPublisher');

        stubDraggable(this, function() {
          return Promise.resolve({
            on: function(element) {
              expect(element).to.equal(publisher);
              done();
            }
          })
        });

        instance = new Float(container, {
          publisher: publisher
        });
        expect(container.dataset.currentLayoutType).to.equal('float');
      }));
    });

    describe('#features', function() {
      it('should fit items to the whole container', function() {
        var items = getItems(1);
        instance = new Float(getContainer(), items);
        checkSizes(100, 100);

        items[1] = document.createElement('div');
        checkSizes(100, 100);
      });
    });

    describe('#rearrange', sinon.test(function() {
      it('should visit all items and set dimensions', function() {
        visitItems(Float);
      });
    }));

    describe('#destroy', function() {
      it('should disable drag feature for the publisher', sinon.test(function() {
        var publisher = document.createElement('div');
        stubDraggable(this, function() {
          return Promise.resolve({
            on: function() {},
            off: function(element) {
              expect(element).to.equal(publisher);
              done();
            }
          })
        });

        instance = new Float(getContainer(), {
          'publisher': publisher
        });
        instance.destroy();
      }));
    });

  });

  describe('F2FHorizontal', function() {

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var container = getContainer();
        instance = new F2FHorizontal(container, {});

        expect(container.dataset.currentLayoutType).to.equal('f2f_horizontal');
      });
    });

    describe('#features', function() {
      it('should fit one item to the total container height', function() {
        instance = new F2FHorizontal(getContainer(), getItems(1));
        checkSizes(100, 100);
      });

      it('should fit items to the half of the container height', function() {
        instance = new F2FHorizontal(getContainer(), getItems(2));
        checkSizes(100, 50);
      });
    });

    describe('#rearrange', sinon.test(function() {
      it('should visit all items and set dimensions', function() {
        visitItems(F2FHorizontal);
      });
    }));

  });

  describe('F2FVertical', function() {

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var container = getContainer();
        instance = new F2FVertical(container, {});

        expect(container.dataset.currentLayoutType).to.equal('f2f_vertical');
      });
    });

    describe('#features', function() {
      it('should fit one item to the total container width', function() {
        instance = new F2FHorizontal(getContainer(), getItems(1));
        checkSizes(100, 100);
      });

      it('should fit items to the half of the container width', function() {
        instance = new F2FVertical(getContainer(), getItems(2));
        checkSizes(50, 100);
      });
    });

    describe('#rearrange', sinon.test(function() {
      it('should visit all items and set dimensions', function() {
        visitItems(F2FVertical);
      });
    }));

  });

  describe('HangoutHorizontal', function() {

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var container = getContainer();
        instance = new HangoutHorizontal(container, {});

        expect(container.dataset.currentLayoutType).to.equal('hangout_horizontal');
      });
    });

    describe('#features', function() {
      it('should fit items to container width divided by total minus one on stage', function() {
        instance = new HangoutHorizontal(getContainer(), getItems(5));
        var features = instance.features;
        expect(features.width).to.equal((25 - (instance._PADDING / 2)) + '%');
        expect(features.height).to.equal('100%');
      });
    });

    describe('#rearrange', sinon.test(function() {
      it('should visit all items and set dimensions', function() {
        visitItems(HangoutHorizontal);
      });
    }));

  });

  describe('HangoutVertical', function() {

    describe('#constructor', function() {
      it('should be initialized properly', function() {
        var container = getContainer();
        instance = new HangoutVertical(container, {});

        expect(container.dataset.currentLayoutType).to.equal('hangout_vertical');
      });
    });

    describe('#features', function() {
      it('should fit items to container height divided by total minus one on stage', function() {
        instance = new HangoutVertical(getContainer(), getItems(5));
        var features = instance.features;
        expect(features.width).to.equal('100%');
        expect(features.height).to.equal((25 - (instance._PADDING / 2)) + '%');
      });
    });

    describe('#rearrange', sinon.test(function() {
      it('should visit all items and set dimensions', function() {
        visitItems(HangoutVertical);
      });
    }));

  });

});
