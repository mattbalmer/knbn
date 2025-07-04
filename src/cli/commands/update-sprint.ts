import { Command } from 'commander';
import * as SprintActions from '../../core/actions/sprint';
import { ensureBoardFile } from '../utils/board';

export const attachUpdateSprint = (program: Command) =>
  program
    .command('update-sprint <name>')
    .description('Update an existing sprint')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--name <newName>', 'New sprint name')
    .option('-d, --description <description>', 'Sprint description')
    .option('-c, --capacity <capacity>', 'Sprint capacity (number)')
    .option('-s, --starts <date>', 'Sprint start date (ISO format or relative)')
    .option('-e, --ends <date>', 'Sprint end date (ISO format or relative)')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      name?: string;
      description?: string;
      capacity?: string;
      starts?: string;
      ends?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const updates: any = {};

        if (options.name) {
          updates.name = options.name;
        }

        if (options.description !== undefined) {
          updates.description = options.description;
        }

        if (options.capacity) {
          const capacity = parseInt(options.capacity);
          if (isNaN(capacity) || capacity < 0) {
            console.error('Capacity must be a non-negative number');
            process.exit(1);
          }
          updates.capacity = capacity;
        }

        // Handle date updates
        if (options.starts || options.ends) {
          // Get current sprint to preserve existing dates
          const currentSprint = SprintActions.getSprint(boardFile, name);
          updates.dates = { ...currentSprint.dates };
          
          if (options.starts) {
            if (options.starts.toLowerCase() === 'today') {
              updates.dates.starts = new Date().toISOString();
            } else if (options.starts.toLowerCase() === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              updates.dates.starts = tomorrow.toISOString();
            } else {
              updates.dates.starts = new Date(options.starts).toISOString();
            }
          }
          
          if (options.ends) {
            if (options.ends.toLowerCase() === 'next week') {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              updates.dates.ends = nextWeek.toISOString();
            } else if (options.ends.startsWith('+')) {
              const match = options.ends.match(/^\+(\d+)\s*(day|days|week|weeks)$/i);
              if (match) {
                const amount = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                const date = new Date();
                
                if (unit.startsWith('day')) {
                  date.setDate(date.getDate() + amount);
                } else if (unit.startsWith('week')) {
                  date.setDate(date.getDate() + (amount * 7));
                }
                
                updates.dates.ends = date.toISOString();
              } else {
                updates.dates.ends = new Date(options.ends).toISOString();
              }
            } else {
              updates.dates.ends = new Date(options.ends).toISOString();
            }
          }
        }

        if (Object.keys(updates).length === 0) {
          console.log('No updates specified. Use --help to see available options.');
          return;
        }

        const updatedSprint = SprintActions.updateSprint(boardFile, name, updates);

        console.log(`Updated sprint: ${updatedSprint.name}`);
        
        if (updatedSprint.description) {
          console.log(`Description: ${updatedSprint.description}`);
        }
        
        if (updatedSprint.capacity) {
          console.log(`Capacity: ${updatedSprint.capacity}`);
        }
        
        console.log(`Starts: ${updatedSprint.dates.starts}`);
        
        if (updatedSprint.dates.ends) {
          console.log(`Ends: ${updatedSprint.dates.ends}`);
        }
      } catch (error) {
        console.error(`Failed to update sprint: ${error}`);
        process.exit(1);
      }
    });