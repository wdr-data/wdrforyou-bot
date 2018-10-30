import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonPostback } from '../lib/facebook';

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendMore(chat, await request({ uri: url, json: true }));
};

const sendMore = async function(chat, report) {
    const medias = [];

    if (report.media) {
        medias.push(report.media);
    }

    for (const translation of report.translations) {
        if (translation.media && chat.language === translation.language) {
            medias.push(translation.media);
        }
    }

    for (const media of medias) {
        await chat.sendAttachment(media);
    }

};

export {
    handler,
    sendMore,
}
