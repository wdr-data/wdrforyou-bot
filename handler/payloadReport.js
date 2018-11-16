import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonPostback, buttonUrl, guessAttachmentType } from '../lib/facebook';
import translations from "../assets/translations";

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
    const message = '+++NEWS+++\n' + languages.join('\n\n');

    let linkButton;
    let moreButton;

    if (report.link) {
        linkButton = buttonUrl(`🔗 Link`, report.link);
    }

    if (report.media) {
        let title;
        let mediaType = guessAttachmentType(report.media)
        if (mediaType == 'audio') {
            title = chat.getTranslation(translations.reportAudioButton);
        } else {
            title = chat.getTranslation(translations.reportVideoButton);
        }

        moreButton = makeMoreButton(title, report);
    }

    const buttons = [linkButton, moreButton].filter(e => !!e);

    if (!buttons.length) {
        return chat.sendText(message);
    }

    return chat.sendButtons(message, buttons);
};

export {
    handler,
    sendReport,
    makeMoreButton,
}
