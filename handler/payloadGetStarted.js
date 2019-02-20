import videos from '../assets/videos';
import translations from '../assets/translations';
import {buttonPostback} from "../lib/facebook";

export const handler = async (chat) => {
    const button = buttonPostback(
        chat.getTranslation(translations.subscribe),
        { action: 'subscribe' },
    );

    await chat.sendMediaTemplate(chat.getTranslation(videos.getStarted), [button]);
};

export default handler;
