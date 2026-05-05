// Verification script to check if all required files exist
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying VS Code Extension Setup...\n');

const requiredFiles = [
    'package.json',
    'tsconfig.json',
    '.eslintrc.json',
    '.vscodeignore',
    'src/extension.ts'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (!exists) {
        allFilesExist = false;
    }
});

console.log('\n📦 Checking node_modules...');
const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
console.log(nodeModulesExists ? '✅ node_modules exists' : '❌ node_modules missing - run npm install');

console.log('\n📋 Checking package.json scripts...');
const packageJson = require('./package.json');
const requiredScripts = ['compile', 'watch', 'vscode:prepublish'];
requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${script}`);
});

console.log('\n📚 Checking dependencies...');
const requiredDeps = {
    'dependencies': ['axios'],
    'devDependencies': ['typescript', '@types/vscode', '@types/node']
};

Object.keys(requiredDeps).forEach(depType => {
    console.log(`\n${depType}:`);
    requiredDeps[depType].forEach(dep => {
        const exists = packageJson[depType] && packageJson[depType][dep];
        const status = exists ? '✅' : '❌';
        console.log(`${status} ${dep}`);
    });
});

console.log('\n' + '='.repeat(50));
if (allFilesExist && nodeModulesExists) {
    console.log('✅ All required files are present!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run compile');
    console.log('2. Press F5 in VS Code to test the extension');
} else {
    console.log('❌ Some files are missing!');
    console.log('\n📝 Fix steps:');
    if (!nodeModulesExists) {
        console.log('1. Run: npm install');
    }
    console.log('2. Check the missing files listed above');
}
console.log('='.repeat(50) + '\n');
