var Chat = require('../../components/chat.js');
test('snapshot for Chat component', () => {
  expect(Chat).toMatchSnapshot();
});