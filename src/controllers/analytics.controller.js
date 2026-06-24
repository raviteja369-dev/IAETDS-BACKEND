import { asyncHandler } from '../utils/asyncHandler.js';
import { Asset } from '../models/Asset.js';
import { Ticket } from '../models/Ticket.js';
import { Incident } from '../models/Incident.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';

function seededWave(points, base, amp, phase = 0, jitter = 0) {
  return Array.from({ length: points }, (_, i) => {
    const v =
      base +
      amp * Math.sin((i / points) * Math.PI * 2 + phase) +
      (jitter ? (Math.sin(i * 12.9898 + phase) * 43758.5453 % 1) * jitter : 0);
    return Math.max(0, Math.round(v * 10) / 10);
  });
}

export const getDashboard = asyncHandler(async (_req, res) => {
  const [
    totalAssets,
    operationalAssets,
    criticalIncidents,
    openTickets,
    activeSecurityEvents,
    maintenanceDue,
    assetsByCategory,
    assetsByStatus,
    incidentsBySeverity,
    recentIncidents,
    recentSecurity,
  ] = await Promise.all([
    Asset.countDocuments({ status: { $ne: 'retired' } }),
    Asset.countDocuments({ status: 'operational' }),
    Incident.countDocuments({ status: { $ne: 'resolved' }, priority: 'critical' }),
    Ticket.countDocuments({ status: { $in: ['open', 'in_progress', 'on_hold'] } }),
    SecurityEvent.countDocuments({ status: { $nin: ['resolved', 'false_positive'] } }),
    MaintenanceTask.countDocuments({ status: { $in: ['scheduled', 'overdue', 'in_progress'] } }),
    Asset.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Asset.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Incident.find().sort('-createdAt').limit(5).lean(),
    SecurityEvent.find().sort('-occurredAt').limit(6).lean(),
  ]);

  const healthAgg = await Asset.aggregate([
    { $group: { _id: null, avg: { $avg: '$healthScore' } } },
  ]);
  const infraHealth = Math.round(healthAgg[0]?.avg || 96);

  const criticalSec = await SecurityEvent.countDocuments({
    severity: { $in: ['critical', 'high'] },
    status: { $nin: ['resolved', 'false_positive'] },
  });
  const securityScore = Math.max(40, Math.min(99, 96 - criticalSec * 2 - criticalIncidents * 3));

  const resolvedTickets = await Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } });
  const breachedTickets = await Ticket.countDocuments({ slaBreached: true });
  const slaCompliance = resolvedTickets
    ? Math.round(((resolvedTickets - breachedTickets) / resolvedTickets) * 1000) / 10
    : 99.2;

  res.json({
    success: true,
    data: {
      kpis: {
        totalAssets,
        activeSystems: operationalAssets,
        criticalIncidents,
        openTickets,
        securityScore,
        infrastructureHealth: infraHealth,
        slaCompliance,
        uptime: 99.98,
      },
      trends: {
        uptime: seededWave(24, 99.95, 0.04, 0).map((v) => Math.min(100, v)),
        incidents: seededWave(14, 4, 3, 1),
        requestsPerSec: seededWave(24, 1800, 600, 0.5, 120),
        latencyMs: seededWave(24, 180, 60, 2),
      },
      distribution: {
        assetsByCategory: toPairs(assetsByCategory),
        assetsByStatus: toPairs(assetsByStatus),
        incidentsBySeverity: toPairs(incidentsBySeverity),
      },
      recentIncidents,
      recentSecurity,
    },
  });
});

export const getPerformance = asyncHandler(async (_req, res) => {
  const points = 24;
  res.json({
    success: true,
    data: {
      series: {
        cpu: seededWave(points, 52, 22, 0.3, 6),
        memory: seededWave(points, 64, 14, 1.2, 4),
        storage: seededWave(points, 71, 6, 0.8, 2),
        network: seededWave(points, 480, 220, 0.5, 40),
        responseTime: seededWave(points, 190, 70, 2.1, 15),
        availability: seededWave(points, 99.96, 0.05, 0).map((v) => Math.min(100, v)),
      },
      current: {
        cpu: 58.4,
        memory: 67.1,
        storage: 73.2,
        network: 612,
        responseTime: 184,
        availability: 99.98,
      },
      thresholds: { cpu: 85, memory: 90, storage: 85, responseTime: 400 },
      nodes: [
        { name: 'app-cluster-01', cpu: 61, memory: 70, status: 'healthy', region: 'us-east-1' },
        { name: 'app-cluster-02', cpu: 48, memory: 64, status: 'healthy', region: 'us-east-1' },
        { name: 'db-primary', cpu: 73, memory: 81, status: 'warning', region: 'us-east-1' },
        { name: 'cache-redis-01', cpu: 22, memory: 39, status: 'healthy', region: 'eu-west-1' },
        { name: 'edge-gateway', cpu: 35, memory: 41, status: 'healthy', region: 'global' },
      ],
    },
  });
});

export const getSecurityOverview = asyncHandler(async (_req, res) => {
  const [byType, bySeverity, byStatus, topRisks, failedLogins] = await Promise.all([
    SecurityEvent.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
    SecurityEvent.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    SecurityEvent.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    SecurityEvent.find().sort('-riskScore').limit(6).lean(),
    SecurityEvent.countDocuments({ type: 'failed_login' }),
  ]);

  const riskAgg = await SecurityEvent.aggregate([
    { $match: { status: { $nin: ['resolved', 'false_positive'] } } },
    { $group: { _id: null, avg: { $avg: '$riskScore' } } },
  ]);

  res.json({
    success: true,
    data: {
      summary: {
        openThreats: await SecurityEvent.countDocuments({
          status: { $nin: ['resolved', 'false_positive'] },
        }),
        criticalThreats: await SecurityEvent.countDocuments({ severity: 'critical' }),
        avgRiskScore: Math.round(riskAgg[0]?.avg || 42),
        failedLogins,
        vulnerabilities: await SecurityEvent.countDocuments({ type: 'vulnerability' }),
      },
      byType: toPairs(byType),
      bySeverity: toPairs(bySeverity),
      byStatus: toPairs(byStatus),
      threatTrend: seededWave(14, 18, 10, 1, 4),
      topRisks,
    },
  });
});

function toPairs(agg) {
  return agg.map((d) => ({ key: d._id, value: d.count }));
}
