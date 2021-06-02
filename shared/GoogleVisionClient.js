import vision from '@google-cloud/vision';
import {File} from 'nodejs-shared';
import {createCanvas, loadImage} from 'canvas';

/**
 * Health insurance card OCR.
 */
export default class {
  /**
   * Get a Vision client.
   */
  constructor(credentials) {
    this.client = new vision.ImageAnnotatorClient({credentials: File.readAsJson('credentials.json')});
  }

  /**
   * Mask the personal information on your health insurance card.
   */
  async maskInsuranceCard(img) {
    /**
     * Detect insurance card number.
     */
    async function detectInsurerNumber(imgPath, detections) {
      const [result] = await this.client.textDetection(imgPath);
      if (!result.textAnnotations.length) return;
      const annotations = result.textAnnotations.slice(1) || [];
      for (let [i, annotation] of Object.entries(annotations)) {
        const {description, boundingPoly} = annotation;
        const nextAnnotation = annotations[parseInt(i, 10) + 1] || undefined;
        if (description === '番号' && /^([0-9]+-)*[0-9]+$/.test(nextAnnotation.description))
          detections.push(nextAnnotation.boundingPoly.vertices);
        else if (checkInsurerNumber(description))
          detections.push(boundingPoly.vertices);
        else if (description === '記号' && nextAnnotation)
          detections.push(nextAnnotation.boundingPoly.vertices);
      }
    }

    /**
     * Detect QR code.
     */
    async function detectQrCode(imgPath, imgWidth, imgHeight, detections) {
      const [result] = await this.client.objectLocalization(imgPath);
      if (!result.localizedObjectAnnotations.length) return;
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
     * api.checkInsurerNumber('06139992');  // true
     * api.checkInsurerNumber('138180');    // true
     * 
     * @see <a href="http://hokeninfolist.main.jp/syubetu02.html">List of insurers.</a>
     * @see <a href="http://www.gcdental.co.jp/member/hoken/chap02/contents0205.html">How to check the insurance card number.</a>
     */
    function checkInsurerNumber(number) {
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

    // Convert image to data URL.
    img = this.convertImageToDataURL(img);

    // Create a temporary image file.
    const tmpPath = File.getTmpPath('.png');
    File.write(tmpPath, img, 'base64');
    const tmpImg = await loadImage(tmpPath);

    // Detect text.
    const detections = [];
    await detectInsurerNumber(tmpPath, detections);
    await detectQrCode(tmpPath, tmpImg.width, tmpImg.height, detections);

    // Mask text.
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

  /**
   * Check digit your license number.
   */
  async checkLicenseNumber(img) {
    // Convert image to data URL.
    img = this.convertImageToDataURL(img);
    return true;
  }

  /**
   * Convert image to data URL.
   */
  convertImageToDataURL(img) {
    if (img.match(/^\/..*$/)) {
      if (!fs.existsSync(img)) throw new Error(`${img} cannot be found`);
      return File.readAsBase64(img).split(',')[1];
    } else if(img.match(/^data:image\/\w+;base64,..*$/)) {
      return img.split(',')[1];
    } else {
      throw new Error('The image parameter is invalid');
    }
  }
}