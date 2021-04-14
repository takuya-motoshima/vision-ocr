import express from 'express';
import VisionOCR from '~/shared/VisionOCR';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    res.json(await VisionOCR.scan({img: req.body.img}));
  } catch (e) {
    next(e);
  }
});

export default router;