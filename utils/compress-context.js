/**
 * Context Compaction Utility
 * Automatically compresses long session contexts while preserving critical information
 *
 * Usage:
 *   const summary = compressSession(messages, tokensUsed);
 *   const escalated = checkObservationsForEscalation();
 *   archiveOldTasks();
 */

/**
 * Compress a session when token threshold is exceeded
 * @param {array} messages - Claude SDK messages array
 * @param {number} tokensUsed - Total tokens used so far
 * @param {number} threshold - Token threshold (default 100K)
 * @returns {object} - { shouldCompress, summary, archiveData }
 */
export function checkSessionCompaction(messages, tokensUsed, threshold = 100000) {
  if (tokensUsed < threshold) {
    return { shouldCompress: false };
  }

  // Extract high-level facts from messages
  const summary = generateSessionSummary(messages);
  const archiveData = {
    timestamp: new Date().toISOString(),
    tokensUsed,
    messageCount: messages.length,
    summary,
  };

  return {
    shouldCompress: true,
    summary,
    archiveData,
    tokensRecovered: Math.round(tokensUsed * 0.8), // Estimate 80% recovery
  };
}

/**
 * Generate a summary from session messages
 * Extracts completed tasks, key decisions, current state, next steps
 * @param {array} messages - Session messages
 * @returns {string} - Compressed summary markdown
 */
function generateSessionSummary(messages) {
  const completed = [];
  const inProgress = [];
  const decisions = [];

  // Parse messages for task completion patterns
  messages.forEach((msg, idx) => {
    const content = msg.content || '';

    // Look for task completion patterns
    if (content.includes('completed') || content.includes('✓') || content.includes('DONE')) {
      const taskMatch = content.match(/TASK-\d+/g);
      if (taskMatch) {
        completed.push(...new Set(taskMatch));
      }
    }

    // Look for in-progress patterns
    if (content.includes('in_progress') || content.includes('starting')) {
      const taskMatch = content.match(/TASK-\d+/g);
      if (taskMatch) {
        inProgress.push(...new Set(taskMatch));
      }
    }

    // Look for architectural decisions
    if (content.includes('decision') || content.includes('Decision') || content.includes('DECISION')) {
      decisions.push(content.substring(0, 100) + '...');
    }
  });

  // Generate markdown summary
  let summary = '<summary>\n';
  summary += '**Completed Tasks:**\n';
  completed.forEach(task => {
    summary += `- ${task} ✓\n`;
  });

  if (inProgress.length > 0) {
    summary += '\n**In Progress:**\n';
    inProgress.forEach(task => {
      summary += `- ${task} (ongoing)\n`;
    });
  }

  if (decisions.length > 0) {
    summary += '\n**Key Decisions:**\n';
    decisions.slice(0, 3).forEach(decision => {
      summary += `- ${decision}\n`;
    });
  }

  summary += '\n**Next Steps:**\n';
  summary += '- Continue with next task from backlog\n';
  summary += '- Run full test suite before commit\n';
  summary += '</summary>\n';

  return summary;
}

/**
 * Check observations for escalation to ACTIVE_RULES
 * Observations with 5+ confirmations should become confirmed rules
 * @param {object} observations - OBSERVATIONS.md parsed data
 * @param {number} escalationThreshold - Confirmations needed (default 5)
 * @returns {object} - { toEscalate: [], toArchive: [] }
 */
export function checkObservationsForEscalation(observations, escalationThreshold = 5) {
  const toEscalate = [];
  const toArchive = [];

  observations.forEach(obs => {
    if (!obs.validationLog) {
      toArchive.push(obs);
      return;
    }

    const confirmationCount = obs.validationLog.filter(v => v.confirmed).length;

    if (confirmationCount >= escalationThreshold) {
      toEscalate.push({
        ...obs,
        confirmations: confirmationCount,
        action: 'escalate_to_rules',
      });
    }

    // Archive observations older than 4 weeks without escalation
    const createdDate = new Date(obs.dateCreated);
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

    if (createdDate < fourWeeksAgo && confirmationCount < escalationThreshold) {
      toArchive.push({
        ...obs,
        confirmations: confirmationCount,
        action: 'archive',
      });
    }
  });

  return { toEscalate, toArchive };
}

/**
 * Archive old completed tasks
 * Keep last N tasks in DONE.md, move older ones to TASK_ARCHIVE.md
 * @param {array} completedTasks - Tasks from DONE.md
 * @param {number} keepRecent - Number of recent tasks to keep (default 10)
 * @returns {object} - { toKeep: [], toArchive: [] }
 */
