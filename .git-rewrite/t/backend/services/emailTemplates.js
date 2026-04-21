/**
 * Email Templates
 * ARCH.6 - HTML Email Templates for Notifications
 */

/**
 * Template for threat alert emails
 */
function threatAlertTemplate(threatType, severity, details) {
  return {
    subject: `🚨 ScamGuard Alert: ${threatType} Threat Detected`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
    .details { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Security Alert</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>We detected a potential threat and wanted to alert you immediately.</p>

      <div class="alert-box">
        <h2>${threatType}</h2>
        <p><strong>Severity:</strong> ${severity}</p>
        <p>${details || 'A potentially malicious activity has been detected.'}</p>
      </div>

      <h3>What You Should Do:</h3>
      <ul>
        <li>Review the threat details in your ScamGuard app</li>
        <li>Check if you've shared any sensitive information</li>
        <li>Change your passwords if necessary</li>
        <li>Enable two-factor authentication on important accounts</li>
      </ul>

      <a href="https://scamguard.app/dashboard?alert=true" class="button">Review Alert in Dashboard</a>

      <div class="footer">
        <p>You received this email because you have threat alerts enabled in your ScamGuard preferences.</p>
        <p>&copy; 2026 ScamGuard. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `ScamGuard Alert: ${threatType} (${severity}) - ${details || 'A potential threat has been detected.'} Review in your dashboard.`
  };
}

/**
 * Template for daily digest emails
 */
function dailyDigestTemplate(threatCount, highlights, statsUrl) {
  return {
    subject: `📊 ScamGuard Daily Summary - ${threatCount} Threats Blocked`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .stat-box { display: inline-block; background: #f5f5f5; padding: 15px; margin: 10px 5px; border-radius: 3px; text-align: center; min-width: 120px; }
    .stat-number { font-size: 24px; font-weight: bold; color: #28a745; }
    .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
    .highlights { margin: 20px 0; }
    .highlight-item { background: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 3px solid #28a745; }
    .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Summary</h1>
      <p>You're protected! Here's what we blocked today.</p>
    </div>
    <div class="content">
      <p>Hi there,</p>

      <div style="text-align: center; margin: 20px 0;">
        <div class="stat-box">
          <div class="stat-number">${threatCount}</div>
          <div class="stat-label">Threats Blocked</div>
        </div>
      </div>

      ${highlights ? `
      <div class="highlights">
        <h3>Today's Highlights:</h3>
        ${highlights.map(h => `<div class="highlight-item">${h}</div>`).join('')}
      </div>
      ` : ''}

      <p>Great job staying vigilant! Keep using ScamGuard to stay protected.</p>

      <a href="${statsUrl || 'https://scamguard.app/dashboard'}" class="button">View Full Report</a>

      <div class="footer">
        <p>You received this email because daily digests are enabled in your preferences.</p>
        <p>&copy; 2026 ScamGuard. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `ScamGuard Daily Summary: ${threatCount} threats blocked today. ${highlights ? 'Highlights: ' + highlights.join(', ') : ''}`
  };
}

/**
 * Template for weekly reports
 */
function weeklyReportTemplate(weekStats, recommendedActions, reportUrl) {
  return {
    subject: '📈 ScamGuard Weekly Security Report',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .stat-label { font-weight: bold; }
    .stat-value { color: #007bff; }
    .recommendation { background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📈 Weekly Security Report</h1>
      <p>Your personalized security summary</p>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>Here's your weekly security summary powered by ScamGuard.</p>

      <h3>This Week's Stats:</h3>
      <div class="stat-row">
        <span class="stat-label">Threats Blocked:</span>
        <span class="stat-value">${weekStats.threatsBlocked || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Phishing Attempts:</span>
        <span class="stat-value">${weekStats.phishingAttempts || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Malware Detections:</span>
        <span class="stat-value">${weekStats.malwareDetections || 0}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Academy Progress:</span>
        <span class="stat-value">${weekStats.academyProgress || '0%'}</span>
      </div>

      ${recommendedActions ? `
      <h3>Recommended Actions:</h3>
      ${recommendedActions.map(action => `<div class="recommendation"><p>${action}</p></div>`).join('')}
      ` : ''}

      <a href="${reportUrl || 'https://scamguard.app/reports'}" class="button">View Detailed Report</a>

      <div class="footer">
        <p>You received this email because weekly reports are enabled in your preferences.</p>
        <p>&copy; 2026 ScamGuard. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `ScamGuard Weekly Report: ${weekStats.threatsBlocked || 0} threats blocked, ${weekStats.phishingAttempts || 0} phishing attempts detected. View full report online.`
  };
}

/**
 * Template for academy reminders
 */
function academyReminderTemplate(nextModuleTitle, progressPercent) {
  return {
    subject: '📚 Continue Your Security Training with ScamGuard Academy',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #17a2b8; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .module-card { background: #f0f0f0; padding: 20px; margin: 15px 0; border-radius: 3px; text-align: center; }
    .progress-bar { background: #ddd; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .progress-fill { background: #17a2b8; height: 100%; width: ${progressPercent}%; }
    .button { display: inline-block; background: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 ScamGuard Academy</h1>
      <p>Continue your security training</p>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>You're doing great with your security training! Continue where you left off.</p>

      <div class="module-card">
        <h3>Next Module:</h3>
        <h2>${nextModuleTitle || 'Social Engineering Tactics'}</h2>
        <p>Learn how to identify and avoid social engineering attacks.</p>

        <p>Your Progress:</p>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <p>${progressPercent}% Complete</p>
      </div>

      <p>Earn badges and points as you complete modules and quizzes.</p>

      <a href="https://scamguard.app/academy" class="button">Continue Learning</a>

      <div class="footer">
        <p>You received this email because academy reminders are enabled in your preferences.</p>
        <p>&copy; 2026 ScamGuard. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `ScamGuard Academy: Continue your training! Next module: ${nextModuleTitle || 'Social Engineering Tactics'}. You're ${progressPercent}% complete.`
  };
}

/**
 * Template for daily security tips
 */
function dailyTipTemplate(tipTitle, tipContent, tipCategory) {
  return {
    subject: `💡 Daily Security Tip from ScamGuard`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #ffc107; color: #333; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .tip-box { background: #fffbea; border-left: 4px solid #ffc107; padding: 20px; margin: 15px 0; border-radius: 3px; }
    .tip-title { font-size: 18px; font-weight: bold; color: #ffc107; margin-bottom: 10px; }
    .tip-category { display: inline-block; background: #ffc107; color: #333; padding: 5px 10px; border-radius: 3px; font-size: 12px; margin-bottom: 10px; }
    .button { display: inline-block; background: #ffc107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💡 Daily Security Tip</h1>
      <p>Stay safe with these essential security tips</p>
    </div>
    <div class="content">
      <p>Hi there,</p>

      <div class="tip-box">
        ${tipCategory ? `<div class="tip-category">${tipCategory}</div>` : ''}
        <div class="tip-title">${tipTitle}</div>
        <p>${tipContent}</p>
      </div>

      <p>Apply this tip today to improve your online security!</p>

      <a href="https://scamguard.app/academy" class="button">Learn More</a>

      <div class="footer">
        <p>You received this email because daily tips are enabled in your preferences.</p>
        <p>&copy; 2026 ScamGuard. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `,
    text: `ScamGuard Tip: ${tipTitle}. ${tipContent}`
  };
}

/**
 * Template for admin notifications - scam report received
 */
function adminScamReportTemplate(reportId, scamType, submitterLocation, evidence) {
  return {
    subject: `[ADMIN] New Scam Report: ${scamType}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .info-box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .info-label { font-weight: bold; color: #666; margin-top: 10px; margin-bottom: 5px; }
    .button { display: inline-block; background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 New Scam Report</h1>
      <p>A new report requires review</p>
    </div>
    <div class="content">
      <p>A new scam report has been submitted and requires your attention.</p>

      <div class="info-box">
        <div class="info-label">Report ID:</div>
        <div>${reportId}</div>

        <div class="info-label">Scam Type:</div>
        <div>${scamType}</div>

        ${submitterLocation ? `
        <div class="info-label">Submitter Location:</div>
        <div>${submitterLocation}</div>
        ` : ''}

        ${evidence ? `
        <div class="info-label">Evidence:</div>
        <div>${evidence}</div>
        ` : ''}
      </div>

      <p><strong>Action Required:</strong> Review this report in the admin dashboard and take appropriate action.</p>

      <a href="https://scamguard.app/admin/reports/${reportId}" class="button">Review Report</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `New scam report (${reportId}): ${scamType}. Review in admin dashboard.`
  };
}

/**
 * Template for admin notifications - user flagged
 */
function adminUserFlaggedTemplate(userId, flagReason, flaggingSeverity) {
  return {
    subject: `[ADMIN] User Flagged for Review: ${userId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #ffc107; color: #333; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .severity-high { color: #dc3545; font-weight: bold; }
    .severity-medium { color: #fd7e14; font-weight: bold; }
    .severity-low { color: #28a745; font-weight: bold; }
    .button { display: inline-block; background: #ffc107; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ User Flagged</h1>
      <p>A user requires review</p>
    </div>
    <div class="content">
      <p>A user has been flagged in the system.</p>

      <div class="info-box">
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Reason:</strong> ${flagReason}</p>
        <p><strong>Severity:</strong> <span class="severity-${flaggingSeverity || 'medium'}">${(flaggingSeverity || 'Medium').toUpperCase()}</span></p>
      </div>

      <p>Review the user's account and activity in the admin dashboard.</p>

      <a href="https://scamguard.app/admin/users/${userId}" class="button">Review User</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `User flagged: ${userId}. Reason: ${flagReason}. Severity: ${flaggingSeverity || 'Medium'}`
  };
}

/**
 * Template for admin notifications - system alert
 */
function adminSystemAlertTemplate(alertType, alertDetails, severity) {
  return {
    subject: `[ADMIN] System Alert: ${alertType}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
    .alert-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; border-radius: 3px; }
    .button { display: inline-block; background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 3px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 System Alert</h1>
      <p>Immediate attention required</p>
    </div>
    <div class="content">
      <p>A system alert has been triggered.</p>

      <div class="alert-box">
        <p><strong>Alert Type:</strong> ${alertType}</p>
        <p><strong>Severity:</strong> ${severity || 'High'}</p>
        <p><strong>Details:</strong></p>
        <p>${alertDetails}</p>
      </div>

      <p>Please review the system status immediately and take corrective action if needed.</p>

      <a href="https://scamguard.app/admin/alerts" class="button">View All Alerts</a>
    </div>
  </div>
</body>
</html>
    `,
    text: `System Alert: ${alertType} (${severity || 'High'}). ${alertDetails}`
  };
}

module.exports = {
  threatAlertTemplate,
  dailyDigestTemplate,
  weeklyReportTemplate,
  academyReminderTemplate,
  dailyTipTemplate,
  adminScamReportTemplate,
  adminUserFlaggedTemplate,
  adminSystemAlertTemplate
};
