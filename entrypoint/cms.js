import request from 'request-promise-native';
import { sendBroadcastText } from "../lib/facebook";
import urls from "../lib/urls";


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

    await markSent(reportID);

    const translations = report.translations.map(e => e.text).join('\n\n');

    return sendBroadcastText(`${translations}\n\n${report.text}`);
};



const markSent = async (id) => {
    try {
        const response = await request.patch({
            uri: urls.report(id),
            json: true,
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated report ${id} to delivered`, response);
    } catch (e) {
        console.log(`Failed to update report ${id} to delivered`, e.message);
        throw e;
    }
};
