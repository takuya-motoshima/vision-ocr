import express from 'express';
import api from '~/api/visionApi';

const router = express.Router();
router.post('/', async (req, res, next) => {
  try {
    const base64 = await api.maskInsuranceCard(req.body.image);
    res.json(base64);
  } catch (e) {
    next(e);
  }
});

export default router;