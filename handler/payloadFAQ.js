import rp from 'request-promise-native';
import urls from '../lib/urls';
import DynamoDbCrud from "../lib/dynamodbCrud";


export const getFaq = async function(chat, handle) {
    const faqs = await rp.get({
        uri: urls.faqs,
        qs: {
            handle,
        },
        json: true,
    });

    if (faqs.length === 0) {
        throw new Error(`Could not find FAQ with handle ${handle}`);
    }

    const faqTranslation = faqs[0][chat.language];

    if (!faqTranslation) {
        throw new Error(`Could not find FAQ Translation with handle ${handle} and language ${chat.language}`);
    }

    return faqTranslation;
};

export const sendFaq = async function(chat, handle) {
    const faqTranslation = await getFaq(chat, handle);

    return chat.sendFragments(faqTranslation.fragments);
};

export const handler = async (chat, payload) => {
    const handle = payload.handle;

    if (handle === 'defaultSpeakToYes') {
        // Begin 36 hour
        const lastDefaultReplies = new DynamoDbCrud(process.env.DYNAMODB_LASTDEFAULTREPLIES);
        const ttl = Math.floor(Date.now() / 1000) + 36*60*60;
        try {
            await lastDefaultReplies.create(chat.psid, {ttl});
        } catch {
            await lastDefaultReplies.update(chat.psid, 'ttl', ttl);
        }
    }

    return sendFaq(chat, payload.handle);
};
