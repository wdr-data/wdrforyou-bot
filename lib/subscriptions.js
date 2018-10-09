import ddb from './dynamodb';

const tableName = process.env.DYNAMODB_SUBSCRIPTIONS;

export function create(psid, item = {}) {
    return new Promise((resolve, reject) => ddb.put({
        TableName: tableName,
        Item: Object.assign(item, { psid }),
        ConditionExpression: 'attribute_not_exists(psid)',
    }, (err) => {
        if (err) {
            return reject(err);
        }
        resolve();
    }));
}

export function load(psid) {
    return new Promise((resolve, reject) => ddb.get({
        TableName: tableName,
        Key: {
            psid: psid,
        },
        ProjectionExpression: '',
    }, (err, res) => {
        if (err) {
            return reject(err);
        }

        resolve(res.Attributes);
    }));
}

export function update(psid, language) {
    return new Promise((resolve, reject) => ddb.update({
        TableName: tableName,
        Key: {
            psid: psid,
        },
        UpdateExpression: 'SET language = :language',
        ExpressionAttributeValues: {
            ':language': language,
        },
        ReturnValues: 'ALL_NEW',
    }, (err, res) => {
        if (err) {
            return reject(err);
        }
        resolve(res.Attributes);
    }));
}

export function remove(psid) {
    return new Promise((resolve, reject) => ddb.delete({
        TableName: tableName,
        Key: {
            psid: psid,
        },
    }, (err) => {
        if (err) {
            return reject(err);
        }
        resolve();
    }));
}

export default {
    create,
    load,
    update,
    remove,
};
