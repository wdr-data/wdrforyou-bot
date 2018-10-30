export default {
    payloads: {
        'current_time': require('./actionCurrentTime').default,
        'latest_reports': require('./payloadLatestReports').default,
        'report': require('./payloadReport').handler,
        'report_more': require('./payloadReportMore').handler,
        'subscriptions': require('./payloadSubscribe').subscriptionList,
        'subscribe': require('./payloadSubscribe').subscribe,
        'unsubscribe': require('./payloadSubscribe').unsubscribe,
    },
};
