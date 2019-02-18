export default {
    payloads: {
        'current_time': require('./actionCurrentTime').default,
        'latest_reports': require('./payloadLatestReports').default,
        'report': require('./payloadReport').handler,
        'report_more': require('./payloadReportMore').handler,
        'subscriptions': require('./payloadSubscribe').subscriptionList,
        'subscribe': require('./payloadSubscribe').subscribe,
        'unsubscribe': require('./payloadSubscribe').unsubscribe,
        'share': require('./payloadShare').default,
        'link_WDRforyou': require('./payloadLink').linkWdrForYou,
        'faq': require('./payloadFAQ').handler,
        'analyticsAccept': require('./payloadAnalytics').accept,
        'analyticsDecline': require('./payloadAnalytics').decline,
        'analyticsPolicy': require('./payloadAnalytics').policy,
        'analyticsChoose': require('./payloadAnalytics').choose,
        'defaultReply': require('./payloadDefaultReply').default,
    },
};
