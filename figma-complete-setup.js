// ScamGuard Design System - COMPLETE SETUP (MD3)
// Creates full Material Design 3 system with components, variants, sizes, and states

console.log('🚀 Starting complete MD3 setup...\n');

// ==================== CREATE PAGES ====================
console.log('📄 Creating pages...');

const pageNames = ['Colors', 'Typography', 'Layout', 'Components', 'ScamGuard Specific', 'Documentation'];
const pages = {};

// Get or create pages
for (const pageName of pageNames) {
  // Try to find existing page
  let page = figma.root.children.find(p => p.name === pageName);

  if (!page) {
    // Create new page
    page = figma.createPage();
    page.name = pageName;
  }
  pages[pageName] = page;
  console.log(`  ✅ ${pageName}`);
}

// ==================== CREATE COLOR TOKENS ====================
console.log('\n🎨 Creating MD3 color tokens...');

const colors = {
  // Primary (Bleu Gardien)
  'color-primary': { hex: '#005FAF', r: 0/255, g: 95/255, b: 175/255 },
  'color-on-primary': { hex: '#FFFFFF', r: 255/255, g: 255/255, b: 255/255 },
  'color-primary-container': { hex: '#D6E4FF', r: 214/255, g: 228/255, b: 255/255 },
  'color-on-primary-container': { hex: '#001849', r: 0/255, g: 24/255, b: 73/255 },

  // Secondary (Vert Sécurité)
  'color-secondary': { hex: '#1B6B3A', r: 27/255, g: 107/255, b: 58/255 },
  'color-on-secondary': { hex: '#FFFFFF', r: 255/255, g: 255/255, b: 255/255 },
  'color-secondary-container': { hex: '#D5EDDC', r: 213/255, g: 237/255, b: 220/255 },
  'color-on-secondary-container': { hex: '#002312', r: 0/255, g: 35/255, b: 18/255 },

  // Tertiary (Ambre Alerte)
  'color-tertiary': { hex: '#7A5900', r: 122/255, g: 89/255, b: 0/255 },
  'color-on-tertiary': { hex: '#FFFFFF', r: 255/255, g: 255/255, b: 255/255 },
  'color-tertiary-container': { hex: '#FFDDB8', r: 255/255, g: 221/255, b: 184/255 },
  'color-on-tertiary-container': { hex: '#271900', r: 39/255, g: 25/255, b: 0/255 },

  // Error (Rouge Danger)
  'color-error': { hex: '#BA1A1A', r: 186/255, g: 26/255, b: 26/255 },
  'color-on-error': { hex: '#FFFFFF', r: 255/255, g: 255/255, b: 255/255 },
  'color-error-container': { hex: '#F9DEDC', r: 249/255, g: 222/255, b: 220/255 },
  'color-on-error-container': { hex: '#410E0B', r: 65/255, g: 14/255, b: 11/255 },

  // Neutral
  'color-background': { hex: '#FAFCFF', r: 250/255, g: 252/255, b: 255/255 },
  'color-on-background': { hex: '#1A1C22', r: 26/255, g: 28/255, b: 34/255 },
  'color-surface': { hex: '#FAFCFF', r: 250/255, g: 252/255, b: 255/255 },
  'color-on-surface': { hex: '#1A1C22', r: 26/255, g: 28/255, b: 34/255 },
  'color-surface-variant': { hex: '#DFE2EB', r: 223/255, g: 226/255, b: 235/255 },
  'color-on-surface-variant': { hex: '#49454E', r: 73/255, g: 69/255, b: 78/255 },
  'color-outline': { hex: '#72788E', r: 114/255, g: 120/255, b: 142/255 },
  'color-outline-variant': { hex: '#C4C7C5', r: 196/255, g: 199/255, b: 197/255 },
};

const colorsPage = pages['Colors'];
let yOffset = 0;

