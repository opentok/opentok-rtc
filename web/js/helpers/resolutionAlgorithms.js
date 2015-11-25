!function(exports) {

  // PreferredResolution algorithms. They all take as input the total screen real state available,
  // the available real state for the subscriber being redimensioned, the maximum dimensions of the
  // stream and the number of current subscribers. And based on that it returns the new recommended
  // preferred resolution dimension. All the dimensions are objects that have both a width and
  // height attributes
  var preferredResolutionAlgorithms = {
    // Assuming all the subscribers share a common DOM parent, we can calculate which percent of the
    // whole size we're taking, and thus restrict the stream size...
    percentOfAvailable: function(aStreamDimension, aTotalDimension, aSubsDimension, aSubsNumber) {
      // Assumption: All the subscribers have the same size. What we're going to do is to assign a
      // % of the total pool of pixels available (as sent, not as shown):
      var totalWidth = aStreamDimension.width * aSubsNumber;
      var totalHeight = aStreamDimension.height * aSubsNumber;
      return {
        width: Math.ceil(totalWidth * aSubsDimension.width / aTotalDimension.width),
        height: Math.ceil(totalHeight * aSubsDimension.height / aTotalDimension.height)
      };
    },

    // Assign a % of the actual stream size (as sent, not as shown):
    percentOfStream: function(aStreamDimension, aTotalDimension, aSubsDimension, aSubsNumber) {
      var totalWidth = aStreamDimension.width;
      var totalHeight = aStreamDimension.height;
      var percentW = aSubsDimension.width / aTotalDimension.width;
      var percentH = aSubsDimension.height / aTotalDimension.height;
      return {
        width: Math.ceil(totalWidth * percentW),
        height: Math.ceil(totalHeight * percentH)
      };
    },

    // like percentOfStream but once we're over 70% on any of the dimensions, we just assign the
    // maximum size on both dimensions.
    biasedPercent: function(aStreamDimension, aTotalDimension, aSubsDimension, aSubsNumber) {
      var totalWidth = aStreamDimension.width;
      var totalHeight = aStreamDimension.height;
      var percentW = aSubsDimension.width / aTotalDimension.width;
      var percentH = aSubsDimension.height / aTotalDimension.height;
      if (percentH >= 0.70 || percentW >= 0.70) {
        percentH = 1;
        percentW = 1;
      }
      return {
        width: Math.ceil(totalWidth * percentW),
        height: Math.ceil(totalHeight * percentH)
      };
    }
  };
  var defaultAlgorithm = 'biasedPercent';

  exports.PreferredResolutionAlgorithmProvider = {
    getAlg: function(aAlgorithm) {
      var chosenAlgorithm =
        preferredResolutionAlgorithms[aAlgorithm] && aAlgorithm ||
        defaultAlgorithm;
      return {
        chosenAlgorithm: chosenAlgorithm,
        algorithm: preferredResolutionAlgorithms[chosenAlgorithm]
      };
    },
    get algorithmNames() {
      return Object.keys(preferredResolutionAlgorithms);
    },
    get defaultAlgorithmName() {
      return defaultAlgorithm;
    }
  };

}(this);
