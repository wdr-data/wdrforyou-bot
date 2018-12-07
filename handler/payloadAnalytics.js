import {getFaq} from "./payloadFAQ";
import DynamoDbCrud from "../lib/dynamodbCrud";
import translations from "../assets/translations";
import {buttonPostback} from "../lib/facebook";

export async function accept(chat) {
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING);

    try {
        await tracking.create(chat.psid, {enabled: true});
    } catch {
        await tracking.update(chat.psid, 'enabled', true);
    }

    const thanksAnalytics = await getFaq(chat, 'thanksAnalytics');
    return chat.sendFragments(thanksAnalytics.fragments);
}

export async function decline(chat) {
    const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING);

    try {
        await tracking.create(chat.psid, {enabled: false});
    } catch {
        await tracking.update(chat.psid, 'enabled', false);
    }

    const noAnalytics = await getFaq(chat, 'noAnalytics');
    return chat.sendFragments(noAnalytics.fragments);
}

export async function choose(chat) {
    const chooseAnalyics = await getFaq(chat, 'dataPolicy');

    const buttons = [
        buttonPostback(
            chat.getTranslation(translations.subscriptionReturnAnalyticsYesButton),
            {action: 'analyticsAccept'},
            chat.getTranslation(translations.subscriptionReturnAnalyticsNoButton),
            {action: 'analyticsDecline'},
            chat.getTranslation(translations.subscriptionReturnDataPolicyButton),
            {action: 'analyticsPolicy'},
        )
    ];

    return chat.sendFragmentsWithButtons(chooseAnalyics.fragments, buttons);
}

export async function policy(chat) {
    const dataPolicy = await getFaq(chat, 'dataPolicy');
    await chat.sendFragments(dataPolicy.fragments);

    return choose(chat);
}
