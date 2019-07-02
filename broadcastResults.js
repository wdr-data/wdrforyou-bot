import request from "request-promise-native";

const USAGE = `
Use this script to get statistics on past batched broadcasts.

You need:
- Your FB_PAGETOKEN
- A list of language/broadcastId objects
  In AWS Console: Step Functions > State machines > [choose step function] >
  [choose execution] and choose the "finished" state. The list is located
  at the end of the "Input" section under the "results" key.

[
    {
        language: "german",
        broadcastId: "123456789"
    }, ...
]

Insert this list at the end of this scipt and then call it:

With FB_PAGETOKEN in .env.yml:
yarn broadcast-results

Without:
FB_PAGETOKEN=123XXX yarn broadcast-results

Afterwards, use 'git checkout broadcastResults.js' to reset the file.
`.trim();

const finish = async results => {
    let total = 0;
    for (const result of results) {
        const stats = await request.get({
            uri: `https://graph.facebook.com/v3.2/${
                result.broadcastId
            }/insights/messages_sent`,
            qs: {
                access_token: process.env.FB_PAGETOKEN
            },
            json: true
        });
        const amount = stats.data[0].values[0].value;
        total += amount;

        console.log(`${result.language}: ${amount}`);
    }

    console.log(`Total: ${total}`);
};

const broadcastData = [
    /* Replace this list */
];

if (broadcastData.length === 0) {
    console.log(USAGE);
} else {
    finish(broadcastData);
}
