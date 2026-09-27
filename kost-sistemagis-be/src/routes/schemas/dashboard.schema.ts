// src/routes/schemas/dashboard.schema.ts
import { standardErrorResponses } from './common.schema';

export const getDashboardSchema = {
  tags: ['Dashboard'],
  summary: 'Get dashboard KPI and overview data',
  description: 'Retrieves aggregated KPIs, revenue growth charts, occupancy distribution, recent logs, and system alerts. Data is automatically scoped to the kost buildings managed by the current user.',
  querystring: {
    type: 'object',
    properties: {
      kostId: { type: 'string', description: 'Optional kost building ID to filter metrics for a specific building' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            kpis: {
              type: 'object',
              properties: {
                totalRooms: { type: 'integer' },
                occupiedRooms: { type: 'integer' },
                availableRooms: { type: 'integer' },
                occupancyRate: { type: 'number' },
                monthlyRevenue: { type: 'number' },
                outstandingRevenue: { type: 'number' },
                rfidDoorsCount: { type: 'integer' },
                laundryCount: { type: 'integer' }
              }
            },
            charts: {
              type: 'object',
              properties: {
                revenueGrowth: {
                  type: 'object',
                  properties: {
                    labels: { type: 'array', items: { type: 'string' } },
                    data: { type: 'array', items: { type: 'number' } }
                  }
                },
                occupancyDistribution: {
                  type: 'object',
                  properties: {
                    labels: { type: 'array', items: { type: 'string' } },
                    data: { type: 'array', items: { type: 'integer' } }
                  }
                }
              }
            },
            recentRfidLogs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  residentName: { type: 'string' },
                  avatarUrl: { type: 'string', nullable: true },
                  roomNumber: { type: 'string' },
                  deviceName: { type: 'string' },
                  status: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            },
            recentPayments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  residentName: { type: 'string' },
                  amount: { type: 'number' },
                  status: { type: 'string' },
                  paymentMethod: { type: 'string' },
                  createdAt: { type: 'string' }
                }
              }
            },
            systemAlerts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    ...standardErrorResponses
  }
};
