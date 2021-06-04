import vision from '@google-cloud/vision';
import {File} from 'nodejs-shared';
import {createCanvas, loadImage} from 'canvas';
import moment from 'moment';
import * as Helper from './Helper';


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
    try {
      // Get file extension.
      const extension = Helper.getExtension(img);

      // Convert image to data URL.
      img = Helper.convertImageToDataURL(img);

      // Create a temporary image file.
      const tmpPath = File.getTmpPath(`.${extension}`);
      File.write(tmpPath, img, 'base64');
      const tmpImg = await loadImage(tmpPath);

      // Detect text.
      const detections = [];
      await this.detectInsurerNumber(tmpPath, detections);
      await this.detectInsurerQrCode(tmpPath, tmpImg.width, tmpImg.height, detections);

      // Mask text.
      const canvas = createCanvas(tmpImg.width, tmpImg.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(tmpImg, 0, 0);
      const boundingBoxes = [];
      for (let detection of detections) {
        const [leftTop, rightTop, rightBottom, leftBottom] = detection;
        boundingBoxes.push({leftTop, rightTop, rightBottom, leftBottom});
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
      const maskedImg = canvas.toDataURL(`image/${extension}`, 1);
      console.log('maskedImg=', maskedImg.slice(0, 30));
      console.log('boundingBoxes=', boundingBoxes);
      return {maskedImg, boundingBoxes};      
    } catch (e) {
      console.error('Health insurance card mask error. Error: ', e);
      throw e;
    }
  }

  /**
   * Detect insurance card number.
   */
  async detectInsurerNumber(imgPath, detections) {
    const [result] = await this.client.textDetection(imgPath);
    if (!result.textAnnotations.length)
      return;
    this.outputResult('insurer', result.textAnnotations);
    const annotations = result.textAnnotations.slice(1) || [];
    for (let [i, annotation] of Object.entries(annotations)) {
      const {description, boundingPoly} = annotation;
      const nextAnnotation = annotations[parseInt(i, 10) + 1] || undefined;
      if (description === '番号' && /^([0-9]+-)*[0-9]+$/.test(nextAnnotation.description))
        detections.push(nextAnnotation.boundingPoly.vertices);
      else if (this.checkInsurerNumber(description))
        detections.push(boundingPoly.vertices);
      else if (description === '記号' && nextAnnotation)
        detections.push(nextAnnotation.boundingPoly.vertices);
    }
  }

  /**
   * Detect QR code.
   */
  async detectInsurerQrCode(imgPath, imgWidth, imgHeight, detections) {
    const [result] = await this.client.objectLocalization(imgPath);
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
   * api.checkInsurerNumber('06139992');  // true
   * api.checkInsurerNumber('138180');    // true
   * 
   * @see <a href="http://hokeninfolist.main.jp/syubetu02.html">List of insurers.</a>
   * @see <a href="http://www.gcdental.co.jp/member/hoken/chap02/contents0205.html">How to check the insurance card number.</a>
   */
  checkInsurerNumber(number) {
    if (!/\d{6}|\d{8}/.test(number = (number || '') + '') || /^0+$/.test(number))
      return false;
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
   * Check digit your license number.
   */
  async checkLicenseNumber(img) {
    try {
      // Get file extension.
      const extension = Helper.getExtension(img);

      // Convert image to data URL.
      img = Helper.convertImageToDataURL(img);

      // Create a temporary image file.
      const tmpPath = File.getTmpPath(`.${extension}`);
      File.write(tmpPath, img, 'base64');
      const tmpImg = await loadImage(tmpPath);

      // Analyze the document.
      const [result] = await this.client.documentTextDetection(tmpPath);
      this.outputResult('license', result.textAnnotations);

      // Check your license number.
      let isDriversLicense = false;
      let driversLicenseNumber = null;
      let boundingBox = null;
      let checkDigitResult = false;
      if (result.textAnnotations.length) {
        isDriversLicense = result.textAnnotations[0].description.indexOf('免許証') !== -1;
        // isDriversLicense = result.textAnnotations[0].description.indexOf('運転免許証') !== -1;
        if (isDriversLicense) {
          const annotations = result.textAnnotations.slice(1) || [];
          for (let {description, boundingPoly} of annotations) {
            const matches = /\d{12}/.exec(description);
            if (!matches) continue;
            driversLicenseNumber = matches[0];

            // Calculate the license number check digit.
            const digit = this.calcLicenseNumberCheckDigit(driversLicenseNumber);
            checkDigitResult = driversLicenseNumber.toString().slice(10, 11) == digit;

            // License number bounding box.
            const [leftTop, rightTop, rightBottom, leftBottom] = boundingPoly.vertices;
            boundingBox = {leftTop, rightTop, rightBottom, leftBottom};
            break;
          }
        }
      }
      return {isDriversLicense, driversLicenseNumber, checkDigitResult, boundingBox};
    } catch (e) {
      console.error('License number check error. Error: ', e);
      throw e;
    }
  }

  /**
   * Calculate license number check digit.
   */
  calcLicenseNumberCheckDigit(number) {
    const weight = [2,3,4,5,6,7,2,3,4,5,6];
    let base = parseInt(number.toString().slice(0, 10), 10);
    let sum = 0;
    for (let i=0; i<10; i++) {
      sum += base % 10 * weight[i];
      base = Math.floor(base / 10);
    }
    const digit = (11 - (sum % 11)) % 10;
    return digit
  }

  /**
   * For debugging, output the image analysis result to the output directory.
   */
  outputResult(fileName, data) {
    const now = moment().format('YYYYMMDD_HHmmss');
    File.write(`${global.APP_DIR}/output/${fileName}_${now}.json`, JSON.stringify(data, null, 2));
  }
}