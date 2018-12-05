import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonPostback } from '../lib/facebook';

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendMore(chat, await request({ uri: url, json: true }));
};

const sendMore = async function(chat, report) {
    await chat.track.event('Bot', 'Medien Button', report.headline).send();

    if (chat.language === 'german' && report.media) {
        await chat.sendAttachment(report.media);
    }

    for (const translation of report.translations) {
        if (chat.language === translation.language && translation.media) {
            await chat.sendAttachment(translation.media);
        }
    }
};

export {
    handler,
    sendMore,
}
