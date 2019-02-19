import request from 'request-promise-native';
import * as aws from 'aws-sdk';
import ua from 'universal-analytics'

import {buttonUrl, sendBroadcastButtons, sendBroadcastText} from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';
import urls from "../lib/urls";
import {makeMoreButton} from "../handler/payloadReport";
import {markSent} from "./cms";


export const proxy = async (event) => {
    const params = {
        stateMachineArn: process.env.statemachine_arn,
        input: typeof event === 'string' ? event : JSON.stringify(event),
    };

    const stepfunctions = new aws.StepFunctions();
    try {
        await stepfunctions.startExecution(params).promise();
        console.log('started execution of step function');
        return {
            statusCode: 200,
            body: 'OK',
        };
    } catch (e) {
        console.error('err while executing step function');
        console.error(JSON.stringify(e, null, 2));
        return {
            statusCode: 500,
            body: JSON.stringify(e, null, 2),
        };
    }
};

export const fetch = async (event) => {
    console.log(JSON.stringify(event, null, 2));

    let reportID;

    if (event.body) {
        reportID = JSON.parse(event.body).id;
    } else {
        reportID = event.id;
    }

    const report = await request({uri: urls.report(reportID), json: true});

    if (!report) {
        throw new Error(`Report ${reportID} could not be retrieved from API`);
    }

    console.log('Sending report: ' + JSON.stringify(report, null, 2));

    const translationList = [report, ...report.translations];

    const batches = [];  // List of all batches for all languages
    const translations = {};  // Mapping of language to translation

    const labels = new DynamoDbCrud(process.env.DYNAMODB_LABELS);

    for (const translation of translationList) {
        const language = translation.language || 'german';

        // Map the translation to the language
        translations[language] = translation;

        // Make a list of all batches that should be sent
        const label = await labels.load(language, 'language');
        for (let batch = 0; batch <= label.batch; batch++) {
            batches.push({
                language,
                batch,
            });
        }
    }

    return {
        state: 'nextBatch',
        report,
        batches,
        translations,
        results: [],
    };
};

export const send = async (event) => {
    const {report, batches, translations, results} = event;

    const batchInfo = batches.shift();  // Remove and get first batch info

    const {batch, language} = batchInfo;

    const translation = translations[language];
    const label = batch === 0 ? language : `${language}-${batch}`;

    console.log(`Sending report ${JSON.stringify(report, null, 2)} to label ${label}`);

    const moreButton = makeMoreButton(report, language || 'german');
    let linkButton;

    if (translation.link) {
        linkButton = buttonUrl(
            `🔗 ${translations.reportLinkButton[translation.language || 'german']}`,
            translation.link
        );
    }

    const buttons = [moreButton, linkButton].filter(e => !!e);

    const prefix = '+++NEWS+++\n';
    let text;

    if (!translation.language) {
        text = prefix + translation.text;
    } else {
        text = `${prefix}${translation.text}\n\n${report.text}`;
    }

    let result;

    if (!buttons.length) {
        console.log('Sending broadcast without buttons');
        result = await sendBroadcastText(text, null, label);
    } else {
        console.log('Sending broadcast with buttons');
        result = await sendBroadcastButtons(text, buttons, null, label);
    }

    results.push({
        language,
        broadcastId: result.broadcast_id,
    });

    return {
        state: batches.length > 0 ? 'nextBatch' : 'finished',
        report,
        batches,
        translations,
        results,
    }
};


const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

export const finish = async (event) => {
    console.log('Sending of push finished:', event);
    await markSent(event.report.id);

    await snooze(10000);
    const tracker = ua(process.env.UA_TRACKING_ID, 'broadcaster', {strictCidFormat: false});

    for (const result of event.results) {
        const stats = await request.get({
            uri: `https://graph.facebook.com/v3.2/${result.broadcastId}/insights/messages_sent`,
            qs: {
                access_token: process.env.FB_PAGETOKEN,
            },
            json: true,
        });
        const amount = stats.data[0].values[0].value;

        await tracker.event('Broadcast', event.report.headline, result.language, amount).send();
    }
};
