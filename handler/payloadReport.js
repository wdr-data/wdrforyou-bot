import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonPostback } from '../lib/facebook';

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendReport(chat, await request({ uri: url, json: true }));
};

const makeMoreButton = function(report) {
    let hasMoreButton = !!report.media;

    for (const translation of report.translations) {
        hasMoreButton |= !!translation.media;
    }

    if (!hasMoreButton) {
        return null;
    }

    return buttonPostback(
        `➡️ ${chat.getTranslation('reportMoreButton')}`,
        {action: 'report_more', report: report.id},
    );
}

const sendReport = async function(chat, report) {
    const languages = report.translations.map(e => e.text);
    languages.push(report.text);
    const message = languages.join("\n\n");

    const moreButton = makeMoreButton(report);

    if (!moreButton) {
        chat.sendText(message);
    }

    return chat.sendButtons(message, [moreButton]);
};

export {
    handler,
    sendReport,
}
