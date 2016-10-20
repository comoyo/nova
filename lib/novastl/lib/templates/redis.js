var Template = require('../template')
    , novaform = require('../../../novaform');

function Redis(options) {
    if (!(this instanceof Redis)) {
        return new Redis(options);
    }

    Template.call(this);

    var name = options.name;
    var parameterGroup = options.parameterGroup;
    var subnets = options.subnets;
    var preferredAvailabilityZone = options.preferredAvailabilityZone;
    var vpcId = options.vpcId;
    var vpcCidrBlock = options.vpcCidrBlock;
    var cacheNodeType = options.cacheNodeType;
    var subnetGroupDescription = options.subnetGroupDescription || name || 'unnamed subnet group';
    var numCacheNodes = options.numCacheNodes || 1;
    var preferredMaintenanceWindow = options.preferredMaintenanceWindow;

    function mkname(str) {
        var cased = name.charAt(0).toUpperCase() + name.slice(1);
        return (cased.replace('-','')||'') + str;
    }

    var securityGroup = this._addResource(novaform.ec2.SecurityGroup(mkname('Sg'), {
        VpcId: vpcId,
        GroupDescription: 'Redis from VPC',
        Tags: {
            Application: novaform.refs.StackId,
            Name: novaform.join('-', [novaform.refs.StackName, mkname('Sg')])
        }
    }));

    this._addResource(novaform.ec2.SecurityGroupIngress(mkname('SgiRedisTcp'), {
        GroupId: securityGroup,
        IpProtocol: 'tcp',
        FromPort: 6379,
        ToPort: 6379,
        CidrIp: vpcCidrBlock,
    }));

    this._addResource(novaform.ec2.SecurityGroupEgress(mkname('SgeAllTraffic'), {
        GroupId: securityGroup,
        IpProtocol: -1,
        FromPort: -1,
        ToPort: -1,
        CidrIp: '0.0.0.0/0',
    }));

    var subnetGroup = this._addResource(novaform.ec.SubnetGroup(mkname('SubnetGroup'), {
        Description: subnetGroupDescription,
        SubnetIds: subnets,
    }));

    var cacheCluster = this._addResource(novaform.ec.CacheCluster(mkname('Cluster'), {
        CacheNodeType: cacheNodeType,
        CacheSubnetGroupName: subnetGroup,
        CacheParameterGroupName: parameterGroup,
        ClusterName: name,
        Engine: 'redis',
        NumCacheNodes: numCacheNodes,
        PreferredAvailabilityZone: preferredAvailabilityZone,
        PreferredMaintenanceWindow: preferredMaintenanceWindow,
        VpcSecurityGroupIds: [ securityGroup ],
    }));


    this.securityGroup = securityGroup;
    this.cacheCluster = cacheCluster;
}

Redis.prototype = Object.create(Template.prototype);

module.exports = Redis;
