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
    loader.show();
    const {data} = await request.post('ocr', {
      img: canvas.get(0).toDataURL('image/png', 1.),
      type: 'MASK_INSURANCE_CARD'
    });
    const img = new Image();
    img.src = data;
    await graphicjs.awaitMediaLoaded(img);
    drawCanvas(img);
    loader.hide();
  }

  /**
   * Request verification of license number.
   */
  async function sendDriversLicense() {
    loader.show();
    const res= await request.post('ocr', {
      img: canvas.get(0).toDataURL('image/png', 1.),
      type: 'CHECK_LICENSE_NUMBER'
    });
    console.log('res=', res);
    loader.hide();
  }

  const canvas = $('#canvas');
  const loader = $('#loader');
  const imgs = $('#imgs');
  const request = axios.create({baseURL: config.baseUrl, timeout: 5000});

  // Image list selection event.
  $('[on-select]').on('click', async event => {
    const acitveImg = $(event.currentTarget).find('img');
    const parent = acitveImg.parent();
    const activeImg = imgs.find('.active:first');
    console.log('activeImg=', activeImg);
    if (parent.get(0) === activeImg.get(0)) return;
    activeImg.removeClass('active');
    parent.addClass('active');
    drawCanvas(acitveImg.get(0));
    sendDriversLicense();
    // sendInsuranceCard();
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
    sendDriversLicense();
    // sendInsuranceCard();
  });

  // Draw the first image on the canvas.
  const acitveImg = imgs.find('.active:first img').get(0);
  if (!acitveImg.complete)
    await new Promise(resolve => $(acitveImg).on('load', resolve));
  drawCanvas(acitveImg);

  // Request a health insurance card mask.
  sendDriversLicense();
  // sendInsuranceCard();
})();