import translations from './assets/translations';
const request = require('request-promise-native');

const FB_PAGETOKEN = process.env.FB_PAGETOKEN;
const MESSENGER_PROFILE_URL = 'https://graph.facebook.com/v2.12/me/messenger_profile';

const FbLanguageEnum = {
    'arabic': ['ar_AR'],
    'persian': ['fa_IR'],
    'english': ['en_GB', 'en_US'],
    'german': ['default'],
};
const availableFbLanguages = Object.keys(FbLanguageEnum);

const GET_STARTED_PAYLOAD = {
    action: 'subscriptions',
};

const greetings = [];

const makeMenuLanguage = (locale, language) => {
    return {
        locale,
        'call_to_actions': [
            {
                title: translations['share'][language],
                type: 'postback',
                payload: JSON.stringify({ action: 'share' }),
            },
            {
                title: translations['about'][language],
                type: 'nested',
                call_to_actions: [
                    {
                        title: translations['latestReports'][language],
                        type: 'postback',
                        payload: JSON.stringify({ action: 'latest_reports' }),
                    },
                    {
                        title: translations['aboutService'][language],
                        type: 'postback',
                        payload: JSON.stringify({ action: 'faq', handle: 'aboutServiceFull' }),
                    },
                    {
                        title: translations['companyDetails'][language],
                        type: 'postback',
                        payload: JSON.stringify({ action: 'faq', handle: 'companyDetailsFull' }),
                    },
                    {
                        title: translations['subscriptionReturnDataPolicyButton'][language],
                        type: 'postback',
                        payload: JSON.stringify({ action: 'analyticsPolicy' }),
                    }
                ]
            },
            {
                title: translations['settings'][language],
                type: 'nested',
                call_to_actions: [
                    {
                        title: translations['changeLanguage'][language],
                        type: 'postback',
                        payload: JSON.stringify({ action: 'subscriptions' }),
                    },
                    {
                        title: translations['unsubscribe'][language],
                        type: 'postback',
                        payload: JSON.stringify({ action: 'unsubscribe' }),
                    },
                ]
            },
        ]
    };
};

const menu_options = [];
for (const language of availableFbLanguages) {
    for (const locale of FbLanguageEnum[language]) {
        menu_options.push(makeMenuLanguage(locale, language));
        greetings.push({
            locale: locale,
            text: translations.greetings[language],
        });
    }
}

const PERSISTENT_MENU_DATA = {
    'persistent_menu': menu_options,
};

const GET_STARTED_DATA = {
    'get_started': {
        payload: JSON.stringify(GET_STARTED_PAYLOAD),
    },
};

const GREETING_DATA = {
    greeting: greetings,
};


if (FB_PAGETOKEN === undefined) {
    throw new Error("Please set 'FB_PAGETOKEN' environment variable.");
}


request.post({
    uri: MESSENGER_PROFILE_URL,
    qs: {
        'access_token': FB_PAGETOKEN,
    },
    json: true,
    body: GET_STARTED_DATA,
}).then(() => {
    console.log("Successfully set 'get started' button");
    request.post({
        uri: MESSENGER_PROFILE_URL,
        qs: {
            'access_token': FB_PAGETOKEN,
        },
        json: true,
        body: PERSISTENT_MENU_DATA,
    }).then(() => {
        console.log('Successfully set persistent menu');
        request.post({
            uri: MESSENGER_PROFILE_URL,
            qs: {
                'access_token': FB_PAGETOKEN,
            },
            json: true,
            body: GREETING_DATA,
        }).then(() => {
            console.log('Successfully set greetings');
        }).catch((error) => {
            console.log('Setting greetings failed: ', error);
        });
    }).catch((error) => {
        console.log('Setting persistent menu failed: ', error);
    });
}).catch((error) => {
    console.log("Setting 'get started' button failed: ", error);
});

