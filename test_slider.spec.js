const { test, expect } = require('@playwright/test');

test('Slider interactions update state properly', async ({ page }) => {
  await page.goto('http://localhost:8000');

  const volSlider = page.locator('#volSlider');
  const volBtn = page.locator('#muteBtn');
  const volIco = page.locator('#iconVol');
  const volMut = page.locator('#iconVolMuted');

  // Set slider value via evaluate to avoid locator issues
  await volSlider.evaluate((el) => {
    el.value = 0;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  console.log("Slider value after manual 0: " + await volSlider.inputValue());
  console.log("Is volume icon hidden: " + await volIco.evaluate(el => el.classList.contains('hidden')));
  console.log("Is mute icon hidden: " + await volMut.evaluate(el => el.classList.contains('hidden')));

  // Click mute button
  await volBtn.evaluate(el => el.click());

  console.log("Slider value after unmute: " + await volSlider.inputValue());
});
