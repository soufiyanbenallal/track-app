import { Client } from '@notionhq/client';
import { Task, Project } from './database';

export interface NotionDatabase {
  id: string;
  title: string;
  properties: Record<string, any>;
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
      const response = await this.client.pages.create({
        parent: {
          database_id: project.notionDatabaseId
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: task.description
                }
              }
            ]
          },
          Status: {
            select: {
              name: task.isPaid ? 'Paid' : 'Unpaid'
            }
          },
          Duration: {
            number: task.duration ? task.duration / 3600 : 0 // Convert seconds to hours
          },
          'Start Time': {
            date: {
              start: task.startTime
            }
          },
          'End Time': {
            date: {
              start: task.endTime || new Date().toISOString()
            }
          },
          Project: {
            rich_text: [
              {
                text: {
                  content: project.name
                }
              }
            ]
          }
        }
      });

      return response;
    } catch (error) {
      console.error('Error syncing task to Notion:', error);
      throw error;
    }
  }

  async updateTask(task: Task, _project: Project, notionPageId: string): Promise<any> {
    if (!this.client) {
      throw new Error('Notion API key not set');
    }

    try {
      const response = await this.client.pages.update({
        page_id: notionPageId,
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: task.description
                }
              }
            ]
          },
          Status: {
            select: {
              name: task.isPaid ? 'Paid' : 'Unpaid'
            }
          },
          Duration: {
            number: task.duration ? task.duration / 3600 : 0
          },
          'End Time': {
            date: {
              start: task.endTime || new Date().toISOString()
            }
          }
        }
      });

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