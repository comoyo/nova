var Template = require('../template')
    , novaform = require('../../../novaform');

function RedisReplicationGroup(options) {
    if (!(this instanceof RedisReplicationGroup)) {
        return new RedisReplicationGroup(options);
    }

    Template.call(this);

    var name = options.name;
    var description = options.description || name;
    var numCacheClusters = options.numCacheClusters || 0;
    var numNodeGroups = options.numNodeGroups || 0;
    var replicasPerNodeGroup = options.replicasPerNodeGroup || 0;
    var parameterGroup = options.parameterGroup;
    var subnets = options.subnets;
    var vpcId = options.vpcId;
    var vpcCidrBlock = options.vpcCidrBlock;
    var cacheNodeType = options.cacheNodeType;
    var automaticFailover = options.automaticFailover !== false;
    var subnetGroupDescription = options.subnetGroupDescriptiiton || name || 'unnamed subnet group';
    var preferredMaintenanceWindow = options.preferredMaintenanceWindow;

    if (numCacheClusters > 0 && numNodeGroups > 0) {
        throw 'Choose either NumCacheClusters or NumNodeGroups with ReplicasPerNodeGroup';
    }

    function mkname(str) {
        var cased = name.charAt(0).toUpperCase() + name.slice(1);
        return (cased.replace('-','')||'') + str;
    }

    var securityGroup = this._addResource(novaform.ec2.SecurityGroup(mkname('Sg'), {
        VpcId: vpcId,
        GroupDescription: 'RedisReplicationGroup from VPC',
        Tags: {
            Application: novaform.refs.StackId,
            Name: novaform.join('-', [novaform.refs.StackName, mkname('Sg')])
        }
    }));

    this._addResource(novaform.ec2.SecurityGroupIngress(mkname('SgiRedisReplicationGroupTcp'), {
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

    var numberOfNodes = numCacheClusters > 0
        ? { NumCacheClusters: numCacheClusters }
        : { NumNodeGroups: numNodeGroups, ReplicasPerNodeGroup: replicasPerNodeGroup };

    var replicationGroup = this._addResource(novaform.ec.ReplicationGroup(mkname('ReplicationGroup'), Object.assign({
        AutomaticFailoverEnabled: automaticFailover,
        CacheNodeType: cacheNodeType,
        CacheParameterGroupName: parameterGroup,
        CacheSubnetGroupName: subnetGroup,
        Engine: 'redis',
        PreferredMaintenanceWindow: preferredMaintenanceWindow,
        ReplicationGroupDescription: description,
        ReplicationGroupId: name,
        SecurityGroupIds: [securityGroup],
    }, numberOfNodes)));


    this.securityGroup = securityGroup;
    this.replicationGroup = replicationGroup;
}

RedisReplicationGroup.prototype = Object.create(Template.prototype);

module.exports = RedisReplicationGroup;
