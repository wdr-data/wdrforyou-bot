import { genericElement, buttonUrl } from '../lib/facebook';

export const linkWdrForYou = async function (chat) {
    const element = genericElement(
        'Facebook WDRforyou',
        null,
        'https://scontent-ber1-1.xx.fbcdn.net/v/t1.0-9/12592485_830120313764025_6677887399999214391_n.png?_nc_cat=1&_nc_ht=scontent-ber1-1.xx&oh=b534e82d9e46d52619fd64961feb5b6b&oe=5C774115',
        [ buttonUrl('WDRforyou', 'https://www.facebook.com/WDRforyou/', 'full') ],
    );

    return chat.sendTemplate(
        [element],
    );
};
