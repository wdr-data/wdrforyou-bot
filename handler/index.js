export default {
    payloads: {
        'current_time': require('./actionCurrentTime').default,
        'latest_reports': require('./payloadLatestReports').default,
        'report': require('./payloadReport').handler,
        'subscriptionList': require('./payloadSubscribe').subscriptionList,
        'subscribe': require('./payloadSubscribe').subscribe,
    },
};
