import ddb from './dynamodb';

export default class DynamoDbCrud {
    constructor(tableName) {
        this.tableName = tableName;
    }

    create(id, item = {}, idName = 'psid') {
        return new Promise((resolve, reject) => ddb.put({
            TableName: this.tableName,
            Item: Object.assign(item, { [idName]: id }),
            ConditionExpression: `attribute_not_exists(#idName)`,
            ExpressionAttributeNames: {
                '#idName': idName,
            },
        }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        }));
    }

    load(id, idName = 'psid') {
        return new Promise((resolve, reject) => ddb.get({
            TableName: this.tableName,
            Key: {
                [idName]: id,
            },
        }, (err, res) => {
            if (err) {
                return reject(err);
            }

            resolve(res.Item);
        }));
    }

    update(id, key, value, idName = 'psid') {
        return new Promise((resolve, reject) => ddb.update({
            TableName: this.tableName,
            Key: {
                [idName]: id,
            },
            UpdateExpression: 'SET #key = :value',
            ExpressionAttributeNames: {
                '#key': key,
            },
            ExpressionAttributeValues: {
                ':value': value,
            },
            ReturnValues: 'ALL_NEW',
        }, (err, res) => {
            if (err) {
                return reject(err);
            }
            resolve(res.Attributes);
        }));
    }

    inc(id, key, idName = 'psid') {
        return new Promise((resolve, reject) => ddb.update({
            TableName: this.tableName,
            Key: {
                [idName]: id,
            },
            UpdateExpression: 'SET #key = #key + :value',
            ExpressionAttributeNames: {
                '#key': key,
            },
            ExpressionAttributeValues: {
                ':value': 1,
            },
            ReturnValues: 'ALL_NEW',
        }, (err, res) => {
            if (err) {
                return reject(err);
            }
            resolve(res.Attributes);
        }));
    }

    remove(id, idName = 'psid') {
        return new Promise((resolve, reject) => ddb.delete({
            TableName: this.tableName,
            Key: {
                [idName]: id,
            },
        }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        }));
    }
}
