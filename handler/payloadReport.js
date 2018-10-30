import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonPostback } from '../lib/facebook';

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendReport(chat, await request({ uri: url, json: true }));
};

const makeMoreButton = function(title, report) {
    let hasMoreButton = !!report.media;

    for (const translation of report.translations) {
        hasMoreButton |= !!translation.media;
    }

    if (!hasMoreButton) {
        return null;
    }

    return buttonPostback(
        `➡️ ${title}`,
        {action: 'report_more', report: report.id},
    );
};

const sendReport = async function(chat, report) {
    const languages = [];

    for (const translation of report.translations) {
        if (chat.language === translation.language) {
            languages.push(translation.text);
        }
    }

    languages.push(report.text);
    const message = languages.join("\n\n");

    const moreButton = makeMoreButton(chat.getTranslation('reportMoreButton'), report);

    if (!moreButton) {
        chat.sendText(message);
    }

    return chat.sendButtons(message, [moreButton]);
};

export {
    handler,
    sendReport,
    makeMoreButton,
}
