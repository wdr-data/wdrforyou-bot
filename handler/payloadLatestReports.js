import request from 'request-promise-native';
import moment from 'moment-timezone';
import urls from '../lib/urls';
import { listElement, buttonPostback } from '../lib/facebook';
import translations from "../assets/translations";

import { sendReport, translateReport } from "./payloadReport";

export default async function(chat) {
    const url = urls.reports;
    let qs;

    if (chat.language === 'german') {
        qs = {limit: 4};
    } else {
        qs = {limit: 4, [chat.language]: 1};
    }

    const page = await request.get({
        uri: url,
        qs,
        json: true
    });

    if (page.count === 0) {
        return chat.sendText(chat.getTranslation(translations.noReportFound));
    } else if (page.count === 1) {
        return sendReport(chat, page.results[0])
    }

    const elements = [];
    
    for (const report of page.results) {
        if (chat.language === 'german'){
            const reportDate = moment(report.created).tz('Europe/Berlin').format('DD.MM.YYYY')
            const element = listElement(
                `${reportDate} - ${report.text}`,
                null,
                [ buttonPostback(
                    chat.getTranslation(translations.readReport),
                    { action: 'report', report: report.id }
                    )
                ],
            );
            elements.push(element);
        } else {
            const reportDate = moment(report.created).tz('Europe/Berlin').format('DD.MM.YYYY')

            const element = listElement(
                `${reportDate} - ${translateReport(chat, report).text}`,
                report.text,
                [ buttonPostback(
                    chat.getTranslation(translations.readReport),
                    { action: 'report', report: report.id }
                    )
                ],
            );
            elements.push(element);
        }

    }
    return chat.sendList(elements);
}
