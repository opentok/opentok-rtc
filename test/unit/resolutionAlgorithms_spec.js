var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('PreferredResolutionAlgorithmProvider', function() {

  it('should exist and be an object', function() {
    expect(PreferredResolutionAlgorithmProvider).to.exist;
    expect(PreferredResolutionAlgorithmProvider).to.be.a('object');
  });

  var obUnderTest = PreferredResolutionAlgorithmProvider;

  describe('#algorithms', function() {
    it('should be an array of strings', function() {
      var algs = obUnderTest.algorithmNames;
      expect(algs).to.be.a('array');
      algs.forEach(function(alg) {
        expect(alg).to.be.a('string');
      });
    });
  });

  describe('#defaultAlgorithm', function() {
    it('should be a string', function() {
      expect(obUnderTest.defaultAlgorithmName).to.be.a('string');
    });

    it('should be on the algorithms array', function() {
      var algs = obUnderTest.algorithmNames;
      var defaultAlg = obUnderTest.defaultAlgorithmName;
      expect(algs.indexOf(defaultAlg)).to.be.at.least(0);
    });
  });

  describe('#getAlg', function() {
    it('should exist and be a function', function() {
      expect(obUnderTest.getAlg).to.exist;
      expect(obUnderTest.getAlg).to.be.a('function');
    });

    it('should return the defaultAlgorithm when called on null or undefined', function() {
      var alg = obUnderTest.getAlg();
      expect(alg.chosenAlgorithm).to.be.equal(obUnderTest.defaultAlgorithmName);
    });

    it('should return the defaultAlgorithm when called with an algorithm that does not exist',
       function() {
       var algs = obUnderTest.algorithmNames;
       var candidate = 'IHopeNoneCallAnAlgorithmThisWay!';
       while (algs.indexOf(candidate) > 0) {
         candidate = candidate + 'no, really';
       }
       var alg = obUnderTest.getAlg(candidate);
       expect(alg.chosenAlgorithm).to.be.equal(obUnderTest.defaultAlgorithmName);
    });

    it('should return the requested algorithm if it exists', function() {
      var algs = obUnderTest.algorithmNames;
      var candidate = algs[0];
      var alg = obUnderTest.getAlg(candidate);
      expect(alg.chosenAlgorithm).to.be.equal(candidate);
    });

    it('should always return a valid function', function() {
      var algs = obUnderTest.algorithmNames;
      algs.forEach(function(algName) {
        var alg = obUnderTest.getAlg(algName);
        var result = alg.algorithm({width: 640, height: 480}, {width: 1200, height: 960},
                                   {width: 640, height: 480}, 5);
        expect(result.width).to.exist;
        expect(result.height).to.exist;
      });
    });

    // Note that there are no specific tests for the actual algorithm implementations since they
    // could be added or removed... plus at this point there's no 'valid' behavior
  });

});
