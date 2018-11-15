import { Chat, sendBroadcastButtons, guessAttachmentType } from '../lib/facebook';
import { getAttachmentId } from '../lib/facebookAttachments';
import handler from '../handler';


export const verify = async (event, context) => {
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
};

export const message = async (event, context) => {
    try {
        await messageHandler(event, context);
    } catch (e) {
        console.error('Error:', e);
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
        await chat.loadLanguage();

        return handleMessage(event, context, chat, msgEvent);
    } catch (error) {
        try {
            if (chat) {
                return chat.sendText('Da ist was schief gelaufen.');
            }
        } catch (e) {
            console.error('Reporting error to user failed:', e);
        }
        throw error;
    }
};

const handleMessage = async (event, context, chat) => {
    const msgEvent = chat.event;

    let replyPayload;
    if (msgEvent.postback) {
        replyPayload = JSON.parse(msgEvent.postback.payload);
    }

    if ('message' in msgEvent && 'quick_reply' in msgEvent.message) {
        try {
            replyPayload = JSON.parse(msgEvent.message.quick_reply.payload);
        } catch (e) {
            console.error('Parsing of quick reply payload failed:',
                msgEvent.message.quick_reply.payload);
            replyPayload = null;
        }
    }

    if (replyPayload) {
        if (replyPayload.action in handler.payloads) {
            return handler.payloads[replyPayload.action](chat, replyPayload);
        }
        return chat.sendText(`Da ist was schief gelaufen.`);
    }

    if ('text' in msgEvent.message) {
        await chat.track.event('Testing', 'Standard-Antwort').send();
        return chat.sendText(`Standard-Antwort was los?`);
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'image'
    ) {
        if ('sticker_id' in msgEvent.message && msgEvent.message.sticker_id === 369239263222822) {
            await chat.track.event('Testing', 'Like-Button').send();
            return chat.sendText(`👌`);
        } else {
            return chat.sendText(`Sorry, hab meine Brille nicht auf`);
        }
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'audio'
    ) {
        return chat.sendText(`Das kann ich leider nicht anhören`);
    }
};

export const attachment = async (event, context) => {
    const payload = JSON.parse(event.body);
    const url = payload.url;

    try {
        const id = await getAttachmentId(url, guessAttachmentType(url));
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: id }),
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: e.message }),
        };
    }
};
