import { buttonShare, buttonUrl, genericElement } from '../lib/facebook';
import translations from "../assets/translations";

export default async function(chat) {
    const text = chat.getTranslation(translations.shareBotText);
    const title = chat.getTranslation(translations.shareBotTitle);
    const subtitle = chat.getTranslation(translations.shareBotSubtitle);

    const callToAction = chat.getTranslation(translations.shareBotCallToAction);
    const targetUrl = `https://www.m.me/WDRforyou`;

    const sharedContent = [
        genericElement(
            title,
            subtitle,
            null,
            [ buttonUrl(callToAction, targetUrl) ]),
    ];

    if (chat.trackingEnabled) {
        await chat.track.event('Menu-Direct', 'Sharing', chat.language).send();
    }

    return chat.sendButtons(text, [ buttonShare(sharedContent) ]);
}
