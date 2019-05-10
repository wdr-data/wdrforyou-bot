import videos from '../assets/videos';
import { subscriptionList } from './payloadSubscribe';
import { snooze } from '../lib/util';

export const handler = async (chat) => {
    await chat.sendAttachment(chat.getTranslation(videos.getStarted));
    await snooze(5000);
    return subscriptionList(chat);
};

export default handler;
