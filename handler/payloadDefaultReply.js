import {Chat, buttonPostback} from '../lib/facebook';
import translations from "../assets/translations";
import {getFaq} from "../handler/payloadFAQ";


export default async function(chat, handle) {
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
    if (chat.trackingEnabled) {
        await chat.track.event('Conversation', 'QuestionForContact', chat.language).send();
    }
    return chat.sendFragmentsWithButtons(defaultReply.fragments, buttons);
}
