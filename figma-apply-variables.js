/**
 * ScamGuard Design System - Apply Color Variables
 *
 * Applies MD3 color variables to all components
 * Run this in Figma Console (Cmd+Option+I on Mac)
 */

async function applyVariables() {
  console.log('🎨 Applying MD3 variables to all components...\n');

  try {
    // Get all local variables
    const variables = await figma.variables.getLocalVariablesAsync();

    // Create a map for easy lookup
    const varMap = {};
    for (const variable of variables) {
      varMap[variable.name] = variable;
    }

    console.log(`Found ${variables.length} variables\n`);

    // Find all components
    const root = figma.root;
    let componentCount = 0;

    function processNode(node) {
      if (node.type === 'COMPONENT') {
        // Skip state variants (already processed)
        if (node.name.includes('state=')) {
          return;
        }

        const name = node.name;
        let applied = false;

        try {
          // ===== BUTTONS =====
          if (name.includes('Button / Primary')) {
            if (varMap['color-primary']) {
              node.setBoundVariable('fills', 0, varMap['color-primary']);
              console.log(`✅ ${name} → color-primary`);
              applied = true;
            }
          }
          else if (name.includes('Button / Secondary')) {
            if (varMap['color-secondary']) {
              node.setBoundVariable('fills', 0, varMap['color-secondary']);
              console.log(`✅ ${name} → color-secondary`);
              applied = true;
            }
          }
          else if (name.includes('Button / Tertiary')) {
            if (varMap['color-tertiary']) {
              node.setBoundVariable('fills', 0, varMap['color-tertiary']);
              console.log(`✅ ${name} → color-tertiary`);
              applied = true;
            }
          }
          else if (name.includes('Button / Destructive')) {
            if (varMap['color-error']) {
              node.setBoundVariable('fills', 0, varMap['color-error']);
              console.log(`✅ ${name} → color-error`);
              applied = true;
            }
          }

          // ===== INPUTS =====
          else if (name.includes('Input /')) {
            if (varMap['color-outline']) {
              node.setBoundVariable('strokes', 0, varMap['color-outline']);
              console.log(`✅ ${name} → color-outline (stroke)`);
              applied = true;
            }
          }

          // ===== CARDS =====
          else if (name.includes('Card / Outlined')) {
            if (varMap['color-surface']) {
              node.setBoundVariable('fills', 0, varMap['color-surface']);
            }
            if (varMap['color-outline']) {
              node.setBoundVariable('strokes', 0, varMap['color-outline']);
            }
            console.log(`✅ ${name} → color-surface (fill) + color-outline (stroke)`);
            applied = true;
          }
          else if (name.includes('Card / Elevated')) {
            if (varMap['color-surface']) {
              node.setBoundVariable('fills', 0, varMap['color-surface']);
            }
            console.log(`✅ ${name} → color-surface`);
            applied = true;
          }

          // ===== BADGES =====
          else if (name.includes('Badge / Filled')) {
            if (varMap['color-secondary']) {
              node.setBoundVariable('fills', 0, varMap['color-secondary']);
              console.log(`✅ ${name} → color-secondary`);
              applied = true;
            }
          }
          else if (name.includes('Badge / Outlined')) {
            if (varMap['color-outline']) {
              node.setBoundVariable('strokes', 0, varMap['color-outline']);
              console.log(`✅ ${name} → color-outline (stroke)`);
              applied = true;
            }
          }

          // ===== DIALOG =====
          else if (name.includes('Dialog /')) {
            if (varMap['color-surface']) {
              node.setBoundVariable('fills', 0, varMap['color-surface']);
              console.log(`✅ ${name} → color-surface`);
              applied = true;
            }
          }

          // ===== RISK SCORES =====
          else if (name.includes('Risk Score / Safe')) {
            if (node.children && node.children[0] && varMap['color-secondary']) {
              node.children[0].setBoundVariable('fills', 0, varMap['color-secondary']);
              console.log(`✅ ${name} → color-secondary (circle)`);
              applied = true;
            }
          }
          else if (name.includes('Risk Score / Moderate')) {
            if (node.children && node.children[0] && varMap['color-tertiary']) {
              node.children[0].setBoundVariable('fills', 0, varMap['color-tertiary']);
              console.log(`✅ ${name} → color-tertiary (circle)`);
              applied = true;
            }
          }
          else if (name.includes('Risk Score / Danger')) {
            if (node.children && node.children[0] && varMap['color-error']) {
              node.children[0].setBoundVariable('fills', 0, varMap['color-error']);
              console.log(`✅ ${name} → color-error (circle)`);
              applied = true;
            }
          }

          // ===== THREAT CARDS =====
          else if (name.includes('Threat Card /')) {
            if (varMap['color-surface-variant']) {
              node.setBoundVariable('fills', 0, varMap['color-surface-variant']);
            }
            // Apply border color based on severity
            if (node.children && node.children[0]) {
              if (name.includes('Low') && varMap['color-tertiary']) {
                node.children[0].setBoundVariable('fills', 0, varMap['color-tertiary']);
              } else if (name.includes('Medium') && varMap['color-tertiary']) {
                node.children[0].setBoundVariable('fills', 0, varMap['color-tertiary']);
              } else if (name.includes('Danger') && varMap['color-error']) {
                node.children[0].setBoundVariable('fills', 0, varMap['color-error']);
              }
            }
            console.log(`✅ ${name} → color-surface-variant (bg) + severity color (border)`);
            applied = true;
          }

          // ===== SECURITY HEARTS =====
          else if (name.includes('Security Heart /')) {
            if (name.includes('Safe') && varMap['color-secondary']) {
              node.setBoundVariable('fills', 0, varMap['color-secondary']);
              console.log(`✅ ${name} → color-secondary`);
              applied = true;
            } else if (name.includes('Moderate') && varMap['color-tertiary']) {
              node.setBoundVariable('fills', 0, varMap['color-tertiary']);
              console.log(`✅ ${name} → color-tertiary`);
              applied = true;
            } else if (name.includes('Danger') && varMap['color-error']) {
              node.setBoundVariable('fills', 0, varMap['color-error']);
              console.log(`✅ ${name} → color-error`);
              applied = true;
            }
          }

          // ===== SMS MESSAGES =====
          else if (name.includes('SMS Message /')) {
            if (name.includes('Scam') && varMap['color-error-container']) {
              node.setBoundVariable('fills', 0, varMap['color-error-container']);
              console.log(`✅ ${name} → color-error-container`);
              applied = true;
            } else if (name.includes('Legitimate') && varMap['color-secondary-container']) {
              node.setBoundVariable('fills', 0, varMap['color-secondary-container']);
              console.log(`✅ ${name} → color-secondary-container`);
              applied = true;
            } else if (name.includes('Suspicious') && varMap['color-tertiary-container']) {
              node.setBoundVariable('fills', 0, varMap['color-tertiary-container']);
              console.log(`✅ ${name} → color-tertiary-container`);
              applied = true;
            }
          }

          // ===== QUIZ CARDS =====
          else if (name.includes('Quiz Card /')) {
            if (varMap['color-surface']) {
              node.setBoundVariable('fills', 0, varMap['color-surface']);
            }
            if (varMap['color-outline']) {
              node.setBoundVariable('strokes', 0, varMap['color-outline']);
            }
            console.log(`✅ ${name} → color-surface (fill) + color-outline (stroke)`);
            applied = true;
          }

          if (applied) {
            componentCount++;
          }
        } catch (e) {
          console.log(`⚠️ ${name}: ${e.message}`);
        }
      }

      // Recursively process children
      if (node.children) {
        for (const child of node.children) {
          processNode(child);
        }
      }
    }

    // Start processing from root
    processNode(root);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 VARIABLES APPLIED!');
    console.log('='.repeat(60));
    console.log(`✅ ${componentCount} components updated with MD3 variables`);
    console.log('\n💡 All components now use design variables');
    console.log('   Colors will update globally when you change variables!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run it
applyVariables();
