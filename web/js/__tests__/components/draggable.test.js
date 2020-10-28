var draggable = require('../../components/draggable.js');
test('snapshot for draggable component', () => {
  expect(draggable).toMatchSnapshot();
});