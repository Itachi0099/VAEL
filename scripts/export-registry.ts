import { knowledgeBase } from '../src/core/knowledge';
import * as fs from 'fs';
import * as path from 'path';

function exportRegistry() {
  const garments = knowledgeBase.getAllGarments();
  const hairstyles = knowledgeBase.getAllHairstyles();
  const beards = knowledgeBase.getAllBeards();
  const styles = knowledgeBase.getAllStyles();
  const occasions = knowledgeBase.getAllOccasions();

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 1. JSON Export
  const completeRegistry = {
    metadata: {
      exportedAt: new Date().toISOString(),
      counts: {
        garments: garments.length,
        hairstyles: hairstyles.length,
        beards: beards.length,
        styles: styles.length,
        occasions: occasions.length,
      },
    },
    garments,
    hairstyles,
    beards,
    styles,
    occasions,
  };

  fs.writeFileSync(path.join(reportsDir, 'registry-export.json'), JSON.stringify(completeRegistry, null, 2));

  // Helper for CSV escaping
  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // 2. Garments CSV
  const garmentHeaders = [
    'id', 'name', 'category', 'subcategory', 'formality', 'fit', 'silhouette',
    'colorName', 'colorTone', 'material', 'fabricWeight', 'garmentCoding', 'fluidTag', 'drape', 'modestyRating'
  ];
  const garmentRows = garments.map(g => [
    escapeCsv(g.id),
    escapeCsv(g.name),
    escapeCsv(g.category),
    escapeCsv(g.subcategory),
    escapeCsv(g.formality),
    escapeCsv(g.fit),
    escapeCsv(g.silhouette),
    escapeCsv(g.color?.name),
    escapeCsv(g.color?.tone),
    escapeCsv(g.material),
    escapeCsv(g.fabricWeight),
    escapeCsv(g.garmentCoding),
    escapeCsv(g.fluidTag),
    escapeCsv(g.drape),
    escapeCsv(g.modestyRating),
  ].join(','));
  fs.writeFileSync(path.join(reportsDir, 'garments.csv'), [garmentHeaders.join(','), ...garmentRows].join('\n'));

  // 3. Hairstyles CSV
  const hairHeaders = ['id', 'name', 'slug', 'targetLength', 'maintenance', 'formalityRange', 'compatibleTextures', 'compatibleFaceShapes'];
  const hairRows = hairstyles.map(h => [
    escapeCsv(h.id),
    escapeCsv(h.name),
    escapeCsv(h.slug),
    escapeCsv(h.targetLength),
    escapeCsv(h.maintenance),
    escapeCsv(h.formalityRange?.join('-')),
    escapeCsv(h.compatibleTextures?.join(';')),
    escapeCsv(h.compatibleFaceShapes?.join(';')),
  ].join(','));
  fs.writeFileSync(path.join(reportsDir, 'hairstyles.csv'), [hairHeaders.join(','), ...hairRows].join('\n'));

  // 4. Beards CSV
  const beardHeaders = ['id', 'name', 'slug', 'targetLength', 'minimumDensity', 'maintenance', 'compatibleFaceShapes'];
  const beardRows = beards.map(b => [
    escapeCsv(b.id),
    escapeCsv(b.name),
    escapeCsv(b.slug),
    escapeCsv(b.targetLength),
    escapeCsv(b.minimumDensity),
    escapeCsv(b.maintenance),
    escapeCsv(b.compatibleFaceShapes?.join(';')),
  ].join(','));
  fs.writeFileSync(path.join(reportsDir, 'beards.csv'), [beardHeaders.join(','), ...beardRows].join('\n'));

  // 5. Styles CSV
  const styleHeaders = ['id', 'slug', 'name', 'formalityRange', 'primarySilhouettes', 'dominantFits'];
  const styleRows = styles.map(s => [
    escapeCsv(s.id),
    escapeCsv(s.slug),
    escapeCsv(s.name),
    escapeCsv(s.attributes?.formalityRange?.join('-')),
    escapeCsv(s.attributes?.primarySilhouettes?.join(';')),
    escapeCsv(s.attributes?.dominantFits?.join(';')),
  ].join(','));
  fs.writeFileSync(path.join(reportsDir, 'styles.csv'), [styleHeaders.join(','), ...styleRows].join('\n'));

  // 6. Occasions CSV
  const occasionHeaders = ['id', 'slug', 'name', 'category', 'defaultFormality', 'allowableFormalityRange', 'guidelines'];
  const occasionRows = occasions.map(o => [
    escapeCsv(o.id),
    escapeCsv(o.slug),
    escapeCsv(o.name),
    escapeCsv(o.category),
    escapeCsv(o.defaultFormality),
    escapeCsv(o.allowableFormalityRange?.join('-')),
    escapeCsv(o.guidelines?.join(';')),
  ].join(','));
  fs.writeFileSync(path.join(reportsDir, 'occasions.csv'), [occasionHeaders.join(','), ...occasionRows].join('\n'));

  console.log(`Registry export completed successfully!`);
  console.log(`Output files in ${reportsDir}:`);
  console.log(`- registry-export.json`);
  console.log(`- garments.csv (${garments.length} garments)`);
  console.log(`- hairstyles.csv (${hairstyles.length} hairstyles)`);
  console.log(`- beards.csv (${beards.length} beards)`);
  console.log(`- styles.csv (${styles.length} styles)`);
  console.log(`- occasions.csv (${occasions.length} occasions)`);
}

exportRegistry();
