var AWS = require("aws-sdk");

require("dotenv").config();

AWS.config.update({
  region: "us-east-1",
  endpoint: process.env.LOCAL_DYNAMO_DB_ENDPOINT
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName: "Todos",
  KeySchema: [
    { AttributeName: "todoId", KeyType: "HASH" } // Partition key
  ],
  AttributeDefinitions: [{ AttributeName: "todoId", AttributeType: "N" }],
  // streams must be enabled for replicating the table
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: "NEW_AND_OLD_IMAGES"
  },
  BillingMode: "PAY_PER_REQUEST"
};

(async function () {
  await dynamodb.createTable(params).promise();

  console.log("Created table in us-east-1");

  if (!process.env.LOCAL_DYNAMO_DB_ENDPOINT) {
    // only replicate in production
    // dynamodb local doesn't support this operation

    AWS.config.update({ region: "eu-west-2" });

    dynamodb = new AWS.DynamoDB();

    await dynamodb.createTable(params).promise();

    console.log("Created table in eu-west-2");

    const createGlobalTableParams = {
      GlobalTableName: "Todos",
      ReplicationGroup: [
        {
          RegionName: "us-east-1"
        },
        {
          RegionName: "eu-west-2"
        }
      ]
    };

    await dynamodb.createGlobalTable(createGlobalTableParams).promise();
    console.log("Replication completed");
  }
})();
