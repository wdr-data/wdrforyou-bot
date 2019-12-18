import { listElement, buttonPostback } from '../lib/facebook';
import translations from "../assets/translations";


const menuAbout = async function(chat) {

    const aboutItems = {
        aboutService : { action: 'faq', handle: 'aboutServiceFull' },
        companyDetails : { action: 'faq', handle: 'companyDetailsFull' },
        subscriptionReturnDataPolicyButton : { action: 'analyticsPolicy' },
    };

    let elements = [];
    elements.push(
        listElement(
            translations['shareBotText'][chat.language],
            translations['shareBotText']['german'],
            [
                buttonPostback(
                    translations['share'][chat.language],
                    { action: 'faq', handle: 'share' }
                    )
            ]
        )
    )
    elements.push(
        listElement(
            translations['contactWdrforyou'][chat.language],
            translations['contactWdrforyou']['german'],
            [
                buttonPostback(
                    translations['writeMessage'][chat.language],
                    { action: 'contact' }
                    )
            ]
        )
    )
    for (const item in aboutItems) {
        const button = [ buttonPostback(
            translations[item][chat.language],
            aboutItems[item]
            )];
        elements.push(
            listElement(
                translations[item][chat.language],
                translations[item]['german'],
                button
            )
        )
    }

    if (chat.trackingEnabled) {
        await chat.track.event('Menu-Direct', 'About', chat.language).send();
    }

    return chat.sendGenericList(elements);
}


const menuSettings = async function(chat) {

    const settingItems = {
        subscribe : { action: 'subscriptions' },
        unsubscribe :  { action: 'unsubscribe' },
        changeLanguage : { action: 'subscriptions' },
    };

    let elements = [];
    for (const item in settingItems) {
        const button = [ buttonPostback(
            translations[item][chat.language],
            settingItems[item]
            )];
        elements.push(
            listElement(
                translations[item][chat.language],
                translations[item]['german'],
                button
            )
        )
    }

    if (chat.trackingEnabled) {
        await chat.track.event('Menu-Direct', 'Settings', chat.language).send();
    }

    return chat.sendGenericList(elements);
}


export {
    menuAbout,
    menuSettings,
}
