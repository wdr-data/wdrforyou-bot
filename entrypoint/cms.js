import request from 'request-promise-native';
import { sendBroadcastText, sendBroadcastButtons } from "../lib/facebook";
import urls from "../lib/urls";
import { makeMoreButton } from "../handler/payloadReport";


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

    console.log(JSON.stringify(report, null, 2));

    const moreButton = makeMoreButton(report);

    if (!moreButton) {
        // Always send german text to german-subscribers
        await sendBroadcastText(report.text, null, 'german');

        for (const translation of report.translations) {
            await sendBroadcastText(`${translation.text}\n\n${report.text}`, null, translation.language);
        }
        console.log('Sent broadcast without buttons');
    } else {
        // Always send german text to german-subscribers
        await sendBroadcastButtons(report.text, [moreButton], null, 'german');

        for (const translation of report.translations) {
            await sendBroadcastButtons(`${translation.text}\n\n${report.text}`, [moreButton], null, translation.language);
        }
        console.log('Sent broadcast with buttons');
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
