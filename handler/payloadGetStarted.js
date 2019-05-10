import { subscriptionList } from './payloadSubscribe';

export const handler = async (chat) => {
    return subscriptionList(chat);
};

export default handler;
