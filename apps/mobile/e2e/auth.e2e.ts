import { device, element, by, expect as detoxExpect } from 'detox';

describe('Auth Flow (E2E)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('Splash screen ko\'rinadi', async () => {
    await detoxExpect(element(by.id('splash-logo'))).toBeVisible();
  });

  it('Onboarding ekraniga o\'tadi', async () => {
    await detoxExpect(element(by.id('onboarding-screen'))).toBeVisible();
  });

  it('Login ekraniga o\'tadi', async () => {
    await element(by.id('onboarding-start-btn')).tap();
    await detoxExpect(element(by.id('login-screen'))).toBeVisible();
  });

  it('Email va parol kiritib login bo\'ladi', async () => {
    await element(by.id('login-email-input')).typeText('test1@cinesync.app');
    await element(by.id('login-password-input')).typeText('Test123!');
    await element(by.id('login-submit-btn')).tap();
    // Home screen ko'rinishi kutiladi
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  it('Home screen da CINESYNC logo ko\'rinadi', async () => {
    await detoxExpect(element(by.text('CINESYNC'))).toBeVisible();
  });
});
