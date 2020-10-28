var ont = require('../../helpers/opentok-network-test.js');
test('snapshot for opentok-network-test component', () => {
  expect(ont).toMatchSnapshot();
});