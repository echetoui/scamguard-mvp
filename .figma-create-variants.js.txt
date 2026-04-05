/**
 * ScamGuard Design System - Create State Variants
 * Creates hover, active, disabled states for all components
 * Run this in Figma Console (Cmd+Option+I on Mac)
 */

async function createVariants() {
  console.log('🎭 Creating state variants for all components...\n');

  try {
    const page = figma.currentPage;
    let variantCount = 0;

    // Helper: Lighten color (for hover state)
    function lightenColor(color, amount = 0.15) {
      return {
        r: Math.min(1, color.r + amount),
        g: Math.min(1, color.g + amount),
        b: Math.min(1, color.b + amount),
      };
    }

    // Helper: Darken color (for active state)
    function darkenColor(color, amount = 0.1) {
      return {
        r: Math.max(0, color.r - amount),
        g: Math.max(0, color.g - amount),
        b: Math.max(0, color.b - amount),
      };
    }

    // Helper: Convert to grayscale (for disabled state)
    function desaturate(color) {
      const gray = (color.r + color.g + color.b) / 3;
      return { r: gray, g: gray, b: gray };
    }

    // Helper: Clone and create state variant
    function createStateVariant(baseComponent, state, modifyColor) {
      const variant = baseComponent.clone();
      const baseName = baseComponent.name;
      variant.name = `${baseName} : state=${state}`;

      if (modifyColor && baseComponent.fills && baseComponent.fills.length > 0) {
        const baseFill = baseComponent.fills[0];
        if (baseFill.type === 'SOLID' && baseFill.color) {
          variant.fills = [{
            type: 'SOLID',
            color: modifyColor(baseFill.color),
          }];
        }
      }

      if (state === 'disabled') {
        variant.opacity = 0.5;
      } else if (state === 'hover') {
        variant.opacity = 0.95;
      }

      return variant;
    }

    // Find and process all components
    function processAllComponents(node) {
      if (node.type === 'COMPONENT') {
        try {
          const baseName = node.name;

          // Skip components that already have state variants
          if (baseName.includes('state=')) {
            return;
          }

          // Determine what color modifications to apply
          let shouldModifyColor = true;

          // Skip color modification for input-like components
          if (baseName.includes('Input') || baseName.includes('Dialog')) {
            shouldModifyColor = false;
          }

          console.log(`📌 ${baseName}`);

          // CREATE HOVER VARIANT
          try {
            const hoverVariant = createStateVariant(
              node,
              'hover',
              shouldModifyColor ? lightenColor : null
            );
            page.appendChild(hoverVariant);
            console.log(`  ✅ Hover variant created`);
            variantCount++;
          } catch (e) {
            console.log(`  ⚠️ Hover failed: ${e.message}`);
          }

          // CREATE ACTIVE VARIANT
          try {
            const activeVariant = createStateVariant(
              node,
              'active',
              shouldModifyColor ? darkenColor : null
            );
            page.appendChild(activeVariant);
            console.log(`  ✅ Active variant created`);
            variantCount++;
          } catch (e) {
            console.log(`  ⚠️ Active failed: ${e.message}`);
          }

          // CREATE DISABLED VARIANT
          try {
            const disabledVariant = createStateVariant(
              node,
              'disabled',
              shouldModifyColor ? desaturate : null
            );
            page.appendChild(disabledVariant);
            console.log(`  ✅ Disabled variant created`);
            variantCount++;
          } catch (e) {
            console.log(`  ⚠️ Disabled failed: ${e.message}`);
          }
        } catch (e) {
          console.log(`⚠️ Error processing ${node.name}: ${e.message}`);
        }
      }

      // Recursively process children
      if (node.children) {
        for (const child of node.children) {
          processAllComponents(child);
        }
      }
    }

    // Start processing from current page
    processAllComponents(page);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 VARIANTS CREATED!');
    console.log('='.repeat(60));
    console.log(`✅ ${variantCount} state variants added`);
    console.log('\n📊 Variants created for each component:');
    console.log('   • state=hover (lighter, opacity 0.95)');
    console.log('   • state=active (darker)');
    console.log('   • state=disabled (grayscale, opacity 0.5)');
    console.log('\n💡 Naming convention: ComponentName : state=hover');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run it
createVariants();
