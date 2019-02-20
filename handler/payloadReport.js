import request from 'request-promise-native';
import moment from 'moment-timezone';
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

export const translateReport = function(report, chat) {
    for (const translation of report.translations) {
        if (chat.language === translation.language) {
            return translation;
        }
    }
}

const sendReport = async function(chat, report) {
    const languages = [];
    const reportDate = moment(report.created).tz('Europe/Berlin').format('DD.MM.YYYY');

    languages.push(translateReport(report, chat).text);

    languages.push(report.text);
    const message = `📅 ${reportDate}\n\n${languages.join('\n\n')}`;

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
