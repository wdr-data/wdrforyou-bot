import { Chat, sendBroadcastButtons, guessAttachmentType } from '../lib/facebook';
import { getAttachmentId } from '../lib/facebookAttachments';
import handler from '../handler';


export const verify = async (event, context, callback) => {
    const params = event.queryStringParameters || {};

    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];
    const mode = params['hub.mode'];

    if (mode && token && challenge &&
      mode === 'subscribe' &&
      token === process.env.FB_VERIFYTOKEN
    ) {
        callback(null, {
            statusCode: 200,
            body: challenge,
        });
        return;
    }

    callback(null, {
        statusCode: 400,
        body: 'Parameter missing',
    });
};

export const message = async (event, context, callback) => {
    let chat = null;
    try {
        const payload = JSON.parse(event.body);

        callback(null, {
            statusCode: 200,
            body: 'works',
        });

        console.log(JSON.stringify(payload, null, 2));

        const msgEvent = payload.entry[0].messaging[0];
        chat = new Chat(msgEvent);

        return handleMessage(event, context, chat, msgEvent);
    } catch (error) {
        console.error('ERROR:', error);

        try {
            if (chat) {
                return chat.sendText('Da ist was schief gelaufen.');
            }
        } catch (e) {
            console.error('Reporting error to user failed with:', e);
        }
    }
};

const handleMessage = async (event, context, chat, msgEvent) => {
    const psid = msgEvent.sender.id;

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
        return chat.sendText(`Standard-Antwort was los?`);
    } else if (
        'attachments' in msgEvent.message && msgEvent.message.attachments[0].type === 'image'
    ) {
        if ('sticker_id' in msgEvent.message && msgEvent.message.sticker_id === 369239263222822) {
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

export const push = async (event, context, callback) => {
    let timing;
    try {
        timing = getTiming(event);
    } catch (e) {
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: e.message }),
        });
        return;
    }

    try {
        const push = await getLatestPush(timing, { delivered: 0 });
        const { intro, buttons, quickReplies } = assemblePush(push);
        const message = await sendBroadcastButtons(
            intro, buttons, quickReplies, 'push-' + timing
        );
        await markSent(push.id).catch(() => {});
        console.log('Successfully sent push: ', message);
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Successfully sent push: ' + message,
            }),
        });
    } catch (e) {
        console.error('Sending push failed: ', e.message);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: e.message }),
        });
    }
};

export const attachment = async (event, context, callback) => {
    const payload = JSON.parse(event.body);
    const url = payload.url;

    try {
        const id = await getAttachmentId(url, guessAttachmentType(url));
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: id }),
        });
    } catch (e) {
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: e.message }),
        });
    }
};
