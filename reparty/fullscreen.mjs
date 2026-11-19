// The portal owns its iframe, so it can enter native fullscreen even in the
// desktop shell where fullscreen requests from child frames are restricted.
export function createFullscreen(tv, button) {
  const embedded = window.frameElement;
  const target = embedded || tv;
  const owner = target.ownerDocument;
  const supported = !!(target.requestFullscreen || target.webkitRequestFullscreen) &&
    (owner.fullscreenEnabled ?? owner.webkitFullscreenEnabled ?? true);
  document.documentElement.classList.toggle('provider-fullscreen', !supported);
  const root = document.documentElement;
  const controls = tv.querySelector('.playback-controls');
  const icon = button.querySelector('path');
  const enterIcon = icon.getAttribute('d');
  let timer, holding = false, keyboard = false;
  const active = () => (owner.fullscreenElement || owner.webkitFullscreenElement) === target;
  function reveal() {
    if (!active()) return;
    tv.classList.remove('controls-asleep');
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!holding && !keyboard) tv.classList.add('controls-asleep');
    }, 1800);
  }
  function sync() {
    const on = active();
    root.classList.toggle('video-fullscreen', on);
    button.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Full screen');
    button.title = on ? 'Exit fullscreen (F)' : 'Full screen (F)';
    icon.setAttribute('d', on ? 'M3 8h5V3m8 0v5h5M3 16h5v5m8 0v-5h5' : enterIcon);
    clearTimeout(timer);
    holding = keyboard = false;
    tv.classList.remove('controls-asleep');
    if (on) reveal();
    else button.focus({preventScroll:true});
  }
  owner.addEventListener('fullscreenchange', sync);
  owner.addEventListener('webkitfullscreenchange', sync);
  tv.addEventListener('pointermove', () => { keyboard = false; reveal(); });
  let wakingTouch = false;
  tv.addEventListener('pointerdown', event => {
    wakingTouch = event.pointerType === 'touch' && tv.classList.contains('controls-asleep') && event.target.id === 'screenShield';
    holding = true; keyboard = false; reveal();
  });
  tv.addEventListener('click', event => {
    if (!wakingTouch) return;
    wakingTouch = false; event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  for (const event of ['pointerup','pointercancel','blur']) {
    window.addEventListener(event, () => { holding = false; reveal(); });
  }
  document.addEventListener('keydown', event => {
    keyboard = event.key === 'Tab' || (keyboard && controls.contains(document.activeElement));
    reveal();
  }, true);
  tv.addEventListener('focusin', reveal);
  async function toggle() {
    if (active()) return (owner.exitFullscreen || owner.webkitExitFullscreen).call(owner);
    const enter = target.requestFullscreen || target.webkitRequestFullscreen;
    if (!enter) throw new Error('This browser does not support fullscreen for this player.');
    await enter.call(target);
  }
  return {active, supported, toggle};
}