for (const [tokenName, colorData] of Object.entries(colors)) {
  const rect = figma.createRectangle();
  rect.name = tokenName;
  rect.resize(120, 80);
  rect.fills = [{ type: 'SOLID', color: { r: colorData.r, g: colorData.g, b: colorData.b } }];
  rect.y = yOffset;
  colorsPage.appendChild(rect);

  // Add text label
  const text = figma.createText();
  text.characters = tokenName;
  text.fontSize = 11;
  text.y = yOffset + 85;
  colorsPage.appendChild(text);

  yOffset += 120;
}
console.log(`  ✅ ${Object.keys(colors).length} color tokens created`);

// ==================== CREATE BASE COMPONENTS ====================
console.log('\n🔧 Creating MD3 base components with variants and sizes...');

const componentsPage = pages['Components'];
let yOffset = 0;

// Helper: Create button with proper MD3 styling
function createButton(name, fillColor, width = 200, height = 56) {
  const button = figma.createComponent();
  button.name = name;
  button.resize(width, height);
  button.cornerRadius = 8;
  button.fills = [{ type: 'SOLID', color: fillColor }];
  return button;
}

// BUTTONS - Create all variants and sizes
const buttonVariants = [
  { name: 'Button / Primary', color: { r: 0/255, g: 95/255, b: 175/255 } },
  { name: 'Button / Secondary', color: { r: 27/255, g: 107/255, b: 58/255 } },
  { name: 'Button / Tertiary', color: { r: 122/255, g: 89/255, b: 0/255 } },
  { name: 'Button / Destructive', color: { r: 186/255, g: 26/255, b: 26/255 } },
];

const buttonSizes = [
  { name: 'Small', height: 40 },
  { name: 'Medium', height: 48 },
  { name: 'Large', height: 56 },
];

console.log('  📌 Creating Button variants...');
for (const variant of buttonVariants) {
  for (const size of buttonSizes) {
    const button = createButton(
      `${variant.name} / ${size.name}`,
      variant.color,
      200,
      size.height
    );
    button.y = yOffset;
    componentsPage.appendChild(button);
    yOffset += size.height + 20;
  }
  yOffset += 40; // Extra spacing between variants
}
console.log('  ✅ Buttons (4 variants × 3 sizes = 12 components)');

// INPUT
console.log('  📌 Creating Input variants...');
const inputTypes = ['Text', 'Email', 'Password', 'Number'];
for (const type of inputTypes) {
  const input = figma.createComponent();
  input.name = `Input / ${type}`;
  input.resize(300, 48);
  input.cornerRadius = 4;
  input.fills = [{ type: 'SOLID', color: { r: 250/255, g: 252/255, b: 255/255 } }];
  input.strokes = [{ type: 'SOLID', color: { r: 114/255, g: 120/255, b: 142/255 } }];
  input.strokeWeight = 2;
  input.y = yOffset;
  componentsPage.appendChild(input);
  yOffset += 80;
}
console.log('  ✅ Inputs (4 types)');

// CARD
console.log('  📌 Creating Card variants...');
const cardVariants = [
  { name: 'Card / Outlined', stroke: true },
  { name: 'Card / Elevated', stroke: false },
];
for (const variant of cardVariants) {
  const card = figma.createComponent();
  card.name = variant.name;
  card.resize(300, 200);
  card.cornerRadius = 12;
  card.fills = [{ type: 'SOLID', color: { r: 250/255, g: 252/255, b: 255/255 } }];
  if (variant.stroke) {
    card.strokes = [{ type: 'SOLID', color: { r: 196/255, g: 199/255, b: 197/255 } }];
    card.strokeWeight = 1;
  }
  card.y = yOffset;
  componentsPage.appendChild(card);
  yOffset += 240;
}
console.log('  ✅ Cards (2 variants)');

// BADGE
console.log('  📌 Creating Badge variants...');
const badgeVariants = [
  { name: 'Badge / Filled', color: { r: 27/255, g: 107/255, b: 58/255 } },
  { name: 'Badge / Outlined', color: { r: 27/255, g: 107/255, b: 58/255 } },
];
for (const variant of badgeVariants) {
  const badge = figma.createComponent();
  badge.name = variant.name;
  badge.resize(32, 20);
  badge.cornerRadius = 16;
  badge.fills = [{ type: 'SOLID', color: variant.color }];
  badge.y = yOffset;
  componentsPage.appendChild(badge);
  yOffset += 60;
}
console.log('  ✅ Badges (2 variants)');

