import { buttonPostback, listElement } from '../lib/facebook';
import libSubscriptions from '../lib/subscriptions';
import translations from '../assets/translations';

const LanguageEnum = {
    ARABIC: 'arabic',
    PERIAN: 'persian',
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
    try {
        await libSubscriptions.create(psid, item);
        console.log(`Created in dynamoDB ${psid} with ${item}`);
    } catch (error) {
        console.log('Creating user in dynamoDB failed: ', error);
        try {
            await libSubscriptions.update(psid, item);
            console.log(`Enabled subscription ${item} in dynamoDB for ${psid}`);
        } catch (error) {
            console.log('Updating user in dynamoDB failed: ', error);
        }
    }
};

export const subscriptionList = async function(chat) {
    const elements = [];

    elements.push(listElement(
        'Arabisch - Deutsch',
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
        'Persisch - Deutsch',
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
        'Englisch - Deutsch',
        'English - German',
        buttonPostback(
            'Sign in',
            {
                action: 'subscribe',
                subscription: 'english',
            }
        ),
        'https://s3.eu-central-1.amazonaws.com/newsforyou-bot-assets-jhoeke/Englisch_E1.png',
    ));

    elements.push(listElement(
        'Deutsch',
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

    await chat.sendText(
        Object.values(translations.subscriptionIntro).join('\n')
    );
    return chat.sendList(elements);
};

export const subscribe = async function(chat, payload) {
    if (Object.values(LanguageEnum).includes(payload.subscription)) {
        await chat.addLabel(payload.subscription);
        await enableSubscription(chat.event.sender.id, { language: payload.subscription });
    }

    return chat.sendText(translations.subscriptionReturn[payload.subscription]);
};
