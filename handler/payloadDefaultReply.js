import {Chat, buttonPostback} from '../lib/facebook';
import translations from "../assets/translations";
import {getFaq} from "../handler/payloadFAQ";


export const contact = async function(chat) {
    if (chat.trackingEnabled) {
        await chat.track.event('Menu', 'QuestionForContact', chat.language).send();
    }
    return defaultReply(chat);
};


export const defaultReply = async function(chat) {
    const defaultReply = await getFaq(chat, 'defaultReply');

    const buttons = [
        buttonPostback(
            chat.getTranslation(translations.defaultSpeakToYesButton),
            {action: 'faq', handle: 'defaultSpeakToYes'},
        ),
        buttonPostback(
            chat.getTranslation(translations.defaultSpeakToNoButton),
            {action: 'faq', handle: 'defaultSpeakToNo'},
        ),
    ];

    if (!chat.subscribed) {
        buttons.push(buttonPostback(
            chat.getTranslation(translations.defaultNotSubscribedButton),
            {action: 'subscriptions'},
        ))
    }
    return chat.sendFragmentsWithButtons(defaultReply.fragments, buttons);
}
