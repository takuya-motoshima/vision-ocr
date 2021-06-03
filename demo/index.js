import graphicjs from './node_modules/graphicjs/dist/build.esm.js';
import * as config from './config.js';

(async () => {
  /**
   * Draw canvas.
   */
  function drawCanvas(img) {
    const {naturalWidth: width, naturalHeight: height} = img;
    graphicjs.clearCanvas(canvas.get(0));
    canvas
      .attr({width, height})
      .get(0)
      .getContext('2d')
      .drawImage(img, 0, 0, width, height);
  }

  /**
   * Request a health insurance card mask.
   */
  async function sendInsuranceCard() {
    try {
      loader.show();
      const img = await getActiveImg();
      const dataUrl = toDataURL(img);
      const {data} = await request.post('ocr', {img: dataUrl, type: 'MASK_INSURANCE_CARD'});
      const newImg = new Image();
      newImg.src = data;
      await graphicjs.awaitMediaLoaded(newImg);
      drawCanvas(newImg);
    } catch(e) {
      alert('An unexpected error has occurred');
      throw e;
    } finally {
      loader.hide();
    }
  }

  /**
   * Request verification of license number.
   */
  async function sendDriversLicense() {
    loader.show();
    const res= await request.post('ocr', {img: canvas.get(0).toDataURL('image/png', 1.), type: 'CHECK_LICENSE_NUMBER'});
    loader.hide();
  }

  /**
   * Returns the currently active image.
   */
  async function getActiveImg() {
    const img = imgs.find('.active:first img').get(0);
    if (!img.complete)
      await new Promise(resolve => $(img).on('load', resolve));
    return img;
  }

  /**
   * Convert images to data URLs.
   */
  function toDataURL(img) {
    const canvas = document.createElement('canvas');
    canvas.height = img.naturalHeight;
    canvas.width = img.naturalWidth;
    canvas.getContext('2d').drawImage(img, 0, 0);
    const extension = img.src.substr(img.src.lastIndexOf('.') + 1);
    return canvas.toDataURL(`image/${extension}`, 1.);
  }

  const canvas = $('#canvas');
  const loader = $('#loader');
  const imgs = $('#imgs');
  const request = axios.create({baseURL: config.baseUrl, timeout: 5000});
  const result = $('#result');
  const types = $('[type="radio"][name="type"]');

  // Image list selection event.
  imgs.on('click', 'li:not(.active)', async event => {
    imgs.find('li.active').removeClass('active');
    const li = $(event.currentTarget).addClass('active');
    const img = li.find('img:first');
    drawCanvas(img.get(0));
    if (types.filter(':checked').val() === 'MASK_INSURANCE_CARD') sendInsuranceCard();
    else sendDriversLicense();
  });

  // Image upload event.
  $('[on-upload]').on('change', async event => {
    const inputFile = $(event.currentTarget);
    if (!inputFile.get(0).files.length)
      return;
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.readAsDataURL(inputFile.get(0).files[0]);
      $(reader).on('load', () => resolve(reader.result));
    });
    inputFile.val('');
    const img = new Image();
    img.src = dataUrl;
    if (!img.complete)
      await new Promise(resolve => $(img).on('load', resolve));
    drawCanvas(img);
    if (types.filter(':checked').val() === 'MASK_INSURANCE_CARD') sendInsuranceCard();
    else sendDriversLicense();
  });

  /**
   * Change type.
   */
  types.on('change', event => {
    const type = $(event.currentTarget).val();
  });

  // Draw the first image on the canvas.
  drawCanvas(await getActiveImg());

  // Request a health insurance card mask.
  if (types.filter(':checked').val() === 'MASK_INSURANCE_CARD') sendInsuranceCard();
  else sendDriversLicense();

  hljs.highlightBlock(result.get(0));


globalThis.loader = loader;
})();