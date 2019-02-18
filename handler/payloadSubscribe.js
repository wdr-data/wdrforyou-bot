import { buttonPostback, listElement } from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';
import translations from '../assets/translations';
import { getFaq } from "./payloadFAQ";

const LanguageEnum = {
    ARABIC: 'arabic',
    PERSIAN: 'persian',
    ENGLISH: 'english',
    GERMAN: 'german',
  };

const enableSubscription = async function(psid, item) {
    const libSubscriptions = new DynamoDbCrud(process.env.DYNAMODB_SUBSCRIPTIONS);
    try {
        await libSubscriptions.create(psid, item);
        console.log(`Created in dynamoDB ${psid} with ${item}`);
    } catch (error) {
        console.log('Creating user in dynamoDB failed: ', error);
        try {
            await libSubscriptions.update(psid, 'language', item.language);
            await libSubscriptions.update(psid, 'label', item.label);
            console.log(`Enabled subscription ${item} in dynamoDB for ${psid}`);
        } catch (error) {
            console.log('Updating user in dynamoDB failed: ', error);
        }
    }
};

export const subscriptionList = async function(chat) {
    const elements = [];

    elements.push(listElement(
        (chat.language === 'arabic' && chat.subscribed ? '✔ ' : '') + 'Arabisch - Deutsch',
        'عربي - ألماني',
        buttonPostback(
            'تسجيل دخول',
            {
                action: 'subscribe',
                subscription: 'arabic',
            }
        ),
        'https://s3.eu-central-1.amazonaws.com/newsforyou-bot-assets-jhoeke/Arabisch_A1.png',
    ));

    elements.push(listElement(
        (chat.language === 'persian' && chat.subscribed ? '✔ ' : '') + 'Persisch - Deutsch',
        'فارسی-آلمانی',
        buttonPostback(
            'ثبت نام',
            {
                action: 'subscribe',
                subscription: 'persian',
            }
        ),
        'https://s3.eu-central-1.amazonaws.com/newsforyou-bot-assets-jhoeke/Persisch_F1.png',
    ));
    elements.push(listElement(
        (chat.language === 'english' && chat.subscribed ? '✔ ' : '') + 'Englisch - Deutsch',
        'English - German',
        buttonPostback(
            'Subscribe',
            {
                action: 'subscribe',
                subscription: 'english',
            }
        ),
        'https://s3.eu-central-1.amazonaws.com/newsforyou-bot-assets-jhoeke/English_E1.png',
    ));

    elements.push(listElement(
        (chat.language === 'german' && chat.subscribed ? '✔ ' : '') + 'Deutsch',
        'Deutsch',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'german',
            }
        ),
        'https://s3.eu-central-1.amazonaws.com/newsforyou-bot-assets-jhoeke/Deutsch_D1.png',
    ));

    let buttonUnsubscribe = null;
    if (chat.subscribed) {
        buttonUnsubscribe = buttonPostback(
            await chat.getTranslation(translations.unsubscribe),
            { action: 'unsubscribe' },
        );
    }

    await chat.sendText(
        Object.values(translations.subscriptionIntro).join('\n')
    );
    if (chat.trackingEnabled) {
        await chat.track.event('Subscription', 'Show options', chat.language).send();
    }

    return chat.sendList(
        elements,
        buttonUnsubscribe
    );
};

const removeLabel = async function(chat) {
    try {
        if (chat.label) {
            await chat.removeLabel(chat.label);
        }
    } catch (e) {
        console.error('Tried to remove label for user without label');
    }
};

const getNewLabel = async function(lang) {
    const labels = new DynamoDbCrud(process.env.DYNAMODB_LABELS);

    let subscriberCount, currentBatch;

    try {
        const label = await labels.load(lang, 'language');
        subscriberCount = label.subscribers;
        currentBatch = label.batch;
    } catch (e) {
        await labels.create(lang, {subscribers: 0, batch: 1}, 'language');
        subscriberCount = 0;
        currentBatch = 1;
    }

    if (subscriberCount < (process.env.BROADCAST_BATCH_SIZE || 4000)) {
        await labels.inc(lang, 'subscribers', 'language');
        return `${lang}-${currentBatch}`;
    } else {
        await labels.update(lang, 'subscribers', 1, 'language');
        await labels.update(lang, 'batch', currentBatch + 1, 'language');
        return `${lang}-${currentBatch + 1}`;
    }
};

export const subscribe = async function(chat, payload) {
    await removeLabel(chat);
    const label = await getNewLabel(chat.language);

    await chat.addLabel(label);
    await enableSubscription(chat.event.sender.id, { language: payload.subscription, label });

    chat.language = payload.subscription;
    chat.label = label;
    const subscriptionReturn = await getFaq(chat, 'subscriptionReturn');

    const buttons = [
        buttonPostback(
            chat.getTranslation(translations.subscriptionReturnAnalyticsYesButton),
            {action: 'analyticsAccept'},
        ),
        buttonPostback(
            chat.getTranslation(translations.subscriptionReturnAnalyticsNoButton),
            {action: 'analyticsDecline'},
        ),
        buttonPostback(
            chat.getTranslation(translations.subscriptionReturnDataPolicyButton),
            {action: 'analyticsPolicy'},
        ),
    ];

    if (chat.trackingEnabled) {
        await chat.track.event('Subscription', 'Subscribe', chat.language).send();
    }

    return chat.sendFragmentsWithButtons(subscriptionReturn.fragments, buttons);
};

export const unsubscribe = async function(chat) {
    const libSubscriptions = new DynamoDbCrud(process.env.DYNAMODB_SUBSCRIPTIONS);

    await removeLabel(chat);

    if (chat.trackingEnabled) {
        await chat.track.event('Subscription', 'Unsubscribe', chat.language).send();
    }

    if (chat.subscribed) {
        await libSubscriptions.remove(chat.event.sender.id);
        return chat.sendButtons(
            chat.getTranslation(translations.unsubscribeMessage),
            [buttonPostback(chat.getTranslation(translations.reSubscribe), {action: 'subscriptions'})]
        );
    } else {
        await chat.sendText(chat.getTranslation(translations.notSubscribed));
    }
};
