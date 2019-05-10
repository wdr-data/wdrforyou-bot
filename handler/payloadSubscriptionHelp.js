import videos from '../assets/videos';

export const handler = async (chat) => {
    if (chat.trackingEnabled) {
        await chat.track.event('Subscription', 'HelpVideo', chat.language).send();
    }
    return chat.sendAttachment(chat.getTranslation(videos.getStarted));
};

export default handler;
