/**
 * Seed routine — populates IAETDS with realistic enterprise demo data.
 * Run directly with: npm run seed
 * Or import { seedDatabase } for programmatic / auto-seed use.
 */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS } from '../config/rbac.js';

import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Asset } from '../models/Asset.js';
import { Ticket } from '../models/Ticket.js';
import { Incident } from '../models/Incident.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Report } from '../models/Report.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d) => new Date(Date.now() - d * 86400000);
const hoursAhead = (h) => new Date(Date.now() + h * 3600000);
const pad = (n, len = 4) => String(n).padStart(len, '0');

export async function seedDatabase() {
  console.log('[seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Asset.deleteMany({}),
    Ticket.deleteMany({}),
    Incident.deleteMany({}),
    SecurityEvent.deleteMany({}),
    MaintenanceTask.deleteMany({}),
    Report.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // ── Roles ──────────────────────────────────────────────
  await Role.insertMany(
    Object.values(ROLES).map((key) => ({
      key,
      label: ROLE_LABELS[key],
      permissions: ROLE_PERMISSIONS[key],
      description: `${ROLE_LABELS[key]} role with scoped permissions.`,
    })),
  );

  // ── Users ──────────────────────────────────────────────
  console.log('[seed] Creating users...');
  const userSeed = [
    { name: 'Alexandra Chen', email: 'admin@iaetds.io', role: ROLES.SUPER_ADMIN, department: 'Executive', title: 'Chief Technology Officer', avatarColor: '#6366f1' },
    { name: 'Marcus Reyes', email: 'analyst@iaetds.io', role: ROLES.SECURITY_ANALYST, department: 'Security', title: 'Senior Security Analyst', avatarColor: '#ef4444' },
    { name: 'Priya Nair', email: 'engineer@iaetds.io', role: ROLES.MAINTENANCE_ENGINEER, department: 'Infrastructure', title: 'Lead Maintenance Engineer', avatarColor: '#10b981' },
    { name: 'David Okafor', email: 'manager@iaetds.io', role: ROLES.OPERATIONS_MANAGER, department: 'Operations', title: 'Director of Operations', avatarColor: '#f59e0b' },
    { name: 'Sofia Müller', email: 'viewer@iaetds.io', role: ROLES.VIEWER, department: 'Compliance', title: 'Compliance Auditor', avatarColor: '#0ea5e9' },
    { name: 'Liam Patterson', email: 'liam.patterson@iaetds.io', role: ROLES.SECURITY_ANALYST, department: 'Security', title: 'SOC Analyst', avatarColor: '#a855f7' },
    { name: 'Yuki Tanaka', email: 'yuki.tanaka@iaetds.io', role: ROLES.MAINTENANCE_ENGINEER, department: 'Infrastructure', title: 'Site Reliability Engineer', avatarColor: '#14b8a6' },
    { name: 'Fatima Al-Sayed', email: 'fatima.alsayed@iaetds.io', role: ROLES.OPERATIONS_MANAGER, department: 'Operations', title: 'Operations Manager', avatarColor: '#ec4899' },
  ];

  const users = [];
  for (const u of userSeed) {
    const doc = await User.create({
      ...u,
      password: 'Password123!',
      mfaEnabled: u.role === ROLES.SUPER_ADMIN || u.role === ROLES.SECURITY_ANALYST,
      lastLoginAt: daysAgo(rand(0, 3)),
      lastActiveAt: daysAgo(0),
    });
    users.push(doc);
  }
  const engineers = users.filter((u) => u.role === ROLES.MAINTENANCE_ENGINEER);
  const analysts = users.filter((u) => u.role === ROLES.SECURITY_ANALYST);
  const managers = users.filter((u) => u.role === ROLES.OPERATIONS_MANAGER);

  // ── Assets ─────────────────────────────────────────────
  console.log('[seed] Creating assets...');
  const categories = ['server', 'network', 'storage', 'endpoint', 'database', 'application', 'cloud', 'security_appliance'];
  const manufacturers = { server: ['Dell', 'HPE', 'Cisco'], network: ['Cisco', 'Juniper', 'Arista'], storage: ['NetApp', 'Pure Storage', 'Dell EMC'], endpoint: ['Lenovo', 'Apple', 'Dell'], database: ['Oracle', 'MongoDB', 'PostgreSQL'], application: ['Internal', 'SAP', 'Salesforce'], cloud: ['AWS', 'Azure', 'GCP'], security_appliance: ['Palo Alto', 'Fortinet', 'CrowdStrike'] };
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'];
  const locations = ['Primary Datacenter', 'DR Site - Dallas', 'AWS us-east-1', 'Azure North Europe', 'HQ Server Room'];
  const namePrefix = { server: 'srv', network: 'net', storage: 'stor', endpoint: 'wks', database: 'db', application: 'app', cloud: 'cloud', security_appliance: 'sec' };

  const assets = [];
  for (let i = 1; i <= 64; i++) {
    const category = pick(categories);
    const status = pick(['operational', 'operational', 'operational', 'degraded', 'maintenance', 'offline']);
    assets.push({
      assetTag: `AST-${pad(i)}`,
      name: `${namePrefix[category]}-${pick(['core', 'edge', 'prod', 'app', 'data'])}-${pad(rand(1, 99), 2)}`,
      category,
      type: category,
      manufacturer: pick(manufacturers[category]),
      model: `${pick(['X', 'R', 'G', 'M'])}${rand(100, 999)}`,
      serialNumber: `SN${rand(100000, 999999)}`,
      status,
      criticality: pick(['critical', 'high', 'high', 'medium', 'medium', 'low']),
      environment: pick(['production', 'production', 'staging', 'development', 'dr']),
      location: pick(locations),
      region: pick(regions),
      ipAddress: `10.${rand(0, 50)}.${rand(0, 255)}.${rand(1, 254)}`,
      os: pick(['Ubuntu 22.04 LTS', 'RHEL 9', 'Windows Server 2022', 'Debian 12', 'Amazon Linux 2023']),
      owner: pick(['Infrastructure Ops', 'Security', 'Platform', 'Data Engineering']),
      assignedTo: pick(engineers)._id,
      healthScore: status === 'operational' ? rand(88, 100) : status === 'degraded' ? rand(55, 80) : rand(20, 60),
      purchaseDate: daysAgo(rand(120, 1200)),
      warrantyExpiry: hoursAhead(rand(-2000, 12000)),
      lifecycleStage: pick(['deployed', 'in_use', 'in_use', 'in_use', 'end_of_life']),
      costMonthly: rand(120, 4800),
      tags: [pick(['pci', 'gdpr', 'hipaa', 'soc2']), pick(['tier-1', 'tier-2', 'tier-3'])],
      lastSeenAt: daysAgo(rand(0, 2)),
    });
  }
  const assetDocs = await Asset.insertMany(assets);

  // ── Security Events ────────────────────────────────────
  console.log('[seed] Creating security events...');
  const secTypes = ['intrusion_attempt', 'malware', 'phishing', 'brute_force', 'data_exfiltration', 'policy_violation', 'vulnerability', 'anomaly', 'failed_login', 'privilege_escalation'];
  const mitre = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Lateral Movement', 'Exfiltration'];
  const geos = ['Beijing, CN', 'Moscow, RU', 'Lagos, NG', 'São Paulo, BR', 'Frankfurt, DE', 'Unknown', 'Mumbai, IN'];
  const secEvents = [];
  for (let i = 1; i <= 70; i++) {
    const type = pick(secTypes);
    const severity = pick(['critical', 'high', 'high', 'medium', 'medium', 'low', 'info']);
    secEvents.push({
      eventId: `SEC-${pad(i)}`,
      type,
      title: secTitle(type),
      description: `Detected ${type.replace(/_/g, ' ')} activity against monitored infrastructure. Correlated across SIEM and EDR telemetry.`,
      severity,
      status: pick(['new', 'triaging', 'investigating', 'contained', 'resolved', 'false_positive']),
      riskScore: severity === 'critical' ? rand(80, 99) : severity === 'high' ? rand(60, 85) : severity === 'medium' ? rand(35, 65) : rand(5, 35),
      sourceIp: `${rand(1, 223)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
      destinationIp: `10.${rand(0, 50)}.${rand(0, 255)}.${rand(1, 254)}`,
      geoLocation: pick(geos),
      targetAsset: pick(assetDocs)._id,
      targetUser: pick(['admin@iaetds.io', 'svc_backup', 'jdoe', 'root', 'guest']),
      mitreTactic: pick(mitre),
      detectionSource: pick(['SIEM', 'EDR', 'Firewall', 'IDS/IPS', 'Cloud WAF']),
      cveId: type === 'vulnerability' ? `CVE-2024-${rand(1000, 9999)}` : '',
      assignedTo: pick(analysts)._id,
      occurredAt: daysAgo(rand(0, 21)),
    });
  }
  await SecurityEvent.insertMany(secEvents);

  // ── Incidents ──────────────────────────────────────────
  console.log('[seed] Creating incidents...');
  const incidents = [];
  for (let i = 1; i <= 24; i++) {
    const severity = pick(['sev1', 'sev2', 'sev2', 'sev3', 'sev3', 'sev4']);
    const status = pick(['detected', 'investigating', 'identified', 'monitoring', 'resolved', 'resolved']);
    const commander = pick(managers.concat(analysts));
    const detectedAt = daysAgo(rand(0, 30));
    incidents.push({
      incidentId: `INC-${pad(i)}`,
      title: pick(['API gateway elevated 5xx errors', 'Primary database failover triggered', 'Authentication service latency spike', 'Suspicious lateral movement detected', 'Storage array degraded performance', 'CDN edge node outage', 'Payment processing timeouts', 'Kubernetes node pool unhealthy']),
      summary: 'Automated monitoring detected a service-impacting condition. Incident response engaged per runbook.',
      severity,
      priority: severity === 'sev1' ? 'critical' : severity === 'sev2' ? 'high' : 'medium',
      status,
      impact: pick(['site_down', 'major_degradation', 'partial', 'minor']),
      category: pick(['security', 'infrastructure', 'application', 'network', 'database']),
      affectedServices: [pick(['Auth API', 'Billing', 'Search', 'Notifications', 'Web App', 'Mobile API'])],
      affectedAssets: [pick(assetDocs)._id],
      commander: commander._id,
      commanderName: commander.name,
      detectedAt,
      resolvedAt: status === 'resolved' ? new Date(detectedAt.getTime() + rand(1, 48) * 3600000) : undefined,
      rootCause: status === 'resolved' ? pick(['Misconfigured autoscaling policy', 'Expired TLS certificate', 'Memory leak in service worker', 'Upstream provider outage', 'Database connection pool exhaustion']) : '',
      escalationLevel: rand(1, 3),
      timeline: [
        { at: detectedAt, status: 'detected', note: 'Alert triggered by monitoring.', actorName: 'PagerDuty' },
        { at: new Date(detectedAt.getTime() + 600000), status: 'investigating', note: 'On-call engineer acknowledged.', actorName: commander.name },
      ],
      tags: [pick(['customer-impacting', 'internal', 'sla-risk'])],
    });
  }
  await Incident.insertMany(incidents);

  // ── Tickets ────────────────────────────────────────────
  console.log('[seed] Creating tickets...');
  const tickets = [];
  for (let i = 1; i <= 48; i++) {
    const status = pick(['open', 'in_progress', 'on_hold', 'resolved', 'closed']);
    const requester = pick(users);
    const assignee = pick(engineers.concat(managers));
    tickets.push({
      ticketId: `TKT-${pad(i)}`,
      subject: pick(['Request new VM provisioning', 'VPN access not working', 'Disk space alert on db-primary', 'Onboard new employee laptop', 'Firewall rule change request', 'Backup job failed overnight', 'SSL certificate renewal', 'Increase RDS instance size']),
      description: 'Submitted via the IAETDS service portal. Awaiting triage and assignment.',
      category: pick(['incident', 'request', 'problem', 'change', 'access']),
      priority: pick(['critical', 'high', 'medium', 'medium', 'low']),
      status,
      requester: requester._id,
      requesterName: requester.name,
      assignee: assignee._id,
      assigneeName: assignee.name,
      relatedAsset: pick(assetDocs)._id,
      slaDueAt: hoursAhead(rand(-12, 72)),
      slaBreached: Math.random() < 0.12,
      resolvedAt: ['resolved', 'closed'].includes(status) ? daysAgo(rand(0, 10)) : undefined,
      tags: [pick(['hardware', 'software', 'network', 'access'])],
    });
  }
  await Ticket.insertMany(tickets);

  // ── Maintenance ────────────────────────────────────────
  console.log('[seed] Creating maintenance work orders...');
  const maint = [];
  for (let i = 1; i <= 32; i++) {
    const status = pick(['scheduled', 'in_progress', 'completed', 'completed', 'overdue', 'on_hold']);
    const asset = pick(assetDocs);
    const assignee = pick(engineers);
    const start = status === 'completed' ? daysAgo(rand(2, 40)) : hoursAhead(rand(-48, 240));
    maint.push({
      workOrderId: `WO-${pad(i)}`,
      title: pick(['Quarterly firmware update', 'Replace failing disk array', 'OS security patching', 'Database index optimization', 'Network switch reboot', 'Cooling system inspection', 'Backup verification', 'Certificate rotation']),
      description: 'Preventive/corrective maintenance per asset lifecycle policy.',
      type: pick(['preventive', 'corrective', 'predictive', 'scheduled', 'emergency']),
      status,
      priority: pick(['critical', 'high', 'medium', 'low']),
      asset: asset._id,
      assetName: asset.name,
      assignedTeam: pick(['Infrastructure Ops', 'Network Team', 'Database Team', 'Security']),
      assignedTo: assignee._id,
      assigneeName: assignee.name,
      scheduledStart: start,
      scheduledEnd: new Date(start.getTime() + rand(1, 8) * 3600000),
      completedAt: status === 'completed' ? start : undefined,
      progress: status === 'completed' ? 100 : status === 'in_progress' ? rand(20, 80) : 0,
      estimatedHours: rand(1, 12),
      recurrence: pick(['none', 'none', 'monthly', 'quarterly', 'weekly']),
      checklist: [
        { label: 'Pre-maintenance snapshot', done: status !== 'scheduled' },
        { label: 'Apply changes', done: ['in_progress', 'completed'].includes(status) },
        { label: 'Validation & sign-off', done: status === 'completed' },
      ],
    });
  }
  await MaintenanceTask.insertMany(maint);

  // ── Reports ────────────────────────────────────────────
  console.log('[seed] Creating reports...');
  const reportSeed = [
    { name: 'SOC 2 Type II Readiness', type: 'compliance', framework: 'SOC 2', score: 94 },
    { name: 'Monthly Security Posture', type: 'security', framework: 'NIST CSF', score: 88 },
    { name: 'Asset Lifecycle & Depreciation', type: 'asset', framework: '', score: undefined },
    { name: 'Infrastructure Performance Review', type: 'performance', framework: '', score: 96 },
    { name: 'PCI-DSS Quarterly Scan', type: 'compliance', framework: 'PCI-DSS', score: 91 },
    { name: 'Incident Postmortem Digest', type: 'incident', framework: '', score: undefined },
    { name: 'GDPR Data Processing Audit', type: 'compliance', framework: 'GDPR', score: 89 },
    { name: 'Preventive Maintenance Summary', type: 'maintenance', framework: '', score: undefined },
  ];
  const admin = users[0];
  await Report.insertMany(
    reportSeed.map((r, idx) => ({
      reportId: `RPT-${pad(idx + 1)}`,
      description: `Auto-generated ${r.type} report covering the reporting period.`,
      period: pick(['Last 30 days', 'Q2 2026', 'Last 90 days', 'June 2026']),
      format: pick(['pdf', 'xlsx', 'csv']),
      status: pick(['generated', 'generated', 'scheduled', 'processing']),
      generatedBy: admin._id,
      generatedByName: admin.name,
      fileSize: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`,
      metrics: { items: rand(40, 400) },
      ...r,
    })),
  );

  // ── Notifications ──────────────────────────────────────
  console.log('[seed] Creating notifications...');
  const notifs = [];
  for (const u of users) {
    for (let i = 0; i < rand(4, 8); i++) {
      const type = pick(['security', 'incident', 'maintenance', 'system', 'asset', 'report']);
      notifs.push({
        user: u._id,
        title: notifTitle(type),
        message: 'Click to view details in the IAETDS console.',
        type,
        severity: pick(['critical', 'warning', 'info', 'info', 'success']),
        read: Math.random() < 0.5,
        actionUrl: `/${pick(['security', 'incidents', 'maintenance', 'assets'])}`,
        createdAt: daysAgo(rand(0, 7)),
      });
    }
  }
  await Notification.insertMany(notifs);

  // ── Audit logs ─────────────────────────────────────────
  console.log('[seed] Creating audit logs...');
  const audits = [];
  const actions = ['auth.login', 'asset.update', 'incident.create', 'security.update', 'maintenance.create', 'reports.create', 'users.update'];
  for (let i = 0; i < 60; i++) {
    const actor = pick(users);
    audits.push({
      action: pick(actions),
      actor: actor._id,
      actorEmail: actor.email,
      actorRole: actor.role,
      method: pick(['POST', 'PATCH', 'GET', 'DELETE']),
      path: pick(['/api/assets', '/api/incidents', '/api/security-events', '/api/auth/login']),
      statusCode: pick([200, 200, 201, 204]),
      ip: `10.${rand(0, 50)}.${rand(0, 255)}.${rand(1, 254)}`,
      userAgent: 'Mozilla/5.0 (IAETDS Console)',
      createdAt: daysAgo(rand(0, 14)),
    });
  }
  await AuditLog.insertMany(audits);

  console.log('\n[seed] Done. Demo accounts (password: Password123!):');
  userSeed.slice(0, 5).forEach((u) => console.log(`   • ${ROLE_LABELS[u.role].padEnd(22)} ${u.email}`));

  return { users: users.length, assets: assetDocs.length };
}

