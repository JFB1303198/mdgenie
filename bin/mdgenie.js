#!/usr/bin/env node

const inquirer = require('inquirer').default || require('inquirer');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

console.log(chalk.blue.bold('\n🧞 MDGenie - Your README Generator\n'));
console.log(chalk.gray('Answer a few questions to generate a beautiful README.md file\n'));

const questions = [
  {
    type: 'input',
    name: 'projectTitle',
    message: 'What is your project title?',
    validate: input => input.trim() !== '' || 'Project title is required'
  },
  {
    type: 'input',
    name: 'projectDescription',
    message: 'Provide a short description of your project:',
    validate: input => input.trim() !== '' || 'Description is required'
  },
  {
    type: 'input',
    name: 'version',
    message: 'What is the current version?',
    default: '1.0.0'
  },
  {
    type: 'list',
    name: 'license',
    message: 'Choose a license:',
    choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'None'],
    default: 'MIT'
  },
  {
    type: 'confirm',
    name: 'includeInstallation',
    message: 'Include installation instructions?',
    default: true
  },
  {
    type: 'list',
    name: 'packageManager',
    message: 'Which package manager do you use?',
    choices: ['npm', 'yarn', 'pnpm'],
    default: 'npm',
    when: answers => answers.includeInstallation
  },
  {
    type: 'input',
    name: 'installCommand',
    message: 'Custom install command (if different from default):',
    when: answers => answers.includeInstallation
  },
  {
    type: 'confirm',
    name: 'includeUsage',
    message: 'Include usage instructions?',
    default: true
  },
  {
    type: 'editor',
    name: 'usageInstructions',
    message: 'Describe how to use your project:',
    when: answers => answers.includeUsage
  },
  {
    type: 'confirm',
    name: 'includeAPI',
    message: 'Include API documentation section?',
    default: false
  },
  {
    type: 'editor',
    name: 'apiDocs',
    message: 'Describe your API:',
    when: answers => answers.includeAPI
  },
  {
    type: 'confirm',
    name: 'includeTests',
    message: 'Include testing instructions?',
    default: false
  },
  {
    type: 'list',
    name: 'testCommand',
    message: 'Test command:',
    choices: ['npm test', 'yarn test', 'pnpm test'],
    default: 'npm test',
    when: answers => answers.includeTests
  },
  {
    type: 'confirm',
    name: 'includeContributing',
    message: 'Include contributing guidelines?',
    default: true
  },
  {
    type: 'confirm',
    name: 'includeCredits',
    message: 'Include credits/acknowledgments?',
    default: false
  },
  {
    type: 'input',
    name: 'authorName',
    message: 'Author name:',
    when: answers => answers.includeCredits
  },
  {
    type: 'input',
    name: 'githubUsername',
    message: 'GitHub username:',
    when: answers => answers.includeCredits
  },
  {
    type: 'confirm',
    name: 'includeBadges',
    message: 'Include badges at the top?',
    default: true
  },
  {
    type: 'checkbox',
    name: 'badges',
    message: 'Select badges to include:',
    choices: [
      { name: 'License', value: 'license', checked: true },
      { name: 'Version', value: 'version', checked: true },
      { name: 'Node Version', value: 'node', checked: false },
      { name: 'NPM Downloads', value: 'downloads', checked: false },
      { name: 'Build Status', value: 'build', checked: false },
      { name: 'Coverage', value: 'coverage', checked: false }
    ],
    when: answers => answers.includeBadges
  }
];

