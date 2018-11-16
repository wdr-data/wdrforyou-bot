import { genericElement, buttonUrl } from '../lib/facebook';

export const linkWdrForYou = async function (chat) {
    const element = genericElement(
        'Facebook WDRforyou',
        null,
        'https://s3.eu-central-1.amazonaws.com/newsforyou-static-staging/Logo-WDRforyou_small-63f7d457-9313-4480-9054-6cbe8d51efca.jpg',
        [ buttonUrl('WDRforyou', 'https://www.facebook.com/WDRforyou/', 'full') ],
    );

    return chat.sendTemplate(
        [element],
    );
};
