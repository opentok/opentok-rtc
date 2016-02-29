var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('RoomView', function() {

  var dock = null;

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/roomView_spec.html'];
    dock = document.getElementById('dock');
  });

  it('should exist', function() {
    expect(RoomView).to.exist;
  });

  describe('#init()', function() {
    it('should export a init function', function() {
      expect(RoomView.init).to.exist;
      expect(RoomView.init).to.be.a('function');
    });

    it('should init the module', sinon.test(function() {
      this.stub(LayoutManager, 'init');
      RoomView.init();
    }));
  });

  describe('#roomControllerEvents', function() {
    it('should listen for roomController:controllersReady event', function() {
      expect(document.querySelectorAll('.menu [disabled]').length).to.equal(2);
      window.dispatchEvent(new CustomEvent('roomController:controllersReady'));
      expect(document.querySelectorAll('.menu [disabled]').length).to.equal(0);
    });
  });

  describe('#screenOnStage', function() {
    it('should collapse the dock when there is a screen on stage', function() {
      expect(dock.classList.contains('collapsed')).to.false;
      window.dispatchEvent(new CustomEvent('hangout:screenOnStage', {
        detail: {
          status: 'on'
        }
      }));
      expect(dock.classList.contains('collapsed')).to.true;
      window.dispatchEvent(new CustomEvent('hangout:screenOnStage', {
        detail: {
          status: 'off'
        }
      }));
      expect(dock.classList.contains('collapsed')).to.false;
    });

    it('should recover the dock position when screen stops sharing and users do not change it',
      function() {
        dock.classList.add('collapsed');
        expect(dock.classList.contains('collapsed')).to.true;
        window.dispatchEvent(new CustomEvent('hangout:screenOnStage', {
          detail: {
            status: 'on'
          }
        }));
        expect(dock.classList.contains('collapsed')).to.true;
        window.dispatchEvent(new CustomEvent('hangout:screenOnStage', {
          detail: {
            status: 'off'
          }
        }));
        expect(dock.classList.contains('collapsed')).to.true;
      }
    );

    it('should not recover the dock position when screen stops sharing and users change it',
      function() {
        dock.classList.remove('collapsed');
        expect(dock.classList.contains('collapsed')).to.false;
        window.dispatchEvent(new CustomEvent('hangout:screenOnStage', {
          detail: {
            status: 'on'
          }
        }));
        expect(dock.classList.contains('collapsed')).to.true;
        dock.querySelector('#handler').click();
        expect(dock.classList.contains('collapsed')).to.false;
        window.dispatchEvent(new CustomEvent('hangout:screenOnStage', {
          detail: {
            status: 'off'
          }
        }));
        expect(dock.classList.contains('collapsed')).to.false;
      }
    );
  });

});
