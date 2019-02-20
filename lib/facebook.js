import crypto from 'crypto';
import rp from 'request-promise-native';
import path from 'path';
import { getAttachmentId } from './facebookAttachments';
import DynamoDbCrud from './dynamodbCrud';
import ua from 'universal-analytics'
import { SSL_OP_CISCO_ANYCONNECT } from 'constants';

export class Chat {
    constructor(event) {
        this.psid = event.sender.id;
        this.event = event;
        this.language = undefined;
        this.subscribed = undefined;
        this.label = undefined;

        this.track = undefined;
        this.trackingEnabled = undefined;
    }

    async loadSettings() {
        try {
            const subscriptions = new DynamoDbCrud(process.env.DYNAMODB_SUBSCRIPTIONS);
            const sub = await subscriptions.load(this.psid);
            this.language = sub.language;
            this.label = sub.label || sub.language;
            this.subscribed = true;
        } catch {
            this.subscribed = false;
            let locale;
            try {
                const profileUrl = `https://graph.facebook.com/${this.psid}`;
                locale = (await rp.get({
                    uri: profileUrl,
                    json: true,
                    qs: {
                        fields: 'locale',
                        access_token: process.env.FB_PAGETOKEN,
                    },
                })).locale;
            } catch {
                locale = 'de_DE';
            }
            if (!locale) {
                locale = 'de_DE';
            }

            switch (locale.slice(0, 2)) {
                case 'de':
                    this.language = 'german';
                    break;
                case 'en':
                    this.language = 'english';
                    break;
                case 'ar':
                    this.language = 'arabic';
                    break;
                case 'fa':
                    this.language = 'persian';
                    break;
                default:
                    this.language = 'german';
            }
        }

        try {
            const tracking = new DynamoDbCrud(process.env.DYNAMODB_TRACKING);
            this.trackingEnabled = (await tracking.load(this.psid)).enabled;

            if (this.trackingEnabled) {
                let uaid = this.psid;

                for (let i = 0; i < 10000; i++) {
                    const hash = crypto.createHash('SHA256');
                    hash.update(uaid);
                    uaid = hash.digest('hex')
                }

                this.track = ua(process.env.UA_TRACKING_ID, uaid, {strictCidFormat: false});
            }
        } catch {
            console.log('User has not chosen tracking preferences yet.');
        }
    }

    getTranslation(translation) {
        if (!this.language) {
            return Object.values(translation).join('\n\n');
        }
        return translation[this.language];
    }


    async send(payload) {
        payload.recipient = { id: this.psid };
        payload['messaging_type'] = 'RESPONSE';

        return rp.post({
            uri: 'https://graph.facebook.com/v3.2/me/messages',
            json: true,
            qs: {
                'access_token': process.env.FB_PAGETOKEN,
            },
            body: payload,
        });
    }

    async sendText(text, quickReplies = null) {
        const message = { text: text };
        if (quickReplies !== null && quickReplies.length > 0) {
            message['quick_replies'] = quickReplies;
        }

        const payload = {
            message: message,
        };

        return this.send(payload);
    }

    async sendButtons(text, buttons, quickReplies = null) {
        const message = {
            attachment: {
                type: 'template',
                payload: {
                    'template_type': 'button',
                    text: text,
                    buttons: buttons,
                },
            },
        };
        if (quickReplies !== null && quickReplies.length > 0) {
            message['quick_replies'] = quickReplies;
        }

        const payload = {
            message: message,
        };

        return this.send(payload);
    }

    async sendFragments(fragments, quickReplies = null) {
        const head = fragments.slice(0, -1);
        const tail = fragments.slice(-1)[0];

        for (const fragment of head) {
            if (fragment.media) {
                await this.sendAttachment(fragment.media);
            }
            await this.sendText(fragment.text);
        }

        if (tail.media) {
            await this.sendAttachment(tail.media);
        }
        return this.sendText(tail.text, quickReplies);
    }

    async sendFragmentsWithButtons(fragments, buttons, quickReplies = null) {
        const head = fragments.slice(0, -1);
        const tail = fragments.slice(-1)[0];

        for (const fragment of head) {
            if (fragment.media) {
                await this.sendAttachment(fragment.media);
            }
            await this.sendText(fragment.text);
        }

        if (tail.media) {
            await this.sendAttachment(tail.media);
        }
        return this.sendButtons(tail.text, buttons, quickReplies);
    }

