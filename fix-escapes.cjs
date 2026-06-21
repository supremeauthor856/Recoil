const fs = require('fs');

const files = [
  'src/features/export/components/ExportPanel.tsx',
  'src/features/export/exporters/characterExporter.ts',
  'src/features/export/exporters/imageCardExporter.ts',
  'src/features/export/exporters/verseExporter.ts',
  'src/features/export/exporters/writingExporter.ts',
  'src/features/export/utils/epubBuilder.ts',
  'src/features/export/utils/htmlTemplates.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  content = content.replace(/\\\\/g, '\\');
  fs.writeFileSync(file, content, 'utf8');
}
