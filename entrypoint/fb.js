const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");

import { Chat, guessAttachmentType } from '../lib/facebook';
import { getAttachmentId } from '../lib/facebookAttachments';
import handler from '../handler';
import DynamoDbCrud from '../lib/dynamodbCrud';
import translate from '../lib/translate';
import lex from '../lib/lex';
import translations from '../assets/translations';
import { unsubscribe } from '../handler/payloadSubscribe';
import subscriptionHelp from '../handler/payloadSubscriptionHelp';


export const verify = RavenLambdaWrapper.handler(Raven, async (event, context) => {
    const params = event.queryStringParameters || {};

    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];
    const mode = params['hub.mode'];

    if (mode && token && challenge &&
      mode === 'subscribe' &&
      token === process.env.FB_VERIFYTOKEN
    ) {
        return {
            statusCode: 200,
            body: challenge,
        };
    }

    return {
        statusCode: 400,
        body: 'Parameter missing',
    };
});

export const message = async (event, context) => {
    try {
        await messageHandler(event, context);
    } catch (e) {
        console.error(e);
        Raven.captureException(e);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'OK',
            input: event,
        }),
    };
};

const messageHandler = async (event, context) => {
    let chat = null;
    try {
        const payload = JSON.parse(event.body);

        console.log(JSON.stringify(payload, null, 2));

        const msgEvent = payload.entry[0].messaging[0];
        chat = new Chat(msgEvent);
        await chat.loadSettings();

        await handleMessage(event, context, chat, msgEvent);
    } catch (error) {
        try {
            if (chat) {
                await chat.sendText(chat.getTranslation(translations.errorMessage));
            }
        } catch (e) {
            console.error('Reporting error to user failed:', e);
        }
        throw error;
    }
};

const isConversationOngoing = async (chat) => {
    const lastDefaultReplies = new DynamoDbCrud(process.env.DYNAMODB_LASTDEFAULTREPLIES);

    try {
        const lastReply = await lastDefaultReplies.load(chat.psid);
        return lastReply.ttl > Math.floor(Date.now() / 1000);
    } catch {
        // (Most likely) Messenger Lite User
        return !chat.subscribed && chat.trackingEnabled === undefined;
    }
}

const handleMediaMessage = async (chat) => {
    const ongoingConversation = await isConversationOngoing(chat);

    if (ongoingConversation) {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'Ongoing', chat.language).send();
        }
        return chat.sendText(chat.getTranslation(translations.defaultReplyTrigger));
    }

    if (chat.trackingEnabled) {
        await chat.track.event('Conversation', 'QuestionForContact', chat.language).send();
    }
    return handler.payloads['defaultReply'](chat);
}

const handleTextMessage = async (chat) => {
    const ongoingConversation = await isConversationOngoing(chat);

    if (ongoingConversation) {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'Ongoing', chat.language).send();
        }
        return chat.sendText(chat.getTranslation(translations.defaultReplyTrigger));
    }

    const text = chat.event.message.text;

    if (text.length > 30) {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'QuestionForContact', chat.language).send();
        }
        return handler.payloads['defaultReply'](chat);
    }

    // translation for text < 30 characters
    if (chat.trackingEnabled) {
        await chat.track.event('Conversation-ShortMessage', 'ShortMessage', chat.language).send();
    }
    let translateResponse;
    try {
        translateResponse = (await translate.translateText({
            "Text": text,
            "SourceLanguageCode": "auto",
            "TargetLanguageCode": "en"
        }).promise()).TranslatedText;
    } catch {
        translateResponse = text;
    }
    // dialogflow
    const lexParams = {
        botAlias: process.env.LEX_BOT_ALIAS,
        botName: process.env.LEX_BOT_NAME,
        inputText: translateResponse,
        userId: chat.hashedId,
    };

    const lexResponse = await lex.postText(lexParams).promise();
    console.log(lexResponse);
    // reply to default
    if (lexResponse.intentName === null) {
        switch (lexResponse.message) {
            case '#defaultReply':
                if (chat.trackingEnabled) {
                    await chat.track.event('Conversation-ShortMessage', 'QuestionForContact', chat.language).send();
                }
                return handler.payloads['defaultReply'](chat);
            case '#ongoingConversation':
                if (chat.trackingEnabled) {
                    await chat.track.event('Conversation-ShortMessage', 'RepeatedlyIgnored', chat.language).send();
                }
                return chat.sendText(chat.getTranslation(translations.defaultReplyTrigger));
        }
    }

    // React to intent
    switch (lexResponse.intentName) {
        case 'stop':
            if (chat.trackingEnabled) {
                await chat.track.event('Conversation-ShortMessage', 'Unsubscribe', chat.language).send();
            }
            return unsubscribe(chat);
        case 'help':
            if (chat.trackingEnabled) {
                await chat.track.event('Conversation-ShortMessage', 'SubscriptionHelpVideo', chat.language).send();
            }
            return subscriptionHelp(chat);
    }

    if (chat.trackingEnabled) {
        await chat.track.event('Conversation-ShortMessage', lexResponse.intentName, chat.language).send();
    }

    let textReply;
    if (lexResponse.message === null) {
        return;
    } else {
        switch (lexResponse.messageFormat) {
            case 'Composite':
                const groups = JSON.parse(lexResponse.message);
                textReply = groups.messages[Math.floor(Math.random() * groups.messages.length)].value;
                break;
            case 'PlainText':
            case 'CustomPayload':
                textReply = lexResponse.message;
        }
        return chat.sendText(textReply);
    }


};

const handleMessage = async (event, context, chat) => {
    const msgEvent = chat.event;

    let replyPayload;
    if (msgEvent.postback) {
        replyPayload = JSON.parse(msgEvent.postback.payload);
    }

    if ('message' in msgEvent && 'quick_reply' in msgEvent.message) {
        replyPayload = JSON.parse(msgEvent.message.quick_reply.payload);
    }

    if (replyPayload) {
        if (replyPayload.action in handler.payloads) {
            return handler.payloads[replyPayload.action](chat, replyPayload);
        }
        return chat.sendText(chat.getTranslation(translations.errorMessage));
    }

    if ('text' in msgEvent.message) {
        switch (msgEvent.message.text) {
            case '#psid':
                return chat.sendText(`${chat.psid}`);
            case '#resettimer':
                const lastDefaultReplies = new DynamoDbCrud(process.env.DYNAMODB_LASTDEFAULTREPLIES);
                return lastDefaultReplies.remove(chat.psid);
        }

        await handleTextMessage(chat);
        if ('attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'fallback') {
            if (!chat.subscribed && chat.trackingEnabled === undefined) {
                return handler.payloads['get_started'](chat);
            }
        }
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'image'
    ) {
        if ('sticker_id' in msgEvent.message && msgEvent.message.sticker_id === 369239263222822) {
            if (chat.trackingEnabled) {
                await chat.track.event('Conversation', 'Like-Button', chat.language).send();
            }
            return chat.sendText(`👌`);
        } else {
            if (chat.trackingEnabled) {
                await chat.track.event('Conversation', 'Image', chat.language).send();
            }
            return handleMediaMessage(chat);
        }
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'audio' ||
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'video'
    ) {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'Audio/Video', chat.language).send();
        }
        return handleMediaMessage(chat);
    }
};

export const attachment = RavenLambdaWrapper.handler(Raven, async (event, context) => {
    const payload = JSON.parse(event.body);
    const url = payload.url;

    const id = await getAttachmentId(url, guessAttachmentType(url));
    return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: id }),
    };
});
