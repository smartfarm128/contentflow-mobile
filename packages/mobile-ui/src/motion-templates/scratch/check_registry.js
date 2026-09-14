const fs = require('fs');
const path = require('path');

const templatesDir = '/Users/paulfunchious/contentflow/apps/web/src/motion-templates/templates';
const registryPath = '/Users/paulfunchious/contentflow/apps/web/src/motion-templates/registry.ts';

// 1. Read registry.ts and parse imports and template configs
const registryContent = fs.readFileSync(registryPath, 'utf8');

// Parse imports: e.g. import { TextScrambleTemplate } from "./templates/TextScramble";
const importRegex = /import\s+\{\s*(\w+)\s*\}\s+from\s+["']\.\/templates\/(\w+)["']/g;
const componentToFile = {};
let match;
while ((match = importRegex.exec(registryContent)) !== null) {
  componentToFile[match[1]] = match[2] + '.tsx';
}

console.log('Import mappings count:', Object.keys(componentToFile).length);

// Let's parse HTML_TEMPLATES array by finding each template block.
// A template block starts with:
//   {
//     id: "html-..."
//     ...
//     Component: ...
//   }
// We will split the file by the starting `{` of each template and parse it.
const templates = [];
const blocks = registryContent.split(/^\s*\{\s*$/m);

for (let block of blocks) {
  if (!block.includes('id:') || !block.includes('Component:')) continue;

  const idMatch = block.match(/id:\s*["'](html-[\w-]+)["']/);
  const componentMatch = block.match(/Component:\s*(\w+)/);
  if (!idMatch || !componentMatch) continue;

  const id = idMatch[1];
  const componentName = componentMatch[1];

  // Parse controls array
  const controls = [];
  const controlsStart = block.indexOf('controls: [');
  if (controlsStart !== -1) {
    let bracketCount = 1;
    let index = controlsStart + 'controls: ['.length;
    let controlsText = '';
    while (bracketCount > 0 && index < block.length) {
      const char = block[index];
      if (char === '[') bracketCount++;
      else if (char === ']') bracketCount--;
      if (bracketCount > 0) controlsText += char;
      index++;
    }

    // Now split controlsText by '{' to find individual controls
    const controlObjects = controlsText.split(/\{\s*/);
    for (let ctrlStr of controlObjects) {
      if (!ctrlStr.includes('id:')) continue;
      
      const ctrlIdMatch = ctrlStr.match(/id:\s*["'](\w+)["']/);
      const ctrlTypeMatch = ctrlStr.match(/type:\s*["'](\w+)["']/);
      
      // Parse defaultValue (could be string, number, boolean)
      let defaultValue = null;
      const defValStringMatch = ctrlStr.match(/defaultValue:\s*["']([^"']*)["']/);
      const defValNumMatch = ctrlStr.match(/defaultValue:\s*([0-9\.-]+)\b/);
      const defValBoolMatch = ctrlStr.match(/defaultValue:\s*(true|false)\b/);

      if (defValStringMatch) defaultValue = defValStringMatch[1];
      else if (defValNumMatch) defaultValue = parseFloat(defValNumMatch[1]);
      else if (defValBoolMatch) defaultValue = defValBoolMatch[1] === 'true';

      if (ctrlIdMatch && ctrlTypeMatch) {
        controls.push({
          id: ctrlIdMatch[1],
          type: ctrlTypeMatch[1],
          defaultValue
        });
      }
    }
  }

  templates.push({
    id,
    componentName,
    fileName: componentToFile[componentName],
    controls
  });
}

console.log('Parsed templates count:', templates.length);

let report = '';
templates.forEach(template => {
  if (!template.fileName) return;
  if (template.id === 'html-globe' || template.fileName === 'Globe.tsx') return; // Skip Batch 12

  const filePath = path.join(templatesDir, template.fileName);
  if (!fs.existsSync(filePath)) {
    report += `ERROR: File ${template.fileName} does not exist for template ${template.id}\n`;
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Extract all property reads from values
  const valuesProps = new Set();
  
  // values.propName or values?.propName
  const dotPropRegex = /values(?:\?\.)?([a-zA-Z_]\w*)/g;
  let propMatch;
  while ((propMatch = dotPropRegex.exec(fileContent)) !== null) {
    const name = propMatch[1];
    if (name !== 'map' && name !== 'filter' && name !== 'forEach' && name !== 'find' && name !== 'length') {
      valuesProps.add(name);
    }
  }

  // values["propName"] or values['propName']
  const bracketPropRegex = /values\s*\[\s*["']([^"']+)["']\s*\]/g;
  while ((propMatch = bracketPropRegex.exec(fileContent)) !== null) {
    valuesProps.add(propMatch[1]);
  }

  const controlMap = new Map();
  template.controls.forEach(c => controlMap.set(c.id, c));

  const missingControls = [];
  const mismatchedTypes = [];

  valuesProps.forEach(prop => {
    if (!controlMap.has(prop)) {
      missingControls.push(prop);
    } else {
      const ctrl = controlMap.get(prop);
      // Check if this property looks like an image or video but is not typed as 'image'
      const escapedProp = prop.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      
      const imageUsageRegex = new RegExp(`src\\s*=\\s*\\{\\s*(?:values\\.)?${escapedProp}\\s*\\}|background(?:Image)?\\s*:\\s*.*${escapedProp}|url\\(\\s*\\$?${escapedProp}|image\\s*:\\s*(?:values\\.)?${escapedProp}`, 'i');
      const isUsedAsImage = imageUsageRegex.test(fileContent) || 
                            prop.toLowerCase().includes('image') || 
                            prop.toLowerCase().includes('logo') || 
                            prop.toLowerCase().includes('avatar') || 
                            prop.toLowerCase().includes('icon') || 
                            prop.toLowerCase().includes('banner') || 
                            prop.toLowerCase().includes('pic') || 
                            prop.toLowerCase().includes('photo') || 
                            prop.toLowerCase().includes('poster');
      const isUsedAsVideo = prop.toLowerCase().includes('video') || prop.toLowerCase().includes('movie') || prop.toLowerCase().includes('media');

      // Note: We use 'image' control type for both images and video files because they are uploaded via media library
      if ((isUsedAsImage || isUsedAsVideo) && ctrl.type !== 'image' && ctrl.type !== 'select') {
        mismatchedTypes.push({ prop, expected: 'image', actual: ctrl.type });
      }
    }
  });

  // Check for any hardcoded unsplash or pexels/ufs.sh/vercel-storage URLs in the TSX file
  // that do not match the defaultValue of ANY image control in registry.ts
  const urlsInFile = [...fileContent.matchAll(/https?:\/\/[^\s'"]+/g)]
    .map(m => m[0].replace(/[',"\)]+$/, '').replace(/\\/g, ''))
    .filter(u => u.includes('unsplash') || u.includes('pexels') || u.includes('ufs.sh') || u.includes('vercel-storage') || u.includes('shadcnblocks'));

  const unexposedUrls = urlsInFile.filter(url => {
    // If this URL is in the file but not as a default value of a control, it might be hardcoded
    return !template.controls.some(ctrl => {
      if (ctrl.type !== 'image' && ctrl.type !== 'text') return false;
      if (typeof ctrl.defaultValue !== 'string') return false;
      // Clean URLs for comparison
      const cleanCtrlVal = ctrl.defaultValue.split('?')[0];
      const cleanUrl = url.split('?')[0];
      return cleanCtrlVal === cleanUrl;
    });
  });

  if (missingControls.length > 0 || mismatchedTypes.length > 0 || unexposedUrls.length > 0) {
    report += `\n=== ${template.id} (${template.fileName}) ===\n`;
    if (missingControls.length > 0) {
      report += `  Missing controls in registry.ts: ${JSON.stringify(missingControls)}\n`;
    }
    if (mismatchedTypes.length > 0) {
      report += `  Mismatched Types (should be image): ${JSON.stringify(mismatchedTypes)}\n`;
    }
    if (unexposedUrls.length > 0) {
      report += `  Unexposed/Hardcoded URLs in TSX: ${JSON.stringify([...new Set(unexposedUrls)])}\n`;
    }
  }
});

fs.writeFileSync('/Users/paulfunchious/.gemini/antigravity-ide/brain/dacd2845-03df-4387-9d4f-3c57b5b47ff1/scratch/registry_audit.txt', report, 'utf8');
console.log('Done! Audit report written to registry_audit.txt');
