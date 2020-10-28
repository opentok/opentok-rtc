var modal = require('../../components/modal.js');
test('snapshot for modal component', () => {
  expect(modal).toMatchSnapshot();
});