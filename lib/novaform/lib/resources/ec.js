var AWSResource = require('../awsresource')
    , types = require('../types');

function PreferredAvailabilityZonesValidator(self) {
    if (!self.properties.AZMode) {
        return 'AZMode must be set if PreferredAvailabilityZones is set (notice the \'s\' at the end)';
    }
}

function EngineValidator(self) {
    if (self.type === 'AWS::ElastiCache::ReplicationGroup' && self.properties.Engine !== 'redis') {
        return 'RelicationGroup only supports redis at this point';
    } else if (self.properties.Engine === 'redis' && self.properties.PreferredAvailabilityZones) {
        return 'PreferredAvailabilityZones only supported for memcached';
    }
}

function AZModeValidator(self) {
    if (self.Engine === 'redis') {
        if (self.AZMode) {
            return 'AZMode only supported for memcached';
        }
    }
}

function NumCacheClustersValidator(self) {
    if (self.properties.AutomaticFailoverEnabled && self.properties.NumCacheClusters <= 1) {
        return 'NumCacheClusters must be greater than 1 when automatic failover is enabled';
    }
    if (self.properties.NumCacheClusters <= 0) {
        return 'NumCacheClusters must be a positive number';
    }
}

function AutomaticFailoverValidator(self) {
    var nodeType = self.properties.CacheNodeType.split('.');
    if (nodeType[0] !== 'cache') {
        return 'Unkown CacheNodeType, does not start with "cache"';
    }
    if (self.properties.AutomaticFailoverEnabled && (nodeType[1] === 't1' || nodeType[1] === 't2')) {
        return 'AutomaticFailoverEnabled is not supported for node types "t1" and "t2"';
    }
}

var CacheCluster = AWSResource.define('AWS::ElastiCache::CacheCluster', {
    AutoMinorVersionUpgrade : { type: types.boolean },
    AZMode : { type: types.enum('single-az', 'cross-az'), required: 'conditional', validators: [AZModeValidator] },
    CacheNodeType : { type: types.string, required: true },
    CacheParameterGroupName : { type: types.string },
    CacheSecurityGroupNames : { type: types.array, required: 'conditional' },
    CacheSubnetGroupName : { type: types.string },
    ClusterName : { type: types.string },
    Engine : { type: types.enum('memcached', 'redis'), required: true, validators: [EngineValidator] },
    EngineVersion : { type: types.string },
    NotificationTopicArn : { type: types.string },
    NumCacheNodes : { type: types.number, required: true },
    Port : { type: types.number },
    PreferredAvailabilityZone : { type: types.string },
    PreferredAvailabilityZones : { type: types.array, validators: [PreferredAvailabilityZonesValidator] },
    PreferredMaintenanceWindow : { type: types.string },
    SnapshotArns : { type: types.array },
    SnapshotRetentionLimit : { type: types.number },
    SnapshotWindow : { type: types.string },
    VpcSecurityGroupIds : { type: types.array, required: 'conditional' },
});

var ReplicationGroup = AWSResource.define('AWS::ElastiCache::ReplicationGroup', {
    AutomaticFailoverEnabled : { type: types.boolean, validators: [AutomaticFailoverValidator] },
    AutoMinorVersionUpgrade : { type: types.boolean },
    CacheNodeType : { type: types.string, required: true },
    CacheParameterGroupName : { type: types.string },
    CacheSecurityGroupNames : { type: types.array, required: 'conditional' },
    CacheSubnetGroupName : { type: types.string },
    Engine : { type: types.enum('redis'), required: true, validators: [EngineValidator] },
    EngineVersion : { type: types.string },
    NodeGroupConfiguration: { type: types.array },
    NotificationTopicArn : { type: types.string },
    NumCacheClusters : { type: types.number, validators: [NumCacheClustersValidator] },
    NumNodeGroups : { type: types.number },
    Port : { type: types.number },
    PreferredCacheClusterAZs : { type: types.array },
    PreferredMaintenanceWindow : { type: types.string },
    PrimaryClusterId : { type: types.string, required: 'conditional' },
    ReplicasPerNodeGroup : { type: types.number },
    ReplicationGroupDescription : { type: types.string, required: true },
    ReplicationGroupId : { type: types.string },
    SecurityGroupIds : { type: types.array, required: 'conditional' },
    SnapshotArns : { type: types.array },
    SnapshotName : { type: types.string },
    SnapshotRetentionLimit : { type: types.number },
    SnapshottingClusterId : { type: types.string },
    SnapshotWindow : { type: types.string },
    Tags : { type: types.tags },
});

var ParameterGroup = AWSResource.define('AWS::ElastiCache::ParameterGroup', {
    CacheParameterGroupFamily : { type: types.string, required: true },
    Description : { type: types.string, required: true },
    Properties : { type: types.object('ec-parameter-group') },
});

var SecurityGroup = AWSResource.define('AWS::ElastiCache::SecurityGroup', {
    Description : { type: types.string },
});

var SecurityGroupIngress = AWSResource.define('AWS::ElastiCache::SecurityGroupIngress', {
    CacheSecurityGroupName : { type: types.string, required: true },
    EC2SecurityGroupName : { type: types.string, required: true },
    EC2SecurityGroupOwnerId : { type: types.string },
});

var SubnetGroup = AWSResource.define('AWS::ElastiCache::SubnetGroup', {
    Description : { type: types.string, required: true },
    SubnetIds : { type: types.array, required: true },
});

module.exports = {
    CacheCluster: CacheCluster,
    ReplicationGroup: ReplicationGroup,
    ParameterGroup: ParameterGroup,
    SecurityGroup: SecurityGroup,
    SecurityGroupIngress: SecurityGroupIngress,
    SubnetGroup: SubnetGroup,
};
