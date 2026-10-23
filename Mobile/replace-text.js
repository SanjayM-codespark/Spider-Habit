const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx') && file !== 'CustomText.tsx' && file !== 'AppText.tsx') {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = walkSync('src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Replace one-line import
  if (content.match(/import\s+{[^}]*\bText\b[^}]*}\s+from\s+['"]react-native['"]/)) {
    content = content.replace(/import\s+{([^}]*)\bText\b([^}]*)}\s+from\s+['"]react-native['"]/, (match, p1, p2) => {
      let newImports = (p1 + p2).split(',').map(s => s.trim()).filter(s => s.length > 0).join(', ');
      if (newImports.length > 0) {
        return "import { " + newImports + " } from 'react-native';";
      } else {
        return "";
      }
    });
    const depth = file.split(path.sep).length - 2;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    content = "import CustomText from '" + prefix + "components/CustomText';\n" + content;
    changed = true;
  }
  // 2. Handle multi-line import
  else if (content.match(/import\s+{[\s\S]*?\bText\b[\s\S]*?}\s+from\s+['"]react-native['"]/)) {
    content = content.replace(/(import\s+{[\s\S]*?)\bText\b,?([\s\S]*?}\s+from\s+['"]react-native['"])/, "$1$2");
    // Clean up empty lines inside the import block
    content = content.replace(/import\s+{[\s\n]*}\s+from\s+['"]react-native['"];?/, "");
    
    // Add CustomText import only if not already there
    if (!content.includes('import CustomText')) {
      const depth = file.split(path.sep).length - 2;
      const prefix = depth === 0 ? './' : '../'.repeat(depth);
      content = "import CustomText from '" + prefix + "components/CustomText';\n" + content;
    }
    changed = true;
  }

  // 3. Replace JSX tags
  if (changed || content.includes('<Text ') || content.includes('<Text>') || content.includes('</Text>')) {
    content = content.replace(/<Text(\s|>)/g, '<CustomText$1');
    content = content.replace(/<\/Text>/g, '</CustomText>');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
