!(exports => {

  // PreferredResolution algorithms. They all take as input the total screen real state available,
  // the available real state for the subscriber being redimensioned, the maximum dimensions of the
  // stream and the number of current subscribers. And based on that it returns the new recommended
  // preferred resolution dimension. All the dimensions are objects that have both a width and
  // height attributes
  const preferredResolutionAlgorithms = {
    // Assuming all the subscribers share a common DOM parent, we can calculate which percent of the
    // whole size we're taking, and thus restrict the stream size...
    percentOfAvailable(aStreamDimension, aTotalDimension, aSubsDimension, aSubsNumber) {
      // Assumption: All the subscribers have the same size. What we're going to do is to assign a
      // % of the total pool of pixels available (as sent, not as shown):
      const totalWidth = aStreamDimension.width * aSubsNumber;
      const totalHeight = aStreamDimension.height * aSubsNumber;
      return {
        width: Math.ceil(totalWidth * aSubsDimension.width / aTotalDimension.width),
        height: Math.ceil(totalHeight * aSubsDimension.height / aTotalDimension.height)
      };
    },

    // Assign a % of the actual stream size (as sent, not as shown):
    percentOfStream(aStreamDimension, aTotalDimension, aSubsDimension, aSubsNumber) {
      const totalWidth = aStreamDimension.width;
      const totalHeight = aStreamDimension.height;
      const percentW = aSubsDimension.width / aTotalDimension.width;
      const percentH = aSubsDimension.height / aTotalDimension.height;
      return {
        width: Math.ceil(totalWidth * percentW),
        height: Math.ceil(totalHeight * percentH)
      };
    },

    // like percentOfStream but once we're over 70% on any of the dimensions, we just assign the
    // maximum size on both dimensions.
    biasedPercent(aStreamDimension, aTotalDimension, aSubsDimension, aSubsNumber) {
      const totalWidth = aStreamDimension.width;
      const totalHeight = aStreamDimension.height;
      let percentW = aSubsDimension.width / aTotalDimension.width;
      let percentH = aSubsDimension.height / aTotalDimension.height;
      if (percentH >= 0.70 || percentW >= 0.70) {
        percentH = 1;
        percentW = 1;
      }
      return {
        width: Math.ceil(totalWidth * percentW),
        height: Math.ceil(totalHeight * percentH)
      };
    },

    // Fit resolution to subscriber dimensions.
    fitToSubscriberDimensions(aStreamDimension, aTotalDimension, aSubsDimension) {
      if (
        ((aSubsDimension.width <= 320) && (aSubsDimension.height <= 240)) ||
        (window.publisherResolution === '320x240')
      ) {
        return {
          width: 320,
          height: 240
        };
      } else if (
        ((aSubsDimension.width <= 640) && (aSubsDimension.height <= 480)) ||
        (window.publisherResolution === '640x480')
      ) {
        return {
          width: 640,
          height: 480
        };
      }
      return {
        width: 1280,
        height: 720
      };
    }

  };
  const defaultAlgorithm = 'fitToSubscriberDimensions';

  exports.PreferredResolutionAlgorithmProvider = {
    getAlg(aAlgorithm) {
      const chosenAlgorithm =
        preferredResolutionAlgorithms[aAlgorithm] && aAlgorithm ||
        defaultAlgorithm;
      return {
        chosenAlgorithm,
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

})(this);
