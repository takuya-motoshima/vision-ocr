import vision from '@google-cloud/vision';
import {File} from 'nodejs-shared';
import {createCanvas, loadImage} from 'canvas';

/**
 * OCR.
 */
export default new class {

  /**
   * Get a Vision client.
   */
  constructor() {
    this.client = new vision.ImageAnnotatorClient({credentials: File.readAsJson('credentials.json')});
  }

  /**
   * Run OCR.
   * 
   * @param  {string} options.img         Data URL format image or image path.
   */
  async scan(options) {
    // Initialize options.
    options = Object.assign({img: undefined}, options);

    // Convert image to base64.
    if (options.img.match(/^\/..*$/)) {
      // If the image is a path.
      if (!fs.existsSync(options.img)) throw new Error('Image file not found');
      options.img = File.readAsBase64(options.img).split(',')[1];
    } else if(options.img.match(/^data:image\/\w+;base64,..*$/))
      // If the image is a Data URL.
      options.img  = options.img.split(',')[1];
    else
      throw new Error('The image parameter should be the image path or DataURL');

    // Create a temporary image file.
    const tmppath = File.getTmpPath('.png');
    File.write(tmppath, options.img, 'base64');
    const tmpimg = await loadImage(tmppath);

    // Detect text.
    const detections = [];
    await this.detectNumber(tmppath, detections);
    await this.detectOR(tmppath, tmpimg.width, tmpimg.height, detections);

    // Mask text.
    return await this.mask(detections, tmpimg);
  }

  /**
   * Detect insurance card number.
   */
  async detectNumber(filepath, detections) {
    const [result] = await this.client.textDetection(filepath);
    if (!result.textAnnotations.length) return;
    const annotations = result.textAnnotations.slice(1) || [];
    for (let [i, annotation] of Object.entries(annotations)) {
      const {description, boundingPoly} = annotation;
      const nextAnnotation = annotations[parseInt(i, 10) + 1] || undefined;
      if (description === '番号' && /^([0-9]+-)*[0-9]+$/.test(nextAnnotation.description))
        detections.push(nextAnnotation.boundingPoly.vertices);
      else if (this.checkdigitInsurerNumber(description))
        detections.push(boundingPoly.vertices);
      else if (description === '記号' && nextAnnotation)
        detections.push(nextAnnotation.boundingPoly.vertices);
    }
  }

  /**
   * Detect QR code.
   */
  async detectOR(filepath, imgWidth, imgHeight, detections) {
    const [result] = await this.client.objectLocalization(filepath);
    if (!result.localizedObjectAnnotations.length)
      return;
    const object = result.localizedObjectAnnotations.find(object => object.name === '2D barcode');
    if (!object || object.score < .8) return;
    for (let vertex of object.boundingPoly.normalizedVertices) {
      vertex.x *= imgWidth;
      vertex.y *= imgHeight;
    }
    detections.push(object.boundingPoly.normalizedVertices);
  }

  /**
   * Check your health insurance card number.
   * 
   * @example
   * import api from '~/api/visionApi';
   *
   * // Insurance card number check digit.
   * api.checkdigitInsurerNumber('06139992');  // true
   * api.checkdigitInsurerNumber('138180');    // true
   * 
   * @see <a href="http://hokeninfolist.main.jp/syubetu02.html">List of insurers.</a>
   * @see <a href="http://www.gcdental.co.jp/member/hoken/chap02/contents0205.html">How to check the insurance card number.</a>
   */
  checkdigitInsurerNumber(number) {
    if (!/\d{6}|\d{8}/.test(number = (number || '') + '') || /^0+$/.test(number)) return false;
    let sum = 0;
    for (let [i, num] of number.split('').slice(0, -1).entries()) {
      num = parseInt(num, 10) * ((i+1) % 2 ? 2 : 1);
      if (num > 9) {
        let strNum = num.toString().split('');
        num = parseInt(strNum[0], 10) + parseInt(strNum[1], 10);
      }
      sum += num;
    }
    let remainder = sum % 10;
    if (remainder.toString().slice(-1) !== '0') remainder = 10 - remainder;
    return remainder === parseInt(number.slice(-1), 10);
  }

  /**
   * Returns an image with masked text.
   */
  async mask(detections, img) {
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    for (let detection of detections) {
      const [leftTop, rightTop, rightBottom, leftBottom] = detection;
      ctx.beginPath();
      ctx.moveTo(leftTop.x, leftTop.y);
      ctx.lineTo(rightTop.x, rightTop.y);
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.lineTo(leftBottom.x, leftBottom.y);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fill();
    }
    return canvas.toDataURL('image/png', 1);
  }
}