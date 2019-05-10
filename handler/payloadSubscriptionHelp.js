import videos from '../assets/videos';

export const handler = async (chat) => {
    return chat.sendAttachment(chat.getTranslation(videos.getStarted));
};

export default handler;
