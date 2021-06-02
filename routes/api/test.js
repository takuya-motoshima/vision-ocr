import express from 'express';
import vision from '@google-cloud/vision';
import {File} from 'nodejs-shared';
import xml2js from 'xml2js';
import {encode} from 'html-entities';

const router = express.Router();

/**
 * OCR the sample image.
 */
router.get('/ocr', async (req, res, next) => {
  try {
    // Annotate a single image with document text detection.
    const client = new vision.ImageAnnotatorClient({credentials: File.readAsJson('credentials.json')});
    const data = await client.documentTextDetection(`${global.APP_ROOT}/demo/insurance/images/1.jpg`);
    console.log('data=', data);
    res.json(true);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

export default router;