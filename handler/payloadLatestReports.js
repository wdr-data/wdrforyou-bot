import request from 'request-promise-native';
import urls from '../lib/urls';
import { listElement, buttonPostback } from '../lib/facebook';

import { sendReport } from "./payloadReport";

export default async function(chat) {
    const url = `${urls.reports}?limit=4`;

    const page = await request({ uri: url, json: true });

    if (page.count === 0) {
        return chat.sendText(`Es gibt noch keine Meldungen.`);
    } else if (page.count === 1) {
        return sendReport(chat, page.results[0])
    } else {
        const elements = [];

        for (const report of page.results) {
            const element = listElement(
                report.headline,
                null,
                [ buttonPostback('📰 Lesen', { report: report.id }) ],
            );
            elements.push(element);
        }

        return chat.sendList(elements);
    }
}
