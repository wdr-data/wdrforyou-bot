const { loadConfig } = require('./util');

const tableProps = {
    'attachments': {
        AttributeDefinitions: [
            {
                AttributeName: 'url',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'url',
                KeyType: 'HASH',
            },
        ],
    },
    'subscriptions': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },
        ],
    },
    'LastDefaultReplies': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },
        ],
        TimeToLiveSpecification: {
            AttributeName: "ttl",
            Enabled: "TRUE",
        },
    },
    'tracking': {
        AttributeDefinitions: [
            {
                AttributeName: 'psid',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'psid',
                KeyType: 'HASH',
            },
        ],
    },
    'labels': {
        AttributeDefinitions: [
            {
                AttributeName: 'language',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'language',
                KeyType: 'HASH',
            },
        ],
    },
};

const tableNames = (stage) => {
    return loadConfig().then((config) => Object.keys(tableProps).reduce((acc, name) => {
        acc[name] = `${config.service}-${stage}-${name}`;
        return acc;
    }, {}));
};

const tableConfig = (stage) => {
    return tableNames(stage).then((tables) => Object.keys(tables).reduce((acc, name) => {
        acc[`DynamodbTable${name}`] = {
            Type: 'AWS::DynamoDB::Table',
            DeletionPolicy: 'Retain',
            Properties: Object.assign({
                TableName: tables[name],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 2,
                    WriteCapacityUnits: 1,
                },
            }, tableProps[name]),
        };
        return acc;
    }, {}));
};

const tableEnv = (stage) => {
    return tableNames(stage).then((tables) => Object.keys(tables).reduce((acc, name) => {
        acc[`DYNAMODB_${name.toUpperCase()}`] = tables[name];
        return acc;
    }, {}));
};

module.exports = {
    tableSpec: tableProps,
    tableNames,
    tableConfig,
    tableEnv,
};