// DIALOG
console.log('  📌 Creating Dialog component...');
const dialog = figma.createComponent();
dialog.name = 'Dialog / Default';
dialog.resize(400, 300);
dialog.cornerRadius = 12;
dialog.fills = [{ type: 'SOLID', color: { r: 250/255, g: 252/255, b: 255/255 } }];
dialog.y = yOffset;
componentsPage.appendChild(dialog);
yOffset += 340;
console.log('  ✅ Dialog');

// ==================== CREATE SCAMGUARD COMPONENTS ====================
console.log('\n🎨 Creating ScamGuard-specific components...');

const scamguardPage = pages['ScamGuard Specific'];
yOffset = 0;

// Risk Score - Create all risk levels
const riskLevels = [
  { name: 'Safe', color: { r: 27/255, g: 107/255, b: 58/255 } },
  { name: 'Moderate', color: { r: 122/255, g: 89/255, b: 0/255 } },
  { name: 'Danger', color: { r: 186/255, g: 26/255, b: 26/255 } },
];

console.log('  📌 Creating Risk Score variants...');
for (const level of riskLevels) {
  const riskScore = figma.createComponent();
  riskScore.name = `Risk Score / ${level.name}`;
  riskScore.resize(180, 200);
  riskScore.layoutMode = 'VERTICAL';
  riskScore.itemSpacing = 12;
  riskScore.primaryAxisAlignItems = 'CENTER';
  riskScore.y = yOffset;
  scamguardPage.appendChild(riskScore);

  const circle = figma.createEllipse();
  circle.resize(120, 120);
  circle.fills = [{ type: 'SOLID', color: level.color }];
  riskScore.appendChild(circle);

  yOffset += 250;
}
console.log('  ✅ Risk Score (3 levels: Safe, Moderate, Danger)');

// Threat Card - Create variants by severity
const threatSeverities = [
  { name: 'Low', color: { r: 122/255, g: 89/255, b: 0/255 } },
  { name: 'Medium', color: { r: 255/255, g: 136/255, b: 0/255 } },
  { name: 'Danger', color: { r: 186/255, g: 26/255, b: 26/255 } },
];

console.log('  📌 Creating Threat Card variants...');
for (const severity of threatSeverities) {
  const threatCard = figma.createComponent();
  threatCard.name = `Threat Card / ${severity.name}`;
  threatCard.resize(320, 120);
  threatCard.layoutMode = 'HORIZONTAL';
  threatCard.itemSpacing = 16;
  threatCard.paddingLeft = 16;
  threatCard.paddingRight = 16;
  threatCard.paddingTop = 12;
  threatCard.paddingBottom = 12;
  threatCard.fills = [{ type: 'SOLID', color: { r: 222/255, g: 226/255, b: 235/255 } }];
  threatCard.cornerRadius = 12;
  threatCard.y = yOffset;
  scamguardPage.appendChild(threatCard);

  const border = figma.createRectangle();
  border.resize(4, 120);
  border.fills = [{ type: 'SOLID', color: severity.color }];
  threatCard.appendChild(border);

  yOffset += 170;
}
console.log('  ✅ Threat Cards (3 severity levels)');

// Security Heart - All status levels
const heartStatuses = [
  { name: 'Safe', color: { r: 27/255, g: 107/255, b: 58/255 } },
  { name: 'Moderate', color: { r: 122/255, g: 89/255, b: 0/255 } },
  { name: 'Danger', color: { r: 186/255, g: 26/255, b: 26/255 } },
];

