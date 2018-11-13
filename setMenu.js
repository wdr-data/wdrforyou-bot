request = require('request-promise-native');

const FB_PAGETOKEN = process.env.FB_PAGETOKEN;
const MESSENGER_PROFILE_URL = 'https://graph.facebook.com/v2.12/me/messenger_profile';

const GET_STARTED_PAYLOAD = {
    action: 'subscriptions',
};

// german menu as default 
const MENU_ACTIONS_DEFAULT = [
    {
        title: 'Teilen',
        type: 'postback',
        payload: JSON.stringify({ action: 'share' }),
    },
    {
        title: 'Sprache ändern',
        type: 'postback',
        payload: JSON.stringify({ action: 'subscriptions' }),
    },
    {
        title: 'Über',
        type: 'nested',
        call_to_actions: [
    {
                title: 'Letzte Meldungen',
        type: 'postback',
        payload: JSON.stringify({ action: 'latest_reports' }),
    },
    {
                title: 'FB-Seite WDRforyou',
                type: 'postback',
                payload: JSON.stringify({ action: 'link_WDRforyou' }),
            },
            {
                title: 'Über den Service',
                type: 'postback',
                payload: JSON.stringify({ action: 'about' }),
            },
            {
                title: 'Datenschutz',
                type: 'postback',
                payload: JSON.stringify({ action: 'data_privacy' }),
            },
            {
                title: 'Abmelden ',
        type: 'postback',
        payload: JSON.stringify({ action: 'subscriptions' }),
    },
        ]
    }
];


const PERSISTENT_MENU_DATA = {
    'persistent_menu':
    [
        {
            locale: 'default',
            'call_to_actions': MENU_ACTIONS_DEFAULT,
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

