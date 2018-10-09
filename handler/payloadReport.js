import request from 'request-promise-native';
import urls from '../lib/urls';
import { listElement, buttonPostback } from '../lib/facebook';

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendReport(chat, await request({ uri: url, json: true }));
};

const sendReport = async function(chat, report) {
    await chat.sendText(report.text);

    for (const translation of report.translations) {
        await chat.sendText(translation.text);
    }
};

export {
    handler,
    sendReport,
}
