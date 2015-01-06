var config = require('./config')('eu-central-1')
    , novastl = require('novastl')
    , novaform = require('novaform')
    , _ = require('underscore');

var vpc = novastl.Vpc({
    cidr: config.vpcCidrBlock,
    publicSubnetsPerAz: config.publicSubnetsPerAz,
    privateSubnetsPerAz: config.privateSubnetsPerAz
});

var bastion = novastl.Bastion({
    vpc: vpc,
    allowedSshCidr: '0.0.0.0/0',
    keyName: 'stupid-key-pair',
    imageId: config.genericImageId,
    instanceType: 't2.micro'
});

var nat = novastl.Nat({
    vpc: vpc,
    allowedSshCidr: '0.0.0.0/0',
    keyName: 'stupid-key-pair',
    imageId: config.genericImageId,
    instanceType: 't2.micro'
});

var publicSubnets = _.map(vpc.refs.public, function(az) {
    return az.subnet;
});

var privateSubnets = _.map(vpc.refs.private, function(az) {
    return az.subnet;
});

var ebapp = novastl.EBApp({
    vpc: vpc.refs['vpc'],
    keyName: 'stupid-key-pair',
    bastionSecurityGroup: bastion.refs['sg'],
    natSecurityGroup: nat.refs['sg'],
    publicSubnets: publicSubnets,
    privateSubnets: privateSubnets,
    sourceBundle: {
        S3Bucket: 'aliak-comoyo-example',
        S3Key: 'nodejs-sample.zip'
    },
    dependsOn: nat.refs['asg'].name
});

var stack = novaform.Stack('mystack');
stack.add(vpc.toResourceGroup());
stack.add(bastion.toResourceGroup());
stack.add(nat.toResourceGroup());
stack.add(ebapp.toResourceGroup());

console.log(stack.toJson());