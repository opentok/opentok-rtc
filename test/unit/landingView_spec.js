var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LandingView', () => {
  var input,
    enterButton;

  before(() => {
    window.document.body.innerHTML = window.__html__['test/unit/landingView_spec.html'];
    enterButton = document.getElementById('enter');
    input = document.getElementById('room');
  });

  it('should exist', () => {
    expect(LandingView).to.exist;
  });

  describe('#init()', () => {
    it('should export an init function', () => {
      expect(LandingView.init).to.exist;
      expect(LandingView.init).to.be.a('function');
      LandingView.init();
      expect(input.value).to.equals('');
      expect(enterButton.disabled).to.be.equal(false);
    });
  });

  describe('#click event', () => {
    it('should show error when room name is empty', () => {
      var form = document.querySelector('form');
      expect(form.classList.contains('error')).is.false;
      enterButton.click();
      expect(form.classList.contains('error')).is.true;
    });
  });
});
