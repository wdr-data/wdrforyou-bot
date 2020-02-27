import request from 'request-promise-native';
import * as aws from 'aws-sdk';
import ua from 'universal-analytics'
const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");

import {buttonUrl} from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';
import urls from "../lib/urls";
import {makeMoreButton} from "../handler/payloadReport";
import {markSentReport, markSentTranslation} from "../lib/cms";
import translations from '../assets/translations';
import { Chat } from '../lib/facebook';
import ddb from '../lib/dynamodb';


export const proxy = RavenLambdaWrapper.handler(Raven, async (event) => {
    const params = {
        stateMachineArn: process.env.statemachine_arn,
        input: typeof event === 'string' ? event : JSON.stringify(event),
    };

    const stepfunctions = new aws.StepFunctions();

    await stepfunctions.startExecution(params).promise();
    console.log('started execution of step function');
    return {
        statusCode: 200,
        body: 'OK',
    };
});

export const fetch = RavenLambdaWrapper.handler(Raven, async (event) => {
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

    const translationMap = {};  // Mapping of language to translation

    for (const translation of translationList) {

        if (translation.delivered) {
            continue;
        }
        const language = translation.language || 'german';

        // Map the translation to the language
        translationMap[language] = translation;
    }

    return {
        state: 'nextBatch',
        report,
        translationMap,
        recipients: Object.fromEntries(
            Object.keys(translationMap).map((lang) => [lang, 0])
        ),
    };
});

export function getUsers(languages, start = null, limit = 50) {

    const expressionAttributes = Object.fromEntries(
        languages.map((lang, index) => [`:language${index + 1}`, lang])
    );

    const params = {
        Limit: limit,
        TableName: process.env.DYNAMODB_SUBSCRIPTIONS,
        FilterExpression: `#lang IN (${Object.keys(expressionAttributes).join(', ')})`,
        ExpressionAttributeNames: {
            '#lang': 'language',
        },
        ExpressionAttributeValues: expressionAttributes,
    };

    if (start) {
        params.ExclusiveStartKey = start;
    }
    return new Promise((resolve, reject) => {
        ddb.scan(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve({ users: data.Items, last: data.LastEvaluatedKey });
        });
    });
}

const handlePushFailed = async (chat, error) => {
    console.error(error);

    if (error.error.code === 'ETIMEDOUT') {
        console.error('Request timed out!');
        Raven.captureException(error);
        return;
    } else if (error.statusCode !== 400) {
        console.error('Not a bad request!');
        Raven.captureException(error);
        return;
    }

    // Handle FB error codes
    const resp = error.error.error; // Yes, this is real

    // 551: This person isn't available right now.
    // 100 / 2018001: No matching user found
    if (resp.code === 551 || resp.code === 100 && resp['error_subcode'] === 2018001) {
        if (Math.random() > .9) {
            console.log(`Deleting user ${chat.psid} due to code ${resp.code}`);
            const subscriptions = new DynamoDbCrud(process.env.DYNAMODB_SUBSCRIPTIONS);
            return subscriptions.remove(chat.psid);
        }
    } else {
        console.error(`Unknown error code ${resp.code}!`);
        Raven.captureException(error);
    }
};

export const send = RavenLambdaWrapper.handler(Raven, async (event) => {
    const {report, translationMap, recipients} = event;
    const languages = Object.keys(translationMap);

    const result = await getUsers(languages, event.start);
    const users = result.users;
    const last = result.last;

    await Promise.all(users.map(async (user) => {
        const chat = new Chat({ sender: { id: user.psid } });
        const language = user.language;

        const translation = translationMap[language];

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
            text = `${prefix}${translation.text}\n\nm.me/WDRforyou`;
        } else {
            text = `${prefix}${translation.text}\n\n${report.text}\n\nm.me/WDRforyou`;
        }

        try {
            if (!buttons.length) {
                await chat.sendText(text);
            } else {
                await chat.sendButtons(text, buttons);
            }
            recipients[language]++;
        } catch (e) {
            await handlePushFailed(chat, e);
        }
    }));

    // LastEvaluatedKey is empty, scan is finished
    if (!last) {
        return {
            state: 'finished',
            report,
            translationMap,
            recipients,
        };
    }

    return {
        state: 'nextBatch',
        report,
        translationMap,
        recipients,
        start: last,
    };
});

export const finish = RavenLambdaWrapper.handler(Raven, async (event) => {
    console.log('Sending of push finished:', event);
    await markSentReport(event.report.id);
    for (const key of Object.keys(event.translationMap)) {
        if (key === 'german') {
            continue;
        }
        await markSentTranslation(event.translationMap[key].id);
    }

    const tracker = ua(process.env.UA_TRACKING_ID, 'broadcaster', {strictCidFormat: false});

    for (const [language, amount] of Object.entries(event.recipients)) {
        await tracker.event('Broadcast', event.report.headline, language, amount).send();
    }
});
