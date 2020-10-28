var resolutionAlgorithms = require('../../helpers/resolutionAlgorithms.js');
test('snapshot for resolutionAlgorithms component', () => {
  expect(resolutionAlgorithms).toMatchSnapshot();
});