import { Command } from 'commander';
import * as SprintActions from '../../core/actions/sprint';
import { ensureBoardFile } from '../utils/board';

export const attachListSprints = (program: Command) =>
  program
    .command('list-sprints')
    .description('List sprints with optional filtering')
    .option('-f, --file <path>', 'Specify a board file to use')
    .option('--filter <filter>', 'Filter sprints by status (all, active, upcoming, completed)', 'all')
    .option('--skip-prompt', 'Skip prompts for board creation', false)
    .action(async (options: {
      file?: string;
      filter?: string;
      skipPrompt?: boolean;
    }) => {
      const boardFile = await ensureBoardFile(options.file, options.skipPrompt);

      try {
        let sprints;
        
        switch (options.filter) {
          case 'active':
            sprints = SprintActions.getActiveSprints(boardFile);
            break;
          case 'upcoming':
            sprints = SprintActions.getUpcomingSprints(boardFile);
            break;
          case 'completed':
            sprints = SprintActions.getCompletedSprints(boardFile);
            break;
          case 'all':
          default:
            sprints = SprintActions.listSprints(boardFile);
            break;
        }

        if (sprints.length === 0) {
          const filterText = options.filter === 'all' ? '' : ` (${options.filter})`;
          console.log(`No sprints found${filterText}.`);
          return;
        }

        const filterText = options.filter === 'all' ? '' : ` (${options.filter})`;
        console.log(`Found ${sprints.length} sprint(s)${filterText}:\n`);

        sprints.forEach((sprint, index) => {
          console.log(`${index + 1}. ${sprint.name}`);
          
          if (sprint.description) {
            console.log(`   Description: ${sprint.description}`);
          }
          
          if (sprint.capacity) {
            console.log(`   Capacity: ${sprint.capacity}`);
          }
          
          console.log(`   Created: ${sprint.dates.created}`);
          console.log(`   Starts: ${sprint.dates.starts}`);
          
          if (sprint.dates.ends) {
            console.log(`   Ends: ${sprint.dates.ends}`);
          }
          
          console.log('');
        });
      } catch (error) {
        console.error(`Failed to list sprints: ${error}`);
        process.exit(1);
      }
    });