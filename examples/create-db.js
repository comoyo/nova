var config = require('./config')
    , novastl = require('novastl')
    , novaform = require('novaform');

var vpc = novastl.Vpc({
    cidr: config.vpcCidrBlock,
    publicSubnets: config.publicSubnets,
    privateSubnets: config.privateSubnets
});

var rds = novastl.Rds({
    vpcTemplate: vpc
});

var stack = novaform.Stack('mystack');
stack.add(vpc.resourceGroup);
stack.add(rds.resourceGroup);

console.log(stack.toJson());
