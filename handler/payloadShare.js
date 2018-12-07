import { buttonShare, buttonUrl, genericElement } from '../lib/facebook';

export default async function(chat) {
    const text = `Teile den Service INFOSforyou.`;
    const title = `Abboniere INFOSforyou, den Nachrichtenservice von WDRforyou.`;
    const subtitle = `Hier gibt es gut recherchierte, verlässliche Nachrichten direkt auf dein Handy.`;

    const callToAction = `Hier geht’s los`;
    const informantUrl = `https://www.m.me/1785191631726148`;

    const sharedContent = [
        genericElement(
            title,
            subtitle,
            null,
            [ buttonUrl(callToAction, informantUrl) ]),
    ];

    if (chat.trackingEnabled) {
        await chat.track.event('Sharing', 'Share Menu Item').send();
    }

    return chat.sendButtons(text, [ buttonShare(sharedContent) ]);
}
