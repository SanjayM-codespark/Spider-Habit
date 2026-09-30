const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-push-notification',
  'android',
  'build.gradle'
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // Replace jcenter() with nothing to remove it, or substitute with mavenCentral() if desired.
  // The library already has mavenCentral(), so we just remove jcenter()
  if (content.includes('jcenter()')) {
    content = content.replace(/jcenter\(\)/g, '');
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('✅ Successfully removed jcenter() from react-native-push-notification/android/build.gradle');
  } else {
    console.log('✅ jcenter() not found or already removed from react-native-push-notification/android/build.gradle');
  }
} else {
  console.log('⚠️ react-native-push-notification/android/build.gradle not found. Ensure dependencies are installed.');
}
