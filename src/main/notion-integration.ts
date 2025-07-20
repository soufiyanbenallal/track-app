import axios from 'axios';

export interface NotionProject {
  id: string;
  name: string;
  url: string;
}

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  project_id: string;
  url: string;
}

export class NotionIntegration {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.notion.com/v1';

  constructor() {
    // Load API key from environment or config
    this.apiKey = process.env.NOTION_API_KEY || null;
  }

  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  public async getProjects(): Promise<NotionProject[]> {
    if (!this.apiKey) {
      throw new Error('Notion API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/databases`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28'
        }
      });

      return response.data.results.map((db: any) => ({
        id: db.id,
        name: db.title[0]?.plain_text || 'Untitled',
        url: db.url
      }));
    } catch (error) {
      console.error('Error fetching Notion projects:', error);
      throw error;
    }
  }

  public async syncTask(taskId: number): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Notion API key not configured');
    }

    // This would implement the logic to sync a task to Notion
    // For now, we'll just log the action
    console.log(`Syncing task ${taskId} to Notion`);
  }

  public async createTaskInNotion(task: any, projectId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Notion API key not configured');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/pages`, {
        parent: { database_id: projectId },
        properties: {
          'Name': {
            title: [
              {
                text: {
                  content: task.description
                }
              }
            ]
          },
          'Status': {
            select: {
              name: 'In Progress'
            }
          },
          'Duration': {
            number: task.duration ? task.duration / 3600 : 0 // Convert seconds to hours
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating task in Notion:', error);
      throw error;
    }
  }

  public async updateTaskInNotion(notionId: string, task: any): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Notion API key not configured');
    }

    try {
      await axios.patch(`${this.baseUrl}/pages/${notionId}`, {
        properties: {
          'Name': {
            title: [
              {
                text: {
                  content: task.description
                }
              }
            ]
          },
          'Duration': {
            number: task.duration ? task.duration / 3600 : 0
          },
          'Status': {
            select: {
              name: task.end_time ? 'Completed' : 'In Progress'
            }
          }
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error updating task in Notion:', error);
      throw error;
    }
  }

  public isConfigured(): boolean {
    return this.apiKey !== null;
  }
} 