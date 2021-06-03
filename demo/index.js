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
   * Send image analysis request.
   */
  async function send(img) {
    try {
      loader.show();
      if (types.filter(':checked').val() === 'MASK_INSURANCE_CARD') {
        // Request a health insurance card mask.
        const {data} = await request.post('maskInsuranceCard', {img: toDataURL(img)});
        const newImg = new Image();
        newImg.src = data;
        await graphicjs.awaitMediaLoaded(newImg);
        drawCanvas(newImg);
      } else {
        // Request verification of license number.
        const {data}= await request.post('checkLicenceNumber', {img: toDataURL(img)});
        console.log('data=', data);
        result.text(JSON.stringify(data, null, 2));
        hljs.highlightBlock(result.get(0));
      }
    } catch(e) {
      alert('An unexpected error has occurred');
      throw e;
    } finally {
      loader.hide();
    }
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
    const img = li.find('img:first').get(0);
    drawCanvas(img);
    send(img);
  });

  // Image upload event.
  $('[on-upload]').on('change', async event => {
    const inputFile = $(event.currentTarget);
    if (!inputFile.get(0).files.length) return;
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
    send(img);
  });

  // Change type.
  types.on('change', async event => {
    const type = $(event.currentTarget).val();

    // Save the type entered in the browser.
    Cookies.set('type', type);

    // Turn off the currently active item.
    imgs.children('li.active:first').removeClass('active');

    // Activates the first item of the currently selected type.
    if (type === 'MASK_INSURANCE_CARD') {
      imgs.attr('type', 'insurance');
      imgs.children('li.insurance:first').addClass('active');
    } else {
      imgs.attr('type', 'license');
      imgs.children('li.license:first').addClass('active');
    }

    // Draw the first image on the canvas.
    const img = await getActiveImg();
    drawCanvas(img);

    // Send image analysis request.
    send(img);
  });

  // Shows previously entered type information.
  if (Cookies.get('type') !== types.filter(':checked').val()) {
    types.filter(`[value="${Cookies.get('type')}"]:first`).prop('checked', true);
    imgs.children('li.active:first').removeClass('active');
    if (Cookies.get('type') === 'MASK_INSURANCE_CARD') {
      imgs.attr('type', 'insurance');
      imgs.children('li.insurance:first').addClass('active');
    } else {
      imgs.attr('type', 'license');
      imgs.children('li.license:first').addClass('active');
    }
  }

  // Draw the first image on the canvas.
  const img = await getActiveImg();
  drawCanvas(img);

  // Request a health insurance card mask.
  send(img);
})();