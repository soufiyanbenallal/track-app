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
      // First, get the database to check available properties
      // const database = await this.client.databases.retrieve({
      //   database_id: project.notionDatabaseId
      // });
      
      // const hasDescriptionProperty = 'Description' in database.properties;
      
      const response = await this.client.pages.create({
        parent: {
          database_id: project.notionDatabaseId
        },
        properties: {
          'Task name': {
            title: [
              {
                text: {
                  content: task.projectName
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
              start: formatDate(task.endTime || task.startTime ||new Date().toISOString())
            }
          },
          Paid: {
            checkbox: task.isPaid ? true : false
          },
          // Only add Description property if it exists in the database
          // ...(hasDescriptionProperty && {
          //   Description: {
          //     rich_text: [
          //       {
          //         text: {
          //           content: task.description || ''
          //         }
          //       }
          //     ]
          //   }
          // })
        },
        
        // Add the task description as page content/children
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: task.description || ''
                  }
                }
              ]
            }
          }
        ]
      });

      return response;
    } catch (error) {
      console.error('Error syncing task to Notion:', error);
      throw error;
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
} 