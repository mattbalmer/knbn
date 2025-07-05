import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { migrateBoard } from '../../core/utils/migrations';
import { loadBoard, saveBoard } from '../../core/utils/board-files';
import { Brands } from '../../core/utils/ts';
import { Filepath } from '../../core/types';
import * as yaml from 'js-yaml';

export const attachMigrate = (program: Command) =>
  program
    .command('migrate')
    .description('Migrate board files to the latest version')
    .argument('[files...]', 'Board files to migrate (e.g., board1.knbn board2.knbn)')
    .option('--all', 'Migrate all .knbn files in the current directory')
    .option('-d, --dry-run', 'Show what would be migrated without making changes')
    .option('--backup', 'Create backup files before migration (adds .bak extension)')
    .action(async (files: string[], options) => {
      try {
        let filesToMigrate: string[] = [];

        if (options.all) {
          // Find all .knbn files in current directory
          const currentDir = process.cwd();
          const allFiles = fs.readdirSync(currentDir);
          filesToMigrate = allFiles.filter(file => file.endsWith('.knbn'));
          
          if (filesToMigrate.length === 0) {
            console.log('No .knbn files found in current directory');
            return;
          }
        } else if (files && files.length > 0) {
          filesToMigrate = files;
        } else {
          console.error('Please specify files to migrate or use --all flag');
          console.log('Examples:');
          console.log('  knbn migrate board.knbn');
          console.log('  knbn migrate board1.knbn board2.knbn');
          console.log('  knbn migrate --all');
          process.exit(1);
        }

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const filename of filesToMigrate) {
          const filepath = path.resolve(filename);
          
          if (!fs.existsSync(filepath)) {
            console.error(`File not found: ${filename}`);
            errorCount++;
            continue;
          }

          try {
            // Load raw file content to check version
            const fileContent = fs.readFileSync(filepath, 'utf8');
            let rawData: any;
            
            try {
              rawData = yaml.load(fileContent) as any;
            } catch (yamlError) {
              console.error(`Invalid board file format: ${filename}`);
              errorCount++;
              continue;
            }

            if (!rawData || !rawData.metadata || !rawData.metadata.version) {
              console.error(`Invalid board file format: ${filename}`);
              errorCount++;
              continue;
            }

            const currentVersion = rawData.metadata.version;
            
            // Try to migrate
            const migratedBoard = migrateBoard(rawData);
            const newVersion = migratedBoard.metadata.version;

            if (currentVersion === newVersion) {
              console.log(`⏭️  ${filename}: Already at latest version (${currentVersion})`);
              skippedCount++;
              continue;
            }

            if (options.dryRun) {
              console.log(`🔄 ${filename}: Would migrate from ${currentVersion} to ${newVersion}`);
              migratedCount++;
              continue;
            }

            // Create backup if requested
            if (options.backup) {
              const backupPath = `${filepath}.bak`;
              fs.copyFileSync(filepath, backupPath);
              console.log(`📋 Created backup: ${path.basename(backupPath)}`);
            }

            // Save migrated board
            const filepathBrand = Brands.Filepath(filepath);
            saveBoard(filepathBrand, migratedBoard);
            
            console.log(`✅ ${filename}: Migrated from ${currentVersion} to ${newVersion}`);
            migratedCount++;

          } catch (error: any) {
            console.error(`❌ ${filename}: Migration failed - ${error.message}`);
            errorCount++;
          }
        }

        // Summary
        console.log('\n📊 Migration Summary:');
        if (options.dryRun) {
          console.log(`  Would migrate: ${migratedCount} files`);
        } else {
          console.log(`  Migrated: ${migratedCount} files`);
        }
        console.log(`  Already current: ${skippedCount} files`);
        if (errorCount > 0) {
          console.log(`  Errors: ${errorCount} files`);
        }

        if (options.dryRun && migratedCount > 0) {
          console.log('\nRun without --dry-run to perform the migration.');
        }

        if (errorCount > 0) {
          process.exit(1);
        }

      } catch (error: any) {
        console.error(`Migration failed: ${error.message}`);
        process.exit(1);
      }
    });