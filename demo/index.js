import graphicjs from './node_modules/graphicjs/dist/build.esm.js';
import * as config from './config.js';

/**
 * Initialize preview image.
 */
function initPreviewImg() {
  // Make the first image selected.
  $('#stripContainer > .strip-item:first-child').addClass('selected');

  // Show in main image when image list is selected
  $('[action-select-img]').on('click', async event => {
    const img = $(event.currentTarget).find('img');
    const menu = img.parent();
    const selectedMenu = $('#stripContainer .selected');
    if (menu.get(0) === selectedMenu.get(0)) return;
    selectedMenu.removeClass('selected');
    menu.addClass('selected');
    drawPreviewImg(img.get(0));
    ocr(mainImg.get(0).toDataURL('image/png', 1.));
  });

  // Mask the uploaded image
  $('[action-upload-img]').on('change', async event => {
    const target = $(event.currentTarget);
    if (!target.get(0).files.length) return;
    const base64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.readAsDataURL(target.get(0).files[0]);
      $(reader).on('load', () => resolve(reader.result));
    });
    target.val('');
    const img = new Image();
    img.src = base64;
    if (!img.complete) await new Promise(resolve => $(img).on('load', resolve));
    drawPreviewImg(img);
    ocr(mainImg.get(0).toDataURL('image/png', 1.));
  });

  // Show first image in list as main image
  drawPreviewImg($('#stripContainer .selected img').get(0));
}

/**
 * Draw preview image.
 */
function drawPreviewImg(img) {
  const {naturalWidth: width, naturalHeight: height} = img;
  graphicjs.clearCanvas(mainImg.get(0));
  mainImg.attr('width', width);
  mainImg.attr('height', height);
  mainImg.get(0).getContext('2d').drawImage(img, 0, 0, width, height);
}

/**
 * Analyze your health insurance card with OCR
 */
async function ocr(base64) {
  loader.show();

  // Send mask request.
  const { data } = await request.post('ocr', {image: base64});
  console.log(`Result: ${data.slice(0, 30)}`);

  // Show masked image.
  const img = new Image();
  img.src = data;
  await graphicjs.awaitMediaLoaded(img);
  drawPreviewImg(img);
  loader.hide();
}

// OCR preview image.
const mainImg = $('#mainImg');

// Create a new instance of axios.
const request = axios.create({baseURL: config.baseUrl, timeout: 5000});

// Loader.
const loader = $('#loader');

// Initialize preview image.
initPreviewImg();

(async () => {
  await ocr(mainImg.get(0).toDataURL('image/png', 1.));
})();