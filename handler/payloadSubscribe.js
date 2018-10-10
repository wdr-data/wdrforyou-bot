import { buttonPostback, listElement } from '../lib/facebook';
import libSubscriptions from '../lib/subscriptions';

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
        'Arabisch - Deutsch',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'arabic',
            }
        )
    ));

    elements.push(listElement(
        'Persisch - Deutsch',
        'Persisch - Deutsch',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'persian',
            }
        )
    ));
    elements.push(listElement(
        'Englisch - Deutsch',
        'Englisch - Deutsch',
        buttonPostback(
            'Anmelden',
            {
                action: 'subscribe',
                subscription: 'english',
            }
        )
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
        )
    ));

    await chat.sendText('Wähle deine Sprache');
    return chat.sendList(elements);
};

export const subscribe = function(chat, payload) {
    if (Object.values(LanguageEnum).includes(payload.subscription)) {
        promises.push(
            chat.addLabel(payload.subscription),
            enableSubscription(chat.event.sender.id, payload.subscription));
    }
    return Promise.all(promises.concat(
        chat.sendText(`Ich schick dir ab jetzt die Nachrichten, auf deiner gewählten Sprache.`)));
};
