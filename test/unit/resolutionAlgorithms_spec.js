var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

describe('PreferredResolutionAlgorithmProvider', () => {
  it('should exist and be an object', () => {
    expect(PreferredResolutionAlgorithmProvider).to.exist;
    expect(PreferredResolutionAlgorithmProvider).to.be.a('object');
  });

  var obUnderTest = PreferredResolutionAlgorithmProvider;

  describe('#algorithms', () => {
    it('should be an array of strings', () => {
      var algs = obUnderTest.algorithmNames;
      expect(algs).to.be.a('array');
      algs.forEach((alg) => {
        expect(alg).to.be.a('string');
      });
    });
  });

  describe('#defaultAlgorithm', () => {
    it('should be a string', () => {
      expect(obUnderTest.defaultAlgorithmName).to.be.a('string');
    });

    it('should be on the algorithms array', () => {
      var algs = obUnderTest.algorithmNames;
      var defaultAlg = obUnderTest.defaultAlgorithmName;
      expect(algs.indexOf(defaultAlg)).to.be.at.least(0);
    });
  });

  describe('#getAlg', () => {
    it('should exist and be a function', () => {
      expect(obUnderTest.getAlg).to.exist;
      expect(obUnderTest.getAlg).to.be.a('function');
    });

    it('should return the defaultAlgorithm when called on null or undefined', () => {
      var alg = obUnderTest.getAlg();
      expect(alg.chosenAlgorithm).to.be.equal(obUnderTest.defaultAlgorithmName);
    });

    it('should return the defaultAlgorithm when called with an algorithm that does not exist',
       () => {
         var algs = obUnderTest.algorithmNames;
         var candidate = 'IHopeNoneCallAnAlgorithmThisWay!';
         while (algs.indexOf(candidate) > 0) {
           candidate += 'no, really';
         }
         var alg = obUnderTest.getAlg(candidate);
         expect(alg.chosenAlgorithm).to.be.equal(obUnderTest.defaultAlgorithmName);
       });

    it('should return the requested algorithm if it exists', () => {
      var algs = obUnderTest.algorithmNames;
      var candidate = algs[0];
      var alg = obUnderTest.getAlg(candidate);
      expect(alg.chosenAlgorithm).to.be.equal(candidate);
    });

    it('should always return a valid function', () => {
      var algs = obUnderTest.algorithmNames;
      algs.forEach((algName) => {
        var alg = obUnderTest.getAlg(algName);
        var result = alg.algorithm({ width: 640, height: 480 }, { width: 1200, height: 960 },
                                   { width: 640, height: 480 }, 5);
        expect(result.width).to.exist;
        expect(result.height).to.exist;
      });
    });

    // Note that there are no specific tests for the actual algorithm implementations since they
    // could be added or removed... plus at this point there's no 'valid' behavior
  });
});
