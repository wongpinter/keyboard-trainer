import { migrateTrainingData } from './migrateTrainingData';

/**
 * Simple script to run the training data migration
 * This will export all static curriculum data to the database
 */
async function runMigration() {
  console.log('🚀 Starting curriculum migration...');
  
  try {
    const result = await migrateTrainingData({
      dryRun: false,
      overwrite: true,
      validateOnly: false
    });

    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Migrated ${result.migratedCount} curriculums`);
      
      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    } else {
      console.log('❌ Migration failed!');
      if (result.errors.length > 0) {
        console.log('🔥 Errors:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    }
  } catch (error) {
    console.error('💥 Migration script failed:', error);
  }
}

// Run the migration
runMigration();
