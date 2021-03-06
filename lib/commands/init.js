 var fs = require('fs')
    , program = require('../program')
    , path = require('path')
    , moment = require('moment')
    , util = require('util')
    , utils = require('../utils')
    , AWS = require('aws-sdk')
    , readline = require('readline')
    , _ = require('lodash');

var S3_BUCKET_MAX_LENGTH = 63;
var DEFAULT_BUCKET_REGION = 'eu-west-1';

function Command(opts) {
    if (!(this instanceof Command)) {
        return new Command(opts);
    }

    this.options = opts.options;

    if (this.options.bucket && !this.options.region) {
        throw new Error('If you specify bucket name you must also specify region');
    }

    this.region = this.options.region || DEFAULT_BUCKET_REGION;
}

Command.options = [
    ['', 'region=ARG', 'Which region to initialize the nova meta bucket in'],
    ['', 'bucket=ARG', 'The name you want to give the nova bucket'],
];
Command.usageText = '[options]';
Command.descriptionText = 'Initialize nova project';

function yesorno(text) {
    return new Promise(function(resolve, reject) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        r1.question(util.format('%s (yes|no)'), (answer) => {
            r1.close();
            if (answer === 'yes') {
                return resolve(true)
            }
            resolve(false);
        });
    });
}

Command.prototype.execute = function() {
    var s3 = new AWS.S3({region: this.options.region })
    var iam = new AWS.IAM();

    var getUser = utils.pbind(iam.getUser, iam);
    return getUser().then((userData) => {
        // arn format => arn:partition:service:region:account-id:resource
        return userData.User.Arn.split(':')[4];
    }).then((userAccountId) => {
        this.region = this.options.region || DEFAULT_BUCKET_REGION;
        if (!this.options.region) {
            console.log('No region specified. Defaulting to ' + DEFAULT_BUCKET_REGION);
        }

        var bucketName = this.options.bucket || util.format('nova-%s-%s', this.region, userAccountId);
        if (!this.options.bucket) {
            console.log('No bucket specified. Defaulting to ' + bucketName)
        }

        if (bucketName.length > S3_BUCKET_MAX_LENGTH) {
            throw new Error('Oops. Nova bucket name too long - ' + S3_BUCKET_MAX_LENGTH + ' characters max');
        }

        if (program.options.verbose) {
            console.log('Creating nova bucket');
        }
        var createBucket = utils.pbind(s3.createBucket, s3, {
            Bucket: bucketName,
            ACL: 'private',
            CreateBucketConfiguration: {
                LocationConstraint: this.region,
            },
        });

        return Promise.all([bucketName, createBucket()]);
    }).then((values) => {
        var bucketName = values[0];
        var bucketData = values[1];

        return program.setBucketForCurrentProfile({
            name: bucketName,
            region: this.region,
            location: bucketData.Location,
        });
    });
}

module.exports = Command;