/** Seeds only when the database has no users yet (used on server boot). */
export async function ensureSeeded() {
  const count = await User.countDocuments();
  if (count > 0) {
    console.log(`[seed] Database already populated (${count} users). Skipping auto-seed.`);
    return false;
  }
  console.log('[seed] Empty database detected — running auto-seed...');
  await seedDatabase();
  return true;
}

function secTitle(type) {
  const map = {
    intrusion_attempt: 'Unauthorized access attempt blocked',
    malware: 'Malware signature detected on endpoint',
    phishing: 'Phishing campaign targeting employees',
    brute_force: 'Brute-force authentication attack',
    data_exfiltration: 'Anomalous outbound data transfer',
    policy_violation: 'Security policy violation detected',
    vulnerability: 'Critical vulnerability identified',
    anomaly: 'Behavioral anomaly flagged by UEBA',
    failed_login: 'Repeated failed login attempts',
    privilege_escalation: 'Privilege escalation attempt',
  };
  return map[type] || 'Security event detected';
}

function notifTitle(type) {
  const map = {
    security: 'New critical security alert',
    incident: 'Incident status updated',
    maintenance: 'Scheduled maintenance reminder',
    system: 'System health notification',
    asset: 'Asset status changed',
    report: 'Report ready for download',
  };
  return map[type] || 'Notification';
}

// CLI entrypoint — run standalone when invoked directly.
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('utils/seed.js');
if (isDirectRun) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    await mongoose.connection.close().catch(() => {});
    process.exit(0);
  })().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}
