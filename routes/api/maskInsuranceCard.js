import express from 'express';
import GoogleVisionClient from '~/shared/GoogleVisionClient';
import {File} from 'nodejs-shared';
const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const client = new GoogleVisionClient(File.readAsJson('credentials.json'));
    const result = await client.maskInsuranceCard(req.body.img);
    res.json(result);
  } catch (e) {
    console.error(e.message);
    next(e);
  }
});
export default router;