    async sendList(elements, button = null, topElementStyle='compact') {
        const payload = {
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        'template_type': 'list',
                        'top_element_style': topElementStyle,
                        elements: elements,
                    },
                },
            },
        };

        if (button !== null) {
            payload.message.attachment.payload.buttons = [ button ];
        }

        return this.send(payload);
    }

    async sendTemplate(elements, templateType = 'generic') {
        const payload = {
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        'template_type': templateType,
                        elements: elements,
                    },
                },
            },
        };

        return this.send(payload);
    }

    async sendAttachment(url, type = null) {
        if (type === null) {
            type = guessAttachmentType(url);
        }

        const attachmentId = await getAttachmentId(url, type);
        console.log(`received ${attachmentId} from getAttachmentId`);

        return this.send({
            message: {
                attachment: {
                    type: type,
                    payload: {
                        'attachment_id': attachmentId,
                    },
                },
            },
        });
    }

    async sendMediaTemplate(attachment, buttons, type = null, sharable = true) {
        if (type === null) {
            type = guessAttachmentType(url);
        }

        const attachmentId = await getAttachmentId(url, type);
        console.log(`received ${attachmentId} from getAttachmentId`);

        return this.send({
            message: {
                attachment: {
                    type: 'template',
                        payload: {
                        template_type: 'media',
                            sharable,
                            elements: [
                            {
                                media_type: type,
                                attachment_id: attachmentId,
                                buttons,
                            }
                        ]
                    }
                }
            }
        });
    }

    async addLabel(label) {
        const labelId = await getLabelId(label);

        try {
            const result = await rp.post({
                uri: `https://graph.facebook.com/v3.2/${labelId}/label`,
                json: true,
                qs: {
                    'access_token': process.env.FB_PAGETOKEN,
                },
                body: {
                    user: this.psid,
                },
            });
            console.log(`Labeled ${this.psid} with ${label}`);
            return result;
        } catch (e) {
            console.log('Labeling user failed: ' + e.message);
            throw e;
        }
    }

    async removeLabel(label) {
        const labelId = await getLabelId(label);

        try {
            const result = await rp.delete(
                {
                    uri: `https://graph.facebook.com/v3.2/${labelId}/label`,
                    json: true,
                    qs: {
                        'access_token': process.env.FB_PAGETOKEN,
                    },
                    body: {
                        user: this.psid,
                    },
                });

            console.log(`Removed label ${label} from ${this.psid}`);
            return result;
        } catch (e) {
            console.log('Removing label from user failed: ' + e.message);
            throw e;
        }
    }
}

export function quickReply(title, payload, imageUrl = null) {
    if (typeof payload !== 'string') {
        payload = JSON.stringify(payload);
    }

    const payload_ = {
        'content_type': 'text',
        title: title,
        payload: payload,
    };

    if (imageUrl !== null && imageUrl.length > 0) {
        payload_['image_url'] = imageUrl;
    }

    return payload_;
}

export function buttonPostback(title, payload) {
    if (typeof payload !== 'string') {
        payload = JSON.stringify(payload);
    }

    const payload_ = {
        type: 'postback',
        title: title,
        payload: payload,
    };

    return payload_;
}

export function buttonShare(genericElement = null) {
    const payload = {
        type: 'element_share',
    };

    if (genericElement !== null) {
        payload['share_contents'] = {
            attachment: {
                type: 'template',
                payload: {
                    'template_type': 'generic',
                    elements: genericElement,
                },
            },
        };
    }

    return payload;
}

export function buttonUrl(title, url, webviewHeightRatio = 'full') {
    const payload = {
        type: 'web_url',
        url: url,
        title: title,
        webview_height_ratio: webviewHeightRatio,
    };

    return payload;
}

export function listElement(
    title, subtitle = null, buttons = null, imageUrl = null
) {
    const payload = {
        title: title,
    };

    if (subtitle !== null && subtitle.length > 0) {
        payload.subtitle = subtitle;
    }

    if (imageUrl !== null && imageUrl.length > 0) {
        payload['image_url'] = imageUrl;
    }

    if (buttons !== null) {
        if (!Array.isArray(buttons)) {
            buttons = [ buttons ];
        }
        if (buttons.length > 0) {
            payload.buttons = buttons;
        }
    }

    return payload;
}

export function genericElement(
    title, subtitle = null, imageUrl = null, buttons = null
) {
    const payload = {
        title: title,
    };

    if (subtitle !== null && subtitle.length > 0) {
        payload.subtitle = subtitle;
    }

    if (imageUrl !== null && imageUrl.length > 0) {
        payload['image_url'] = imageUrl;
    }

    if (buttons !== null && buttons.length > 0) {
        payload.buttons = buttons;
    }

    return payload;
}

