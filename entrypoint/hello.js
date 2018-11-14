'use strict';

module.exports.hello = async (event, context, callback) => {

    callback({
        statusCode: 200,
        body: JSON.stringify({
            message: `Go Serverless v1.0! Your function executed successfully! ${process.env['TEST']}`,
            input: event,
        }),
    });

    try {
        await (async () => {
            throw new Error("AHHHHH");
        })()
    } catch (e) {
        console.error(e);
    }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
