import request from 'request-promise-native';
import { sendBroadcastText, sendBroadcastButtons } from "../lib/facebook";
import urls from "../lib/urls";
import { makeMoreButton } from "../handler/payloadReport";
import translations from "../assets/translations";


export const sendReport = async (event, context, callback) => {
    const payload = JSON.parse(event.body);

    callback(null, {
        statusCode: 200,
        body: 'ok',
    });

    console.log(JSON.stringify(payload, null, 2));

    const reportID = payload.id;
    const url = `${urls.report(reportID)}`;

    const report = await request({ uri: url, json: true });


    if (!report) {
        console.error(`Report ${reportID} could not be retrieved from API`);
        return;
    }

    console.log('Sending report: ' + JSON.stringify(report, null, 2));

    let moreButton = makeMoreButton(translations.reportMoreButton.german, report);

    let linkButton;

    if (report.link) {
        linkButton = buttonUrl(`🔗 Link`, report.link);
    }

    let buttons = [linkButton, moreButton].filter(e => !!e);

    if (!buttons.length) {
        console.log('Sending broadcast without buttons');
        // Always send german text to german-subscribers
        await sendBroadcastText(report.text, null, 'german');

        for (const translation of report.translations) {
            await sendBroadcastText(`${translation.text}\n\n${report.text}`, null, translation.language);
        }
    } else {
        console.log('Sending broadcast with buttons');
        // Always send german text to german-subscribers
        await sendBroadcastButtons(report.text, buttons, null, 'german');

        for (const translation of report.translations) {
            moreButton = makeMoreButton(translations.reportMoreButton[translation.language], report);
            buttons = [linkButton, moreButton].filter(e => !!e);
            await sendBroadcastButtons(`${translation.text}\n\n${report.text}`, buttons, null, translation.language);
        }
    }

    return markSent(reportID);
};

const markSent = async (id) => {
    try {
        const response = await request.patch({
            uri: urls.report(id),
            body: { delivered: true },
            json: true,
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated report ${id} to delivered`, response);
    } catch (e) {
        console.log(`Failed to update report ${id} to delivered`, e.message);
        throw e;
    }
};
