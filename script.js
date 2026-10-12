const lightbox = document.querySelector('#media-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const closeButton = document.querySelector('.lightbox-close');
const lightboxStage = document.querySelector('#lightbox-stage');
const zoomInput = document.querySelector('#zoom-level');
const zoomButtons = [...document.querySelectorAll('[data-zoom]')];

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const SCALE_STEP = 0.1;
const DEFAULT_SCALE = 1;
let scale = DEFAULT_SCALE;
let offsetX = 0;
let offsetY = 0;
let dragStart = null;

function renderTransform() {
  lightboxImage.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`;
  lightboxStage.classList.toggle('is-zoomed', scale > DEFAULT_SCALE);
  zoomInput.value = Math.round(scale * 100);
  document.querySelector('[data-zoom="out"]').disabled = scale <= MIN_SCALE;
  document.querySelector('[data-zoom="in"]').disabled = scale >= MAX_SCALE;
}

function setScale(nextScale) {
  scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
  if (scale <= DEFAULT_SCALE) {
    offsetX = 0;
    offsetY = 0;
  }
  renderTransform();
}

function resetView() {
  scale = DEFAULT_SCALE;
  offsetX = 0;
  offsetY = 0;
  renderTransform();
}

document.querySelectorAll('.media-preview').forEach((preview) => {
  preview.addEventListener('click', () => {
    const thumbnail = preview.querySelector('img');
    lightboxImage.src = preview.dataset.lightboxSrc;
    lightboxImage.alt = thumbnail.alt;
    lightboxCaption.textContent = preview.dataset.lightboxCaption;
    resetView();
    lightbox.showModal();
  });
});

zoomButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.zoom === 'in') setScale(scale + SCALE_STEP);
    if (button.dataset.zoom === 'out') setScale(scale - SCALE_STEP);
    if (button.dataset.zoom === 'reset') resetView();
  });
});

function applyManualZoom() {
  const percentage = Number.parseFloat(zoomInput.value);
  if (!Number.isFinite(percentage)) {
    zoomInput.value = Math.round(scale * 100);
    return;
  }
  setScale(percentage / 100);
}

zoomInput.addEventListener('change', applyManualZoom);
zoomInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    applyManualZoom();
    zoomInput.blur();
  }
});

lightboxStage.addEventListener('wheel', (event) => {
  event.preventDefault();
  setScale(scale + (event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP));
}, { passive: false });

lightboxStage.addEventListener('dblclick', () => {
  setScale(scale <= DEFAULT_SCALE ? 2 : DEFAULT_SCALE);
});

lightboxStage.addEventListener('pointerdown', (event) => {
  if (scale <= DEFAULT_SCALE) return;
  dragStart = { x: event.clientX - offsetX, y: event.clientY - offsetY };
  lightboxStage.setPointerCapture(event.pointerId);
  lightboxStage.classList.add('is-dragging');
});

lightboxStage.addEventListener('pointermove', (event) => {
  if (!dragStart) return;
  offsetX = event.clientX - dragStart.x;
  offsetY = event.clientY - dragStart.y;
  renderTransform();
});

function finishDrag(event) {
  if (!dragStart) return;
  dragStart = null;
  if (lightboxStage.hasPointerCapture(event.pointerId)) lightboxStage.releasePointerCapture(event.pointerId);
  lightboxStage.classList.remove('is-dragging');
}

lightboxStage.addEventListener('pointerup', finishDrag);
lightboxStage.addEventListener('pointercancel', finishDrag);

closeButton.addEventListener('click', () => lightbox.close());

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

lightbox.addEventListener('close', () => {
  resetView();
  lightboxImage.removeAttribute('src');
});
