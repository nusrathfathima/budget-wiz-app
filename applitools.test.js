import Eyes from '@applitools/eyes-testcafe';
import { Selector } from 'testcafe';

// Initialize the eyes
const eyes = new Eyes();

// Set page used in the test
fixture`Budget Wiz App`.page`http://142.93.1.183`
    .afterEach(async () => eyes.close())
    .after(async () => {
        await eyes.waitForResults(false)
    });

test('visualRegressionTest', async t => {
    // Call Open on eyes to initialize a test session
    await eyes.open({
        t, // pass testcafe controller
        appName: 'Budget Wiz App',
        testName: 'Budget Wiz Visual Regression Test',
    });

    await eyes.checkWindow({
        tag: "Home Page",
        target: 'window',
        fully: true
    });

    // This will create a test with two test steps.
    await t.typeText(Selector('#username'), 'nus')
    await t.typeText(Selector('#password'), '123')

    await t.setNativeDialogHandler(() => true).click(Selector('button').withText('Login'))

    await t.wait(10000)

    await eyes.checkWindow({
        tag: "Dashboard Page",
        target: 'window',
        fully: true
    })
});