export default {
    report: (id) => `${process.env.CMS_API_URL}v1/reports/${id}/`,
    translation: (id) => `${process.env.CMS_API_URL}v1/translations/${id}/`,
    reports: `${process.env.CMS_API_URL}v1/reports/`,
    faqs: `${process.env.CMS_API_URL}v1/faqs/`,
};
