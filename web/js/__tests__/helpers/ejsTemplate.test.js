var ejsTemplate = require('../../helpers/ejsTemplate.js');
test('snapshot for ejsTemplate component', () => {
  expect(ejsTemplate).toMatchSnapshot();
});