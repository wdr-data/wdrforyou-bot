request = require('request-promise-native');

const FB_PAGETOKEN = process.env.FB_PAGETOKEN;
const MESSENGER_PROFILE_URL = 'https://graph.facebook.com/v2.12/me/messenger_profile';

const GET_STARTED_PAYLOAD = {
    action: 'faq',
    slug: 'onboarding',
};

const MENU_ACTIONS = [
    {
        title: '🕑 Zeitansage',
        type: 'postback',
        payload: JSON.stringify({ action: 'current_time' }),
    },
    {
        title: '📰 Letzte Meldungen',
        type: 'postback',
        payload: JSON.stringify({ action: 'latest_reports' }),
    },
    {
        title: '🔧 An-/Abmelden',
        type: 'postback',
        payload: JSON.stringify({ action: 'subscriptions' }),
    },
];


const PERSISTENT_MENU_DATA = {
    'persistent_menu':
    [
        {
            locale: 'default',
            'call_to_actions': MENU_ACTIONS,
        },
    ],
};

const GET_STARTED_DATA = {
    'get_started':
  {
      payload: JSON.stringify(GET_STARTED_PAYLOAD),
  },
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
    }).catch((error) => {
        console.log('Setting persistent menu failed: ', error);
    });
}).catch((error) => {
    console.log("Setting 'get started' button failed: ", error);
});