console.log('  📌 Creating Security Heart variants...');
for (const status of heartStatuses) {
  const heart = figma.createComponent();
  heart.name = `Security Heart / ${status.name}`;
  heart.resize(120, 120);
  heart.layoutMode = 'VERTICAL';
  heart.primaryAxisAlignItems = 'CENTER';
  heart.fills = [{ type: 'SOLID', color: status.color }];
  heart.y = yOffset;
  scamguardPage.appendChild(heart);
  yOffset += 170;
}
console.log('  ✅ Security Hearts (3 status levels)');

// SMS Message - Variants for different verdicts
const smsVerdicts = [
  { name: 'Scam', bgColor: { r: 249/255, g: 222/255, b: 220/255 } },
  { name: 'Legitimate', bgColor: { r: 213/255, g: 237/255, b: 220/255 } },
  { name: 'Suspicious', bgColor: { r: 255/255, g: 229/255, b: 153/255 } },
];

console.log('  📌 Creating SMS Message variants...');
for (const verdict of smsVerdicts) {
  const sms = figma.createComponent();
  sms.name = `SMS Message / ${verdict.name}`;
  sms.resize(300, 100);
  sms.layoutMode = 'VERTICAL';
  sms.itemSpacing = 12;
  sms.paddingLeft = 12;
  sms.paddingRight = 12;
  sms.paddingTop = 12;
  sms.paddingBottom = 12;
  sms.fills = [{ type: 'SOLID', color: verdict.bgColor }];
  sms.cornerRadius = 12;
  sms.y = yOffset;
  scamguardPage.appendChild(sms);
  yOffset += 150;
}
console.log('  ✅ SMS Messages (3 verdicts: Scam, Legitimate, Suspicious)');

// Quiz Card
console.log('  📌 Creating Quiz Card component...');
const quiz = figma.createComponent();
quiz.name = 'Quiz Card / Question';
quiz.resize(360, 280);
quiz.layoutMode = 'VERTICAL';
quiz.itemSpacing = 16;
quiz.paddingLeft = 20;
quiz.paddingRight = 20;
quiz.paddingTop = 20;
quiz.paddingBottom = 20;
quiz.fills = [{ type: 'SOLID', color: { r: 250/255, g: 252/255, b: 255/255 } }];
quiz.cornerRadius = 12;
quiz.strokes = [{ type: 'SOLID', color: { r: 196/255, g: 199/255, b: 197/255 } }];
quiz.strokeWeight = 1;
quiz.y = yOffset;
scamguardPage.appendChild(quiz);
console.log('  ✅ Quiz Card');


// ==================== FINAL MESSAGE ====================
console.log('\n' + '='.repeat(60));
console.log('🎉 MATERIAL DESIGN 3 SETUP COMPLETE!');
console.log('='.repeat(60));
console.log('\n📊 Created:');
console.log('  ✅ 6 Pages (Colors, Typography, Layout, Components, ScamGuard, Docs)');
console.log('  ✅ 24 Color Tokens (full MD3 palette with On & Container variants)');
console.log('\n🎯 Components:');
console.log('  📦 Buttons: 4 variants × 3 sizes = 12 components');
console.log('  📦 Inputs: 4 types (Text, Email, Password, Number)');
console.log('  📦 Cards: 2 variants (Outlined, Elevated)');
console.log('  📦 Badges: 2 variants (Filled, Outlined)');
console.log('  📦 Dialog: 1 component');
console.log('  📦 ScamGuard Risk Scores: 3 levels (Safe, Moderate, Danger)');
console.log('  📦 ScamGuard Threat Cards: 3 severity levels');
console.log('  📦 ScamGuard Security Hearts: 3 status levels');
console.log('  📦 ScamGuard SMS Messages: 3 verdicts (Scam, Legitimate, Suspicious)');
console.log('  📦 ScamGuard Quiz Cards: 1 component');
console.log('\n📈 Total: 34 components');
console.log('\n🎯 Next steps:');
console.log('  1. Run figma-apply-variables.js to bind tokens');
console.log('  2. Run figma-create-variants.js for state variants (hover, active, disabled)');
console.log('  3. Add typography styles in Typography page');
console.log('  4. Document component usage in Documentation page');
console.log('\n✨ Your MD3 design system is READY!');
