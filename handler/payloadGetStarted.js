import videos from '../assets/videos';
import { subscriptionList } from './payloadSubscribe';

export const handler = async (chat) => {
    await chat.sendAttachment(chat.getTranslation(videos.getStarted));
    return subscriptionList(chat);
};

export default handler;
