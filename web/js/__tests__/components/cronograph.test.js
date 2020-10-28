var cronograph = require('../../components/cronograph.js');
test('snapshot for cronograph component', () => {
  expect(cronograph).toMatchSnapshot();
});