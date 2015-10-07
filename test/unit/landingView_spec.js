var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('LandingView', function(){

  // Since this is a view we need some HTML to test it. By convention, we'll add that to
  // filename.html (where filename is this file name without the extension)
  before(function(){
    // Load the test markup
    window.document.body.innerHTML = window.__html__['test/unit/landingView_spec.html'];
  });

  beforeEach(function(){
  });

  afterEach(function(){
  });
  after(function(){
  });


  it('should exist', function(){
    expect(LandingView).to.exist;
  });

  describe('#init()', function(){
    it('should export a init function', function(){
      expect(LandingView.init).to.exist;
      expect(LandingView.init).to.be.a('function');
    });
  });


});
