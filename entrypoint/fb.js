const Raven = require("raven");
const RavenLambdaWrapper = require("serverless-sentry-lib");

import { Chat, guessAttachmentType } from '../lib/facebook';
import { getAttachmentId } from '../lib/facebookAttachments';
import handler from '../handler';
import DynamoDbCrud from '../lib/dynamodbCrud';
import translations from '../assets/translations';


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

const sendDefaultReply = async (chat) => {
    const lastDefaultReplies = new DynamoDbCrud(process.env.DYNAMODB_LASTDEFAULTREPLIES);
    let sendReply;

    try {
        const lastReply = await lastDefaultReplies.load(chat.psid);
        sendReply = lastReply.ttl <= Math.floor(Date.now() / 1000);
    } catch {
        sendReply = chat.subscribed || chat.trackingEnabled !== undefined;
    }

    if (sendReply) {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'QuestionForContact', chat.language).send();
        }
        return handler.payloads['defaultReply'](chat)
    } else {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'Ongoing', chat.language).send();
        }
        return chat.sendText(chat.getTranslation(translations.defaultReplyTrigger))
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

        await sendDefaultReply(chat);
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
            return sendDefaultReply(chat);
        }
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'audio' ||
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'video'
    ) {
        if (chat.trackingEnabled) {
            await chat.track.event('Conversation', 'Audio/Video', chat.language).send();
        }
        return sendDefaultReply(chat);
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