function generateBadges(answers) {
  if (!answers.includeBadges || !answers.badges.length) return '';
  
  const badges = [];
  const { githubUsername, projectTitle, version, license } = answers;
  
  if (answers.badges.includes('license')) {
    badges.push(`![License](https://img.shields.io/badge/license-${license}-blue.svg)`);
  }
  
  if (answers.badges.includes('version')) {
    badges.push(`![Version](https://img.shields.io/badge/version-${version}-brightgreen.svg)`);
  }
  
  if (answers.badges.includes('node')) {
    badges.push(`![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)`);
  }
  
  if (answers.badges.includes('downloads') && githubUsername) {
    badges.push(`![NPM Downloads](https://img.shields.io/npm/dm/${projectTitle.toLowerCase().replace(/\s+/g, '-')}.svg)`);
  }
  
  if (answers.badges.includes('build') && githubUsername) {
    badges.push(`![Build Status](https://img.shields.io/github/workflow/status/${githubUsername}/${projectTitle.toLowerCase().replace(/\s+/g, '-')}/CI)`);
  }
  
  if (answers.badges.includes('coverage') && githubUsername) {
    badges.push(`![Coverage](https://img.shields.io/codecov/c/github/${githubUsername}/${projectTitle.toLowerCase().replace(/\s+/g, '-')}.svg)`);
  }
  
  return badges.join('\n') + '\n\n';
}

function generateInstallationSection(answers) {
  if (!answers.includeInstallation) return '';
  
  let installCommand = answers.installCommand;
  if (!installCommand) {
    const commandMap = {
      'npm': 'npm install',
      'yarn': 'yarn add',
      'pnpm': 'pnpm add'
    };
    installCommand = commandMap[answers.packageManager];
  }
  
  return `## Installation

\`\`\`bash
${installCommand}
\`\`\`\n\n`;
}

function generateUsageSection(answers) {
  if (!answers.includeUsage) return '';
  
  const usage = answers.usageInstructions || 'Add usage instructions here.';
  
  return `## Usage

\`\`\`javascript
// Example usage code here
${usage}
\`\`\`\n\n`;
}

function generateAPISection(answers) {
  if (!answers.includeAPI) return '';
  
  return `## API Documentation

${answers.apiDocs || 'Add API documentation here.'}

\`\`\`javascript
// API examples
\`\`\`\n\n`;
}

function generateTestsSection(answers) {
  if (!answers.includeTests) return '';
  
  return `## Tests

\`\`\`bash
${answers.testCommand}
\`\`\`\n\n`;
}

function generateContributingSection(answers) {
  if (!answers.includeContributing) return '';
  
  return `## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

\`\`\`bash
git clone https://github.com/${answers.githubUsername || 'slammers001'}/${answers.projectTitle.toLowerCase().replace(/\s+/g, '-')}.git
\`\`\`\n\n`;
}

function generateCreditsSection(answers) {
  if (!answers.includeCredits) return '';
  
  return `## Credits

${answers.authorName || 'Author Name'} - ${answers.githubUsername ? `[@${answers.githubUsername}](https://github.com/${answers.githubUsername})` : ''}

## License

Distributed under the ${answers.license} License. See \`LICENSE\` for more information.\n\n`;
}

function generateReadme(answers) {
  const badges = generateBadges(answers);
  const installation = generateInstallationSection(answers);
  const usage = generateUsageSection(answers);
  const api = generateAPISection(answers);
  const tests = generateTestsSection(answers);
  const contributing = generateContributingSection(answers);
  const credits = generateCreditsSection(answers);
  
  return `# ${answers.projectTitle}

${badges}${answers.projectDescription}

${installation}${usage}${api}${tests}${contributing}${credits}---

⭐ If you find this project helpful, please consider giving it a star!

---

*Generated by [MDGenie](https://github.com/slammers001/mdgenie) - Your README Generator*
`;
}

async function main() {
  try {
    const answers = await inquirer.prompt(questions);
    
    const readme = generateReadme(answers);
    const outputPath = path.join(process.cwd(), 'README.md');
    
    await fs.writeFile(outputPath, readme);
    
    console.log(chalk.green.bold('\n✅ README.md generated successfully!'));
    console.log(chalk.gray(`File saved to: ${outputPath}\n`));
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error generating README:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
