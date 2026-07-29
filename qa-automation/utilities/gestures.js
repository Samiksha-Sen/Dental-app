// Reusable W3C-actions-based gesture helpers shared by every Page Object.
// All functions take the active WebdriverIO driver as the first argument so
// they stay framework-agnostic (no hidden global state).

async function tap(driver, element) {
  await element.click();
}

async function doubleTap(driver, element) {
  const { x, y, width, height } = await driver.getElementRect(element.elementId);
  const centerX = Math.round(x + width / 2);
  const centerY = Math.round(y + height / 2);
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: centerX, y: centerY },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerUp', button: 0 },
        { type: 'pause', duration: 80 },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ]);
  await driver.releaseActions();
}

async function longPress(driver, element, durationMs = 1200) {
  const { x, y, width, height } = await driver.getElementRect(element.elementId);
  const centerX = Math.round(x + width / 2);
  const centerY = Math.round(y + height / 2);
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: centerX, y: centerY },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: durationMs },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ]);
  await driver.releaseActions();
}

async function swipe(driver, { startX, startY, endX, endY, durationMs = 400 }) {
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: startX, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerMove', duration: durationMs, x: endX, y: endY },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ]);
  await driver.releaseActions();
}

async function scrollDown(driver, fraction = 0.6) {
  const { width, height } = await driver.getWindowRect();
  await swipe(driver, {
    startX: Math.round(width / 2),
    startY: Math.round(height * (0.5 + fraction / 2)),
    endX: Math.round(width / 2),
    endY: Math.round(height * (0.5 - fraction / 2)),
  });
}

async function scrollUp(driver, fraction = 0.6) {
  const { width, height } = await driver.getWindowRect();
  await swipe(driver, {
    startX: Math.round(width / 2),
    startY: Math.round(height * (0.5 - fraction / 2)),
    endX: Math.round(width / 2),
    endY: Math.round(height * (0.5 + fraction / 2)),
  });
}

async function dragAndDrop(driver, sourceElement, targetElement) {
  const source = await driver.getElementRect(sourceElement.elementId);
  const target = await driver.getElementRect(targetElement.elementId);
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: Math.round(source.x + source.width / 2), y: Math.round(source.y + source.height / 2) },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 200 },
        { type: 'pointerMove', duration: 500, x: Math.round(target.x + target.width / 2), y: Math.round(target.y + target.height / 2) },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ]);
  await driver.releaseActions();
}

async function hideKeyboard(driver) {
  try {
    await driver.hideKeyboard();
  } catch (err) {
    // Keyboard already hidden — not a failure condition.
  }
}

async function pressBack(driver) {
  await driver.pressKeyCode(4); // Android KEYCODE_BACK
}

module.exports = {
  tap,
  doubleTap,
  longPress,
  swipe,
  scrollDown,
  scrollUp,
  dragAndDrop,
  hideKeyboard,
  pressBack,
};