export function identifyTasksToArchive(completedTasks, keepRecent = 10) {
  if (completedTasks.length <= keepRecent) {
    return { toKeep: completedTasks, toArchive: [] };
  }

  // Sort by completion date (newest first)
  const sorted = [...completedTasks].sort((a, b) => {
    const dateA = new Date(a.completedDate || 0);
    const dateB = new Date(b.completedDate || 0);
    return dateB - dateA;
  });

  return {
    toKeep: sorted.slice(0, keepRecent),
    toArchive: sorted.slice(keepRecent),
  };
}

/**
 * Generate archive entry for a task (compressed format)
 * @param {object} task - Task object from DONE.md
 * @returns {string} - Single-line archive entry
 */
export function generateTaskArchiveEntry(task) {
  const date = task.completedDate ? task.completedDate.split('T')[0] : 'unknown';
  const outcome = task.status === 'completed' ? '✓' : '✗';
  const pattern = task.metadata?.pattern || 'general';

  return `| ${task.subject} | ${date} | ${outcome} | ${task.metadata?.filesCount || '?'} | ${task.metadata?.actualTokens || '?'}K | ${pattern} |`;
}

/**
 * Format observations for escalation to ACTIVE_RULES
 * @param {object} observation - Observation to escalate
 * @returns {string} - Formatted rule entry for ACTIVE_RULES.md
 */
export function formatObservationAsRule(observation) {
  const confirmations = observation.validationLog.length;
  const confidence = Math.min(100, Math.round((confirmations / 10) * 100));

  return `
## Rule #${Date.now()}: ${observation.title}
**Description:** ${observation.description}

**Confidence:** ${confidence}% (${confirmations} confirmations)
**Evidence:**
${observation.validationLog.map(v => `- ${v.date}: ${v.note}`).join('\n')}

**Applied since:** ${new Date().toISOString().split('T')[0]}
`;
}

/**
 * Generate monthly compaction report
 * @param {object} stats - Monthly statistics
 * @returns {string} - Markdown report
 */
export function generateCompactionReport(stats) {
  const savings = stats.tokensWithout - stats.tokensWith;
  const savingsPercent = Math.round((savings / stats.tokensWithout) * 100);

  return `
# Monthly Compaction Report - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}

## Sessions

- **Total sessions:** ${stats.sessionsProcessed}
- **Compactions triggered:** ${stats.compactionsTriggered}
- **Compaction rate:** ${Math.round((stats.compactionsTriggered / stats.sessionsProcessed) * 100)}%

## Context Compression

- **Tokens without compaction:** ${stats.tokensWithout.toLocaleString()}
- **Tokens with compaction:** ${stats.tokensWith.toLocaleString()}
- **Tokens recovered:** ${savings.toLocaleString()}
- **Compression ratio:** ${savingsPercent}%

## Memory Management

- **Observations escalated:** ${stats.observationsEscalated}
- **Observations archived:** ${stats.observationsArchived}
- **Tasks archived:** ${stats.tasksArchived}

## Cost Impact

- **Without compaction:** $${(stats.tokensWithout * 0.000003).toFixed(2)} (input) + $${(stats.tokensWithout * 0.000012).toFixed(2)} (output estimate)
- **With compaction:** $${(stats.tokensWith * 0.000003).toFixed(2)} (input) + $${(stats.tokensWith * 0.000012).toFixed(2)} (output estimate)
- **Monthly savings:** ~$${((savings * 0.000003) + (savings * 0.000012)).toFixed(2)}

## Recommendations

${stats.tokensWith > 150000 ? '- ⚠️ Current tokens still high. Consider lowering threshold to 80K.' : ''}
${stats.compactionsTriggered === 0 ? '- Sessions running well under threshold. Can handle longer tasks.' : ''}
${stats.observationsEscalated > 2 ? '- ✓ Strong pattern learning. Review new ACTIVE_RULES.' : ''}
`;
}

/**
 * Create archive index entry
 * @param {object} session - Session data
 * @returns {string} - Archive index entry (markdown)
 */
export function createArchiveIndexEntry(session) {
  const duration = session.duration ? `${session.duration} hours` : 'unknown';
  const tasksCompleted = session.tasksCompleted ? session.tasksCompleted.length : 0;

  return `
## Session [${session.timestamp}]
**Duration:** ${duration} | **Tokens:** ${session.tokensUsed.toLocaleString()} | **Tasks:** ${tasksCompleted}

\`\`\`
${session.summary}
\`\`\`

**Original transcript:** ${session.archivePath}
`;
}

export default {
  checkSessionCompaction,
  generateSessionSummary,
  checkObservationsForEscalation,
  identifyTasksToArchive,
  generateTaskArchiveEntry,
  formatObservationAsRule,
  generateCompactionReport,
  createArchiveIndexEntry,
};
