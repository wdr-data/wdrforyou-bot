import rp from 'request-promise-native';
import urls from '../lib/urls';


export const sendFaq = async function(chat, slug) {
    const faqs = await rp.get({
        uri: urls.faqs,
        qs: {
            slug,
        },
        json: true,
    });

    if (faqs.length === 0) {
        throw new Error(`Could not find FAQ with slug ${slug}`);
    }

    const faqTranslation = faqs[0][chat.language];

    if (!faqTranslation) {
        throw new Error(`Could not find FAQ Translation with slug ${slug} and language ${chat.language}`);
    }

    for (const fragment of faqTranslation.fragments) {
        await chat.sendText(fragment.text);
        if (fragment.media) {
            await chat.sendAttachment(fragment.media);
        }
    }
};


export const companyDetails = async (chat) => sendFaq(chat, 'impressum');

export const about = async (chat) => sendFaq(chat, 'uber');
