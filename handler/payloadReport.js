import request from 'request-promise-native';
import urls from '../lib/urls';
import { listElement, buttonPostback } from '../lib/facebook';

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendReport(chat, await request({ uri: url, json: true }));
};

const sendReport = async function(chat, report) {
    const languages = report.translations.map(e => e.text);
    languages.push(report.text);
    const message = languages.join("\n\n");

    return chat.sendText(message);
};

export {
    handler,
    sendReport,
}
