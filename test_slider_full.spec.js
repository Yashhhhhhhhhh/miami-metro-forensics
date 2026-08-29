const { test, expect } = require('@playwright/test');

test('Full mute toggle and slider test', async ({ page }) => {
  await page.goto('http://localhost:8000');

  const volSlider = page.locator('#volSlider');
  const volBtn = page.locator('#muteBtn');
  const volIco = page.locator('#iconVol');
  const volMut = page.locator('#iconVolMuted');

  // 1. Initial State
  console.log("1. Initial slider value: " + await volSlider.inputValue());

  // 2. Set to 0.5 manually
  await volSlider.evaluate((el) => {
    el.value = 0.5;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  console.log("2. After setting to 0.5: " + await volSlider.inputValue());

  // 3. Mute via button
  await volBtn.evaluate(el => el.click());
  console.log("3. After muting (should be 0): " + await volSlider.inputValue());
  console.log("   Vol icon hidden: " + await volIco.evaluate(el => el.classList.contains('hidden')));
  console.log("   Mut icon hidden: " + await volMut.evaluate(el => el.classList.contains('hidden')));

  // 4. Unmute via button
  await volBtn.evaluate(el => el.click());
  console.log("4. After unmuting (should be 0.5): " + await volSlider.inputValue());
  console.log("   Vol icon hidden: " + await volIco.evaluate(el => el.classList.contains('hidden')));
  console.log("   Mut icon hidden: " + await volMut.evaluate(el => el.classList.contains('hidden')));

  // 5. Manually drag to 0
  await volSlider.evaluate((el) => {
    el.value = 0;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  console.log("5. After manually setting to 0: " + await volSlider.inputValue());
  console.log("   Vol icon hidden: " + await volIco.evaluate(el => el.classList.contains('hidden')));
  console.log("   Mut icon hidden: " + await volMut.evaluate(el => el.classList.contains('hidden')));

  // 6. Unmute via button
  await volBtn.evaluate(el => el.click());
  console.log("6. After unmuting (should be 0.5): " + await volSlider.inputValue());
});
