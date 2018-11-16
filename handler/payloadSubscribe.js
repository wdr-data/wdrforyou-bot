import { buttonPostback, listElement } from '../lib/facebook';
import DynamoDbCrud from '../lib/dynamodbCrud';
import translations from '../assets/translations';

const LanguageEnum = {
    ARABIC: 'arabic',
    PERSIAN: 'persian',
    ENGLISH: 'english',
    GERMAN: 'german',
  };

const getHasLabel = async function(chat) {
    const labels = await chat.getLabels();
    return function(labelName) {
        return labels.indexOf(labelName) !== -1;
    };
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
            console.log(`Enabled subscription ${item} in dynamoDB for ${psid}`);
        } catch (error) {
            console.log('Updating user in dynamoDB failed: ', error);
        }
    }
};

export const subscriptionList = async function(chat) {
    const elements = [];

    elements.push(listElement(
        (chat.language === 'arabic' ? '✔ ' : '') + 'Arabisch - Deutsch',
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
        (chat.language === 'persian' ? '✔ ' : '') + 'Persisch - Deutsch',
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
        (chat.language === 'english' ? '✔ ' : '') + 'Englisch - Deutsch',
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
        (chat.language === 'german' ? '✔ ' : '') + 'Deutsch',
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
    if (chat.language) {
        buttonUnsubscribe = buttonPostback(
            await chat.getTranslation(translations.unsubscribe),
            { action: 'unsubscribe' },
        );
    }

    await chat.sendText(
        Object.values(translations.subscriptionIntro).join('\n')
    );

    return chat.sendList(
        elements,
        buttonUnsubscribe
    );
};

const removeLabels = async function(chat) {
    const currentLabels = await chat.getLabels();
    const availableLanguages = Object.values(LanguageEnum);

    for (const label of currentLabels) {
        if (availableLanguages.includes(label)) {
            await chat.removeLabel(label);
        }
    }
};

export const subscribe = async function(chat, payload) {
    if (chat.language) {
        await chat.track.event('Bot', 'Abmeldung', chat.language).send();
    }
    await removeLabels(chat);

    await chat.track.event('Bot', 'Anmeldung', payload.subscription).send();
    await chat.addLabel(payload.subscription);
    await enableSubscription(chat.event.sender.id, { language: payload.subscription });

    return chat.sendText(translations.subscriptionReturn[payload.subscription]);
};

export const unsubscribe = async function(chat) {
    const libSubscriptions = new DynamoDbCrud(process.env.DYNAMODB_SUBSCRIPTIONS);
    await chat.track.event('Bot', 'Abmeldung', chat.language).send();
    await removeLabels(chat);
    try {
        await libSubscriptions.remove(chat.event.sender.id);
        return chat.sendText('OK');
    } catch {
        return chat.sendText('Keine Anmeldung gefunden.')
    }
};
