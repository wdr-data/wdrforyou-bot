import { genericElement, buttonUrl } from '../lib/facebook';

export const linkWdrForYou = async function (chat) {
    const element = genericElement(
        'Facebook WDRforyou',
        null,
        'https://s3.eu-central-1.amazonaws.com/newsforyou-bot-assets-jhoeke/Deutsch_D1.png',
        [ buttonUrl('WDRforyou', 'https://www.facebook.com/WDRforyou/', 'full') ],
    );

    return chat.sendTemplate(
        [element],
    );
};