export function guessAttachmentType(filename) {
    // Guesses the attachment type from the file extension
    const ext = path.extname(filename).toLowerCase();
    const types = {
        '.jpg': 'image',
        '.jpeg': 'image',
        '.png': 'image',
        '.gif': 'image',
        '.mp4': 'video',
        '.mov': 'video',
        '.mp3': 'audio',
        '.m4a': 'audio',
    };

    return types[ext] || null;
}

// Broadcast API
async function createAndSendBroadcast(payload, label = null) {
    console.log('Creating Broadcast...');
    try {
        const response = await rp.post(
            {
                uri: 'https://graph.facebook.com/v3.2/me/message_creatives',
                json: true,
                qs: {
                    'access_token': process.env.FB_PAGETOKEN,
                },
                body: payload,
            });

        const messageCreativeId = response.message_creative_id;

        const sendBroadcast = async function(labelId) {
            const payload = {
                'message_creative_id': messageCreativeId,
                'messaging_type': 'MESSAGE_TAG',
                tag: 'NON_PROMOTIONAL_SUBSCRIPTION',
            };

            if (labelId !== null) {
                payload['custom_label_id'] = labelId;
            }

            try {
                console.log('Sending Broadcast with payload:', payload);

                const body = await rp.post({
                    uri: 'https://graph.facebook.com/v3.2/me/broadcast_messages',
                    json: true,
                    qs: {
                        'access_token': process.env.FB_PAGETOKEN,
                    },
                    body: payload,
                });

                console.log('Sent broadcast with response body:', body);
                return body;
            } catch (e) {
                throw Error('Error sending broadcast: ' + e.message);
            }
        };

        if (label !== null && label.length > 0) {
            const labelId = await getLabelId(label);
            return sendBroadcast(labelId);
        } else {
            return sendBroadcast(null);
        }
    } catch (e) {
        throw Error('Error creating broadcast: ' + e.message);
    }
}

async function getLabelId(name) {
    // Returns a promise that passes the label ID to the `then`
    // Creates the label if it doesn't exist

    try {
        const resolveLabelResponse = await rp.get({
            uri: 'https://graph.facebook.com/v3.2/me/custom_labels',
            json: true,
            qs: {
                fields: 'name',
                'access_token': process.env.FB_PAGETOKEN,
            },
        });
        for (const elem of resolveLabelResponse.data) {
            if (elem.name === name) {
                console.log(`Resolved label ${name} to ${elem.id}`);
                return elem.id;
            }
        }

        // Still here - label does not exist yet
        try {
            const createLabelResponse = await rp.post({
                uri: 'https://graph.facebook.com/v3.2/me/custom_labels',
                json: true,
                body: {
                    name: name,
                },
                qs: {
                    'access_token': process.env.FB_PAGETOKEN,
                },
            });
            const labelId = createLabelResponse.id;
            console.log(`Resolved label ${name} to ${labelId}`);
            return labelId;
        } catch (e) {
            throw Error('Error creating unknown label: ' + e.message);
        }
    } catch (e) {
        throw Error('Error loading list of labels: ' + e.message);
    }
}

export function sendBroadcastText(text, quickReplies = null, label = null) {
    const message = { text: text };

    if (quickReplies !== null && quickReplies.length > 0) {
        message['quick_replies'] = quickReplies;
    }

    const payload = {
        messages: [ message ],
    };

    return createAndSendBroadcast(payload, label);
}

export function sendBroadcastButtons(text, buttons, quickReplies = null, label = null) {
    const message = {
        attachment: {
            type: 'template',
            payload: {
                'template_type': 'button',
                text: text,
                buttons: buttons,
                sharable: true,
            },
        },
    };
    if (quickReplies !== null && quickReplies.length > 0) {
        message['quick_replies'] = quickReplies;
    }
    const payload = {
        messages: [ message ],
    };

    return createAndSendBroadcast(payload, label);
}

export function sendBroadcastMediaTemplate(attachmentType, attachment, buttons = null, sharable = false) {
    const message = {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'media',
                sharable: sharable,
                elements: [
                    {
                        media_type: attachmentType,
                        attachment_id: attachment,
                        buttons: buttons,
                    }
                ]
            }
        }
    };
    const payload = {
        messages: [ message ],
    };

    return createAndSendBroadcast(payload);
}
