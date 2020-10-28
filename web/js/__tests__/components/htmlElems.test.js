var htmlElems = require('../../components/htmlElems.js');
test('snapshot for htmlElems component', () => {
  expect(htmlElems).toMatchSnapshot();
});