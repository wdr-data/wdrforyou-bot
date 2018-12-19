import request from 'request-promise-native';
import urls from '../lib/urls';
import { buttonPostback, buttonUrl, guessAttachmentType } from '../lib/facebook';
import translations from "../assets/translations";

const handler = async function(chat, payload) {
    const url = `${urls.report(payload.report)}`;

    return sendReport(chat, await request({ uri: url, json: true }));
};

const makeMoreButton = function(report, language) {
    let media;

    if (language === 'german') {
        media = report.media
    } else {
        for (const translation of report.translations) {
            if (translation.language === language) {
                media = translation.media;
            }
        }
    }

    if (!media) {
        return null;
    }

    const mediaType = guessAttachmentType(media);
    let title;

    if (mediaType === 'audio') {
        title = `▶️ ${translations.reportAudioButton[language]}`;
    } else {
        title = `▶️ ${translations.reportVideoButton[language]}`;
    }

    return buttonPostback(
        title,
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
    const moreButton = makeMoreButton(report, chat.language);

    if (report.link) {
        linkButton = buttonUrl(`🔗 ${chat.getTranslation(translations.reportLinkButton)}`, report.link);
    }

    const buttons = [moreButton, linkButton].filter(e => !!e);

    if (!buttons.length) {
        return chat.sendText(message);
    }

    if (chat.trackingEnabled) {
        await chat.track.event('Report', 'Full report', report.headline).send();
    }
    return chat.sendButtons(message, buttons);
};

export {
    handler,
    sendReport,
    makeMoreButton,
}
