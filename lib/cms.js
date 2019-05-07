import request from 'request-promise-native';

import urls from "./urls";

export const markSentReport = async (id) => {
    try {
        const response = await request.patch({
            uri: urls.report(id),
            body: { delivered: true },
            json: true,
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated report ${id} to delivered`, response);
    } catch (e) {
        console.log(`Failed to update report ${id} to delivered`, e.message);
        throw e;
    }
};

export const markSentTranslation = async (id) => {
    try {
        const response = await request.patch({
            uri: urls.translation(id),
            body: { delivered: true },
            json: true,
            headers: { Authorization: 'Token ' + process.env.CMS_API_TOKEN },
        });
        console.log(`Updated translation ${id} to delivered`, response);
    } catch (e) {
        console.log(`Failed to update translation ${id} to delivered`, e.message);
        throw e;
    }
};
