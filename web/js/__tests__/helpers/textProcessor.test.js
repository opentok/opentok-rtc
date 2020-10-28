var textProcessor = require('../../helpers/textProcessor.js');
test('snapshot for textProcessor component', () => {
  expect(textProcessor).toMatchSnapshot();
});