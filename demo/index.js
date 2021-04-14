import graphicjs from './node_modules/graphicjs/dist/build.esm.js';
import * as config from './config.js';

/**
 * Initialize preview image.
 */
function initTool() {
  // Make the first image selected.
  $('#imgs > .img-list-item:first-child').addClass('selected');

  // Show in main image when image list is selected
  $('[on-select]').on('click', async event => {
    const img = $(event.currentTarget).find('img');
    const menu = img.parent();
    const selectedMenu = $('#imgs .selected');
    if (menu.get(0) === selectedMenu.get(0)) return;
    selectedMenu.removeClass('selected');
    menu.addClass('selected');
    drawCanvas(img.get(0));
    ocr(canvas.get(0).toDataURL('image/png', 1.));
  });

  // Mask the uploaded image
  $('[on-upload]').on('change', async event => {
    const target = $(event.currentTarget);
    if (!target.get(0).files.length) return;
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.readAsDataURL(target.get(0).files[0]);
      $(reader).on('load', () => resolve(reader.result));
    });
    target.val('');
    const img = new Image();
    img.src = dataUrl;
    if (!img.complete) await new Promise(resolve => $(img).on('load', resolve));
    drawCanvas(img);
    ocr(canvas.get(0).toDataURL('image/png', 1.));
  });

  // Show first image in list as main image
  drawCanvas($('#imgs .selected img').get(0));
}

/**
 * Draw preview image.
 */
function drawCanvas(img) {
  const {naturalWidth: width, naturalHeight: height} = img;
  graphicjs.clearCanvas(canvas.get(0));
  canvas.attr('width', width);
  canvas.attr('height', height);
  canvas.get(0).getContext('2d').drawImage(img, 0, 0, width, height);
}

/**
 * Analyze your health insurance card with OCR
 */
async function ocr(dataUrl) {
  loader.show();

  // Send mask request.
  const {data} = await request.post('ocr', {img: dataUrl});
  console.log(`Result: ${data.slice(0, 30)}`);

  // Show masked image.
  const img = new Image();
  img.src = data;
  await graphicjs.awaitMediaLoaded(img);
  drawCanvas(img);
  loader.hide();
}

// OCR preview image.
const canvas = $('#canvas');

// Create a new instance of axios.
const request = axios.create({baseURL: config.baseUrl, timeout: 5000});

// Loader.
const loader = $('#loader');

// Initialize preview image.
initTool();

// OCR the first displayed image.
ocr(canvas.get(0).toDataURL('image/png', 1.));