var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LandingView', function() {

  var input, enterButton;

  before(function() {
    window.document.body.innerHTML = window.__html__['test/unit/landingView_spec.html'];
    enterButton = document.getElementById('enter');
    input = document.getElementById('room');
  });

  it('should exist', function() {
    expect(LandingView).to.exist;
  });

  describe('#init()', function() {
    it('should export an init function', function() {
      expect(LandingView.init).to.exist;
      expect(LandingView.init).to.be.a('function');
      LandingView.init();
      expect(input.value).to.equals('');
      expect(enterButton.disabled).to.be.equal(false);
    });
  });

  describe('#click event', function() {
    it('should show error when room name is empty', function() {
      var form = document.querySelector('form');
      expect(form.classList.contains('error')).is.false;
      enterButton.click();
      expect(form.classList.contains('error')).is.true;
    });
  });

});
