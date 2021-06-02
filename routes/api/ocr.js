import express from 'express';
import GoogleVisionClient from '~/shared/GoogleVisionClient';
import {File} from 'nodejs-shared';
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const client = new GoogleVisionClient(File.readAsJson('credentials.json'));
    let result;
    if (req.body.type === 'MASK_INSURANCE_CARD')
      result = await client.maskInsuranceCard(req.body.img);
    else if (req.body.type === 'CHECK_LICENSE_NUMBER')
      result = await client.checkLicenseNumber(req.body.img);
    else
      new Error('The type parameter is invalid');
    res.json(result);
  } catch (e) {
    console.error(e.message);
    next(e);
  }
});
export default router;