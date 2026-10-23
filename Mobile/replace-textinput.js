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
      if (file.endsWith('.tsx') && file !== 'CustomTextInput.tsx') {
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

  // 1. Replace one-line import for TextInput
  if (content.match(/import\s+{[^}]*\bTextInput\b[^}]*}\s+from\s+['"]react-native['"]/)) {
    content = content.replace(/import\s+{([^}]*)\bTextInput\b([^}]*)}\s+from\s+['"]react-native['"]/, (match, p1, p2) => {
      let newImports = (p1 + p2).split(',').map(s => s.trim()).filter(s => s.length > 0).join(', ');
      if (newImports.length > 0) {
        return "import { " + newImports + " } from 'react-native';";
      } else {
        return "";
      }
    });
    const depth = file.split(path.sep).length - 2;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    content = "import CustomTextInput from '" + prefix + "components/CustomTextInput';\n" + content;
    changed = true;
  }
  // 2. Handle multi-line import for TextInput
  else if (content.match(/import\s+{[\s\S]*?\bTextInput\b[\s\S]*?}\s+from\s+['"]react-native['"]/)) {
    content = content.replace(/(import\s+{[\s\S]*?)\bTextInput\b,?([\s\S]*?}\s+from\s+['"]react-native['"])/, "$1$2");
    content = content.replace(/import\s+{[\s\n]*}\s+from\s+['"]react-native['"];?/, "");
    
    if (!content.includes('import CustomTextInput')) {
      const depth = file.split(path.sep).length - 2;
      const prefix = depth === 0 ? './' : '../'.repeat(depth);
      content = "import CustomTextInput from '" + prefix + "components/CustomTextInput';\n" + content;
    }
    changed = true;
  }

  // 3. Replace JSX tags
  if (changed || content.includes('<TextInput') || content.includes('</TextInput>')) {
    content = content.replace(/<TextInput(\s|>)/g, '<CustomTextInput$1');
    content = content.replace(/<\/TextInput>/g, '</CustomTextInput>');
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
