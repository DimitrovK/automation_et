export type DeploymentLogEntry = {
  id: string;
  timestamp: Date;
  type: 'info' | 'request' | 'response' | 'success' | 'error' | 'loading';
  message: string;
  data?: any;
};

export const createLogEntry = (
  type: DeploymentLogEntry['type'],
  message: string,
  data?: any,
): DeploymentLogEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: new Date(),
  type,
  message,
  data,
});
