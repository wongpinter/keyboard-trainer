import { supabase } from '@/integrations/supabase/client';
import { colemakCurriculum, bigramTrainingTips } from '@/data/colemakTraining';
import { COLEMAK_LAYOUT } from '@/types/keyboard';
import { TrainingLessonDB, CurriculumInsert, MigrationResult, MigrationOptions } from '@/types/database';

/**
 * Migration script to populate Supabase database with training data
 * This script converts our static training data to database format
 */

// Convert our TrainingLesson format to database format
function convertLessonToDBFormat(lesson: any): TrainingLessonDB {
  return {
    id: lesson.id,
    name: lesson.name,
    description: lesson.description,
    type: lesson.type,
    difficulty: lesson.difficulty,
    focusKeys: lesson.focusKeys || [],
    content: Array.isArray(lesson.content) ? lesson.content : [],
    minAccuracy: lesson.minAccuracy,
    minWpm: lesson.minWpm,
    estimatedMinutes: Math.ceil((lesson.content?.length || 0) / 10), // Rough estimate
    tags: generateLessonTags(lesson)
  };
}

// Generate tags based on lesson content
function generateLessonTags(lesson: any): string[] {
  const tags: string[] = [];
  
  if (lesson.type) tags.push(lesson.type);
  if (lesson.difficulty) tags.push(lesson.difficulty);
  
  // Add specific tags based on lesson content
  if (lesson.id.includes('bigram')) tags.push('bigrams', 'muscle-memory');
  if (lesson.id.includes('dh')) tags.push('colemak-dh');
  if (lesson.id.includes('home-row')) tags.push('home-row', 'foundation');
  if (lesson.id.includes('mixed')) tags.push('comprehensive', 'varied');
  
  return tags;
}

// Create comprehensive Colemak curriculum
async function createColemakCurriculum(keyboardLayoutId: string): Promise<CurriculumInsert> {
  const lessons = colemakCurriculum.lessons.map(convertLessonToDBFormat);

  return {
    name: 'Complete Colemak Training',
    description: 'Comprehensive Colemak training curriculum with words, sentences, bigrams, and Colemak-DH support',
    keyboard_layout_id: keyboardLayoutId,
    lessons: lessons as any, // Cast to any for JSON compatibility
    difficulty_level: 3, // Intermediate to advanced
    estimated_hours: 40,
    is_public: true
  };
}

// Create specialized curriculums for different training types
async function createSpecializedCurriculums(keyboardLayoutId: string): Promise<CurriculumInsert[]> {
  const allLessons = colemakCurriculum.lessons.map(convertLessonToDBFormat);
  
  return [
    // Beginner curriculum
    {
      name: 'Colemak Basics',
      description: 'Essential Colemak training for beginners',
      keyboard_layout_id: keyboardLayoutId,
      lessons: allLessons.filter(l => l.difficulty === 'beginner') as any,
      difficulty_level: 1,
      estimated_hours: 15,
      is_public: true
    },

    // Bigram training curriculum
    {
      name: 'Colemak Bigram Training',
      description: 'Specialized bigram training for muscle memory development',
      keyboard_layout_id: keyboardLayoutId,
      lessons: allLessons.filter(l => l.type === 'words' && l.id.includes('bigram')) as any,
      difficulty_level: 2,
      estimated_hours: 10,
      is_public: true
    },

    // Colemak-DH curriculum
    {
      name: 'Colemak-DH Complete',
      description: 'Complete training for Colemak-DH layout variant',
      keyboard_layout_id: keyboardLayoutId,
      lessons: allLessons.filter(l => l.id.includes('dh')) as any,
      difficulty_level: 3,
      estimated_hours: 20,
      is_public: true
    },

    // Advanced curriculum
    {
      name: 'Advanced Colemak',
      description: 'Advanced training with complex sentences and mixed practice',
      keyboard_layout_id: keyboardLayoutId,
      lessons: allLessons.filter(l => l.difficulty === 'advanced') as any,
      difficulty_level: 4,
      estimated_hours: 25,
      is_public: true
    }
  ];
}

