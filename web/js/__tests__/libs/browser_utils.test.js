var Utils = require('../../libs/browser_utils.js');
test('snapshot for browser Utils', () => {
  expect(Utils).toMatchSnapshot();
});
