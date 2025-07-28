import { Client } from '@notionhq/client';
import { Task, Project } from './database';

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
}

// Local utility function to format duration
// function formatDuration(seconds: number): string {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   return `${hours}h ${minutes}m ${seconds}s`;
// }
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
function formatDate(dateString: string): string {
  return new Date(dateString).toISOString();
}
export class NotionService {
  private client: Client | null = null;
  // private apiKey: string | null = null;

  setApiKey(apiKey: string): void {
    this.client = new Client({ auth: apiKey });
  }

  async getDatabases(): Promise<NotionDatabase[]> {
    if (!this.client) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await this.client.search({
        filter: {
          property: 'object',
          value: 'database'
        }
      });

      return response.results.map((db: any) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        properties: db.properties
      }));
    } catch (error) {
      console.error('Error fetching Notion databases:', error);
      throw error;
    }
  }

  async syncTask(task: Task, project: Project): Promise<any> {
    if (!this.client || !project.notionDatabaseId) {
      throw new Error('Notion client not initialized or project not linked to database');
    }

    try {
      // First, search for existing project task in the database
      const existingTask = await this.findExistingProjectTask(project.notionDatabaseId, project.name);
      
      if (existingTask) {
        // Update existing task with new time data and add current task as child
        return await this.updateExistingProjectTask(existingTask, task);
      } else {
        // Create new project task
        return await this.createNewProjectTask(task, project);
      }
    } catch (error) {
      console.error('Error syncing task to Notion:', error);
      throw error;
    }
  }

  private async findExistingProjectTask(databaseId: string, projectName: string): Promise<any | null> {
    try {
      const response = await this.client!.databases.query({
        database_id: databaseId,
        filter: {
          property: 'Task name',
          title: {
            equals: projectName
          }
        }
      });

      return response.results.length > 0 ? response.results[0] : null;
    } catch (error) {
      console.error('Error searching for existing project task:', error);
      return null;
    }
  }

  private async updateExistingProjectTask(existingTask: any, newTask: Task): Promise<any> {
    try {
      // Get current working time from the existing task
      const currentWorkingText = existingTask.properties.Working?.rich_text?.[0]?.text?.content || '00:00:00';
      const currentSeconds = this.parseTimeToSeconds(currentWorkingText);
      const newTotalSeconds = currentSeconds + (newTask.duration || 0);

      // Update the existing task with new total time
      const updateResponse = await this.client!.pages.update({
        page_id: existingTask.id,
        properties: {
          Status: {
            status: {
              name: newTask.isPaid ? 'Done' : 'In Progress'
            }
          },
          Working: {
            rich_text: [
              {
                text: {
                  content: formatTime(newTotalSeconds)
                }
              }
            ]
          },
          Worked: {
            rich_text: [
              {
                text: {
                  content: `Last: ${new Date(newTask.startTime).toLocaleTimeString('en-GB', { hour12: false })} - ${new Date(newTask.endTime || new Date().toISOString()).toLocaleTimeString('en-GB', { hour12: false })}`
                }
              }
            ]
          },
          Due: {
            date: {
              start: formatDate(newTask.endTime || newTask.startTime || new Date().toISOString())
            }
          },
          Paid: {
            checkbox: newTask.isPaid ? true : false
          }
        }
      });

      // Add new task session as a child block
      await this.addTaskSessionAsChild(existingTask.id, newTask);

      return updateResponse;
    } catch (error) {
      console.error('Error updating existing project task:', error);
      throw error;
    }
  }

  private async createNewProjectTask(task: Task, project: Project): Promise<any> {
    try {
      const response = await this.client!.pages.create({
        parent: {
          database_id: project.notionDatabaseId!
        },
        properties: {
          'Task name': {
            title: [
              {
                text: {
                  content: project.name
                }
              }
            ]
          },
          Status: {
            status: {
              name: task.isPaid ? 'Done' : 'In Progress'
            }
          },
          Customer: {
            rich_text: [
              {
                text: {
                  content: task.customerName || 'No customer'
                }
              }
            ]
          },
          Working: {
            rich_text: [
              {
                text: {
                  content: formatTime(task.duration || 0) 
                }
              }
            ]
          },
          Worked: {
            rich_text: [
              {
                text: {
                  content: `${new Date(task.startTime).toLocaleTimeString('en-GB', { hour12: false })} - ${new Date(task.endTime || new Date().toISOString()).toLocaleTimeString('en-GB', { hour12: false })}`
                }
              }
            ]
          },
          Due: {
            date: {
              start: formatDate(task.endTime || task.startTime || new Date().toISOString())
            }
          },
          Paid: {
            checkbox: task.isPaid ? true : false
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Work Sessions'
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `${formatTime(task.duration || 0)} - ${task.description || 'No description'} (${new Date(task.startTime).toLocaleString('en-GB')})`
                  }
                }
              ]
            }
          }
        ]
      });

      return response;
    } catch (error) {
      console.error('Error creating new project task:', error);
      throw error;
    }
  }

  private async addTaskSessionAsChild(pageId: string, task: Task): Promise<void> {
    try {
      await this.client!.blocks.children.append({
        block_id: pageId,
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `${formatTime(task.duration || 0)} - ${task.description || 'No description'} (${new Date(task.startTime).toLocaleString('en-GB')})`
                  }
                }
              ]
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error adding task session as child:', error);
      throw error;
    }
  }

  private parseTimeToSeconds(timeString: string): number {
    try {
      const parts = timeString.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parseInt(parts[2], 10) || 0;
        return hours * 3600 + minutes * 60 + seconds;
      }
      return 0;
    } catch (error) {
      console.error('Error parsing time string:', timeString, error);
      return 0;
    }
  }

  async updateTask(task: Task, project: Project, notionPageId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Notion API key not set');
    }

    try {
      // First, get the database to check available properties
      const database = await this.client.databases.retrieve({
        database_id: project.notionDatabaseId!
      });
      
      const hasDescriptionProperty = 'Description' in database.properties;
      
      // Update page properties
      const response = await this.client.pages.update({
        page_id: notionPageId,
        properties: {
          'Task name': {
            title: [
              {
                text: {
                  content: task.description
                }
              }
            ]
          },
          Status: {
            status: {
              name: task.isPaid ? 'Done' : 'In Progress'
            }
          },
          Working: {
            rich_text: [
              {
                text: {
                  content: task.duration ? (task.duration / 3600).toFixed(2) + ' hours' : '0 hours'
                }
              }
            ]
          },
          Worked: {
            rich_text: [
              {
                text: {
                  content: `${new Date(task.startTime).toLocaleTimeString('en-GB', { hour12: false })} - ${new Date(task.endTime || new Date().toISOString()).toLocaleTimeString('en-GB', { hour12: false })}`
                }
              }
            ]
          },
          paid: {
            date: task.isPaid ? {
              start: new Date().toISOString().split('T')[0]
            } : null
          },
          // Only add Description property if it exists in the database
          ...(hasDescriptionProperty && {
            Description: {
              rich_text: [
                {
                  text: {
                    content: task.description || ''
                  }
                }
              ]
            }
          })
        }
      });

      // Update page content with description
      if (task.description) {
        try {
          // First, get existing blocks to replace the first paragraph
          const blocks = await this.client.blocks.children.list({
            block_id: notionPageId
          });

          // Delete existing content blocks
          if (blocks.results.length > 0) {
            for (const block of blocks.results) {
              await this.client.blocks.delete({
                block_id: block.id
              });
            }
          }

          // Add new content with description
          await this.client.blocks.children.append({
            block_id: notionPageId,
            children: [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: task.description
                      }
                    }
                  ]
                }
              }
            ]
          });
        } catch (blockError) {
          console.error('Error updating page content:', blockError);
          // Continue execution even if block update fails
        }
      }

      return response;
    } catch (error) {
      console.error('Error updating task in Notion:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.users.me({});
      return true;
    } catch (error) {
      console.error('Notion connection test failed:', error);
      return false;
    }
  }

  async handleTaskUpdate(task: Task, project: Project, updateType: 'description' | 'deletion'): Promise<any> {
    if (!this.client || !project.notionDatabaseId) {
      throw new Error('Notion client not initialized or project not linked to database');
    }

    try {
      const existingTask = await this.findExistingProjectTask(project.notionDatabaseId, project.name);
      
      if (existingTask) {
        if (updateType === 'description') {
          return await this.updateTaskDescription(existingTask.id, task);
        } else if (updateType === 'deletion') {
          return await this.removeTaskSession(existingTask.id, task);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error handling task update in Notion:', error);
      throw error;
    }
  }

  private async updateTaskDescription(pageId: string, task: Task): Promise<any> {
    try {
      // Get all blocks from the page to find and update the specific task session
      const blocks = await this.client!.blocks.children.list({
        block_id: pageId
      });

      // Find the block that contains the task session to update
      for (const block of blocks.results) {
        if ('type' in block && block.type === 'paragraph' && 'paragraph' in block) {
          const richText = block.paragraph.rich_text[0];
          if (richText && 'text' in richText) {
            const content = richText.text.content || '';
            const taskTime = formatTime(task.duration || 0);
            const taskDate = new Date(task.startTime).toLocaleString('en-GB');
            
            // Check if this block contains our task session (by time and date)
            if (content.includes(taskTime) && content.includes(taskDate)) {
              // Update this block with new description
              await this.client!.blocks.update({
                block_id: block.id,
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: `${taskTime} - ${task.description || 'No description'} (${taskDate})`
                      }
                    }
                  ]
                }
              });
              break;
            }
          }
        }
      }

      return { updated: true };
    } catch (error) {
      console.error('Error updating task description in Notion:', error);
      throw error;
    }
  }

  private async removeTaskSession(pageId: string, task: Task): Promise<any> {
    try {
      // Get all blocks from the page to find and remove the specific task session
      const blocks = await this.client!.blocks.children.list({
        block_id: pageId
      });

      let removedDuration = 0;

      // Find and remove the block that contains the task session
      for (const block of blocks.results) {
        if ('type' in block && block.type === 'paragraph' && 'paragraph' in block) {
          const richText = block.paragraph.rich_text[0];
          if (richText && 'text' in richText) {
            const content = richText.text.content || '';
            const taskTime = formatTime(task.duration || 0);
            const taskDate = new Date(task.startTime).toLocaleString('en-GB');
            
            // Check if this block contains our task session (by time and date)
            if (content.includes(taskTime) && content.includes(taskDate)) {
              // Delete this block
              await this.client!.blocks.delete({
                block_id: block.id
              });
              removedDuration = task.duration || 0;
              break;
            }
          }
        }
      }

      // Update the total working time by subtracting the removed task duration
      if (removedDuration > 0) {
        const existingTask = await this.client!.pages.retrieve({ page_id: pageId });
        if ('properties' in existingTask) {
          let currentWorkingText = '00:00:00';
          if (existingTask.properties.Working?.type === 'rich_text') {
            const richText = existingTask.properties.Working.rich_text[0];
            if (richText && 'text' in richText) {
              currentWorkingText = richText.text.content || '00:00:00';
            }
          }
          const currentSeconds = this.parseTimeToSeconds(currentWorkingText);
          const newTotalSeconds = Math.max(0, currentSeconds - removedDuration);

          await this.client!.pages.update({
            page_id: pageId,
            properties: {
              Working: {
                rich_text: [
                  {
                    text: {
                      content: formatTime(newTotalSeconds)
                    }
                  }
                ]
              }
            }
          });
        }
      }

      return { removed: true, removedDuration };
    } catch (error) {
      console.error('Error removing task session from Notion:', error);
      throw error;
    }
  }
} 