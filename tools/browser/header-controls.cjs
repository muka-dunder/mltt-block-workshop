'use strict';
exports.chooseLanguage = async (page, locale) => {
  const settings = page.locator('.header-settings');
  const wasOpen = await settings.evaluate(element => element.open);
  if (!wasOpen) await page.locator('#settingsSummary').click();
  await page.selectOption('#languageSelect', locale);
  if (!wasOpen) await page.locator('#settingsSummary').click();
};
