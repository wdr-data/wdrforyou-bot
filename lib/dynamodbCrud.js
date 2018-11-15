import ddb from './dynamodb';

export default class DynamoDbCrud {
    constructor(tableName) {
        this.tableName = tableName;
    }

    create(psid, item = {}) {
        return new Promise((resolve, reject) => ddb.put({
            TableName: this.tableName,
            Item: Object.assign(item, { psid }),
            ConditionExpression: 'attribute_not_exists(psid)',
        }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        }));
    }
    
    load(psid) {
        return new Promise((resolve, reject) => ddb.get({
            TableName: this.tableName,
            Key: {
                psid: psid,
            },
        }, (err, res) => {
            if (err) {
                return reject(err);
            }
    
            resolve(res.Item);
        }));
    }
    
    update(psid, key, value) {
        return new Promise((resolve, reject) => ddb.update({
            TableName: this.tableName,
            Key: {
                psid: psid,
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
    
    remove(psid) {
        return new Promise((resolve, reject) => ddb.delete({
            TableName: this.tableName,
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
}
