import { Command } from 'commander';
import * as SprintActions from '../../core/actions/sprint';
import { ensureBoardFile } from '../utils/board';

export const attachAddSprint = (program: Command) =>
  program
    .command('add-sprint <name>')
    .description('Create a new sprint')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('-d, --description <description>', 'Sprint description')
    .option('-c, --capacity <capacity>', 'Sprint capacity (number)')
    .option('-s, --starts <date>', 'Sprint start date (ISO format or relative like "today", "tomorrow")')
    .option('-e, --ends <date>', 'Sprint end date (ISO format or relative like "next week", "+2 weeks")')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (name: string, options: {
      file?: string;
      description?: string;
      capacity?: string;
      starts?: string;
      ends?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        const sprintData: any = {
          name,
          description: options.description,
        };

        if (options.capacity) {
          const capacity = parseInt(options.capacity);
          if (isNaN(capacity) || capacity < 0) {
            console.error('Capacity must be a non-negative number');
            process.exit(1);
          }
          sprintData.capacity = capacity;
        }

        // Handle date parsing
        if (options.starts || options.ends) {
          sprintData.dates = {};
          
          if (options.starts) {
            // Simple date parsing - in a real implementation, you might want more sophisticated date parsing
            if (options.starts.toLowerCase() === 'today') {
              sprintData.dates.starts = new Date().toISOString();
            } else if (options.starts.toLowerCase() === 'tomorrow') {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              sprintData.dates.starts = tomorrow.toISOString();
            } else {
              sprintData.dates.starts = new Date(options.starts).toISOString();
            }
          }
          
          if (options.ends) {
            if (options.ends.toLowerCase() === 'next week') {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              sprintData.dates.ends = nextWeek.toISOString();
            } else if (options.ends.startsWith('+')) {
              // Handle relative dates like "+2 weeks"
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
                
                sprintData.dates.ends = date.toISOString();
              } else {
                sprintData.dates.ends = new Date(options.ends).toISOString();
              }
            } else {
              sprintData.dates.ends = new Date(options.ends).toISOString();
            }
          }
        }

        const createdSprint = SprintActions.addSprint(boardFile, sprintData);

        console.log(`Created sprint: ${createdSprint.name}`);
        
        if (createdSprint.description) {
          console.log(`Description: ${createdSprint.description}`);
        }
        
        if (createdSprint.capacity) {
          console.log(`Capacity: ${createdSprint.capacity}`);
        }
        
        console.log(`Starts: ${createdSprint.dates.starts}`);
        
        if (createdSprint.dates.ends) {
          console.log(`Ends: ${createdSprint.dates.ends}`);
        }
      } catch (error) {
        console.error(`Failed to create sprint: ${error}`);
        process.exit(1);
      }
    });