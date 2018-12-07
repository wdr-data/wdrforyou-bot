import rp from 'request-promise-native';
import urls from '../lib/urls';


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
    const faqTranslation = getFaq(chat, handle);

    return chat.sendFragments(faqTranslation.fragments);
};

export const handler = async (chat, payload) => sendFaq(chat, payload.handle);
