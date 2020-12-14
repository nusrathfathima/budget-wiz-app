import { Selector } from 'testcafe';

const title = Selector('.appName');

fixture('Test')
  .page('http://142.93.1.183');

test('Test', async (t) => {
  await t
    .expect(title.innerText).eql('Budget Wiz')
});