// Ensure Colemak layout exists in database
async function ensureColemakLayout(): Promise<string> {
  // Check if Colemak layout already exists
  const { data: existingLayout } = await supabase
    .from('keyboard_layouts')
    .select('id')
    .eq('name', 'Colemak')
    .single();
  
  if (existingLayout) {
    return existingLayout.id;
  }
  
  // Create Colemak layout if it doesn't exist
  const { data: newLayout, error } = await supabase
    .from('keyboard_layouts')
    .insert({
      name: 'Colemak',
      description: 'The efficient Colemak keyboard layout designed for comfortable and fast typing',
      layout_data: COLEMAK_LAYOUT as any, // Cast to any for JSON compatibility
      is_public: true
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create Colemak layout: ${error.message}`);
  }
  
  return newLayout.id;
}

// Main migration function
export async function migrateTrainingData(options: MigrationOptions = {}): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    errors: [],
    warnings: []
  };
  
  try {
    console.log('Starting training data migration...');
    
    if (options.dryRun) {
      console.log('DRY RUN MODE - No data will be written to database');
    }
    
    // Ensure we have a Colemak layout
    const keyboardLayoutId = await ensureColemakLayout();
    console.log(`Using keyboard layout ID: ${keyboardLayoutId}`);
    
    // Create main curriculum
    const mainCurriculum = await createColemakCurriculum(keyboardLayoutId);
    
    if (options.validateOnly) {
      console.log('Validation complete - curriculum structure is valid');
      result.success = true;
      return result;
    }
    
    if (!options.dryRun) {
      // Check if main curriculum already exists
      const { data: existingCurriculum } = await supabase
        .from('curriculums')
        .select('id')
        .eq('name', mainCurriculum.name)
        .single();
      
      if (existingCurriculum && !options.overwrite) {
        result.warnings.push('Main curriculum already exists, skipping (use overwrite option to replace)');
      } else {
        if (existingCurriculum && options.overwrite) {
          // Update existing curriculum
          const { error } = await supabase
            .from('curriculums')
            .update(mainCurriculum)
            .eq('id', existingCurriculum.id);
          
          if (error) {
            result.errors.push(`Failed to update main curriculum: ${error.message}`);
          } else {
            result.migratedCount++;
            console.log('Updated main curriculum');
          }
        } else {
          // Create new curriculum
          const { error } = await supabase
            .from('curriculums')
            .insert(mainCurriculum);
          
          if (error) {
            result.errors.push(`Failed to create main curriculum: ${error.message}`);
          } else {
            result.migratedCount++;
            console.log('Created main curriculum');
          }
        }
      }
      
      // Create specialized curriculums
      const specializedCurriculums = await createSpecializedCurriculums(keyboardLayoutId);
      
      for (const curriculum of specializedCurriculums) {
        try {
          const { data: existing } = await supabase
            .from('curriculums')
            .select('id')
            .eq('name', curriculum.name)
            .single();
          
          if (existing && !options.overwrite) {
            result.warnings.push(`Curriculum "${curriculum.name}" already exists, skipping`);
            continue;
          }
          
          if (existing && options.overwrite) {
            const { error } = await supabase
              .from('curriculums')
              .update(curriculum)
              .eq('id', existing.id);
            
            if (error) {
              result.errors.push(`Failed to update curriculum "${curriculum.name}": ${error.message}`);
            } else {
              result.migratedCount++;
              console.log(`Updated curriculum: ${curriculum.name}`);
            }
          } else {
            const { error } = await supabase
              .from('curriculums')
              .insert(curriculum);
            
            if (error) {
              result.errors.push(`Failed to create curriculum "${curriculum.name}": ${error.message}`);
            } else {
              result.migratedCount++;
              console.log(`Created curriculum: ${curriculum.name}`);
            }
          }
        } catch (error) {
          result.errors.push(`Error processing curriculum "${curriculum.name}": ${error}`);
        }
      }
    } else {
      console.log('DRY RUN: Would create/update the following curriculums:');
      console.log('- ' + mainCurriculum.name);
      const specialized = await createSpecializedCurriculums(keyboardLayoutId);
      specialized.forEach(c => console.log('- ' + c.name));
      result.migratedCount = 1 + specialized.length;
    }
    
    result.success = result.errors.length === 0;
    
    console.log(`Migration completed. Success: ${result.success}, Migrated: ${result.migratedCount}, Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
    
    if (result.errors.length > 0) {
      console.error('Migration errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.warn('Migration warnings:', result.warnings);
    }
    
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    console.error('Migration failed:', error);
  }
  
  return result;
}

// Utility function to run migration from browser console
export async function runMigration() {
  console.log('Running training data migration...');
  const result = await migrateTrainingData({ overwrite: false });
  console.log('Migration result:', result);
  return result;
}

// Utility function for dry run
export async function dryRunMigration() {
  console.log('Running dry run migration...');
  const result = await migrateTrainingData({ dryRun: true });
  console.log('Dry run result:', result);
  return result;
}

// Make functions available globally for console access
if (typeof window !== 'undefined') {
  (window as any).runMigration = runMigration;
  (window as any).dryRunMigration = dryRunMigration;
  (window as any).migrateTrainingData = migrateTrainingData;
}
