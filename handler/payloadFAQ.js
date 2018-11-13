export const dataPrivacy = async function(chat) {
    chat.sendText(`Für die Nutzung bei Facebook gelten die Datenschutz-Richtlinien von Facebook. ` +
        `Mein Programmcode hält sich an die Datenschutzbestimmungen des Westdeutschen Rundfunks: ` +
        `https://www1.wdr.de/hilfe/datenschutz102.html \n\n` +
        `Impressum\n` +
        `Redaktion: WDRforyou, Sun-Hie Kunert, Male Stüssel\n` +
        `Umsetzung: Lisa Achenbach, Patricia Ennenbach, Jannes Höke, Christian Jörres\n` +
        `https://www.facebook.com/pg/WDRforyou/about/?ref=page_internal`);
};

export const about = async function(chat) {
    return chat.sendText(`INFOSforyou ist ein Nachrichtenservice von WDRforyou.\n` +
        `Die Redaktion des WDR, die Infos für Flüchtlinge und Interessierte macht. ` +
        `Wenn Du diesen Messengerservice abonnierst, bekommst Du schnell gut recherchierte ` +
        `und verlässliche Nachrichten direkt auf dein Handy.`);
};
