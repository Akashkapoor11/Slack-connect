import { Router } from 'express';
import channelsRouter from './channels.routes';
import messagesRouter from './messages.routes';

const router = Router();

// mount sub-routers
router.use('/channels', channelsRouter);
router.use('/messages', messagesRouter);

export default router;
