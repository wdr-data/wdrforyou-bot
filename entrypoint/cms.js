import request from 'request-promise-native';
import { sendBroadcastText, sendBroadcastButtons, buttonUrl } from "../lib/facebook";
import urls from "../lib/urls";
import { makeMoreButton } from "../handler/payloadReport";
import translations from "../assets/translations";


export const sendReport = async (event, context) => {
    try {
        const payload = JSON.parse(event.body);

        console.log(JSON.stringify(payload, null, 2));

        const reportID = payload.id;
        const url = `${urls.report(reportID)}`;

        const report = await request({uri: url, json: true});


        if (!report) {
            console.error(`Report ${reportID} could not be retrieved from API`);
            return;
        }

        console.log('Sending report: ' + JSON.stringify(report, null, 2));

        const prefix = '+++NEWS+++\n';

        const allTranslations = [report, ...report.translations];

        for (const translation of allTranslations) {
            const moreButton = makeMoreButton(report, translation.language || 'german');
            let linkButton;

            if (translation.link) {
                linkButton = buttonUrl(`🔗 ${translations.reportLinkButton[translation.language || 'german']}`, translation.link);
            }

            const buttons = [moreButton, linkButton].filter(e => !!e);

            let text;
            if (!translation.language) {
                text = prefix + translation.text;
            } else {
                text = `${prefix}${translation.text}\n\n${report.text}`;
            }

            if (!buttons.length) {
                console.log('Sending broadcast without buttons');
                await sendBroadcastText(text, null, translation.language || 'german');
            } else {
                console.log('Sending broadcast with buttons');
                await sendBroadcastButtons(text, buttons, null, translation.language || 'german');
            }
        }

        await markSent(reportID);
        return {
            statusCode: 200,
            body: 'ok',
        }
    } catch (e) {
        console.error('Error:', e);
        return {
            statusCode: 500,
            body: JSON.stringify(e, null, 2),
        };
    }
};

export const markSent = async (id) => {
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
