import { HeaderRequestModel } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export function generateHeaders(ownerEmail: string): HeaderRequestModel {
  return {
    correlationId: uuidv4(),
    user: ownerEmail,
    source: 'brickle-admin',
    requestDate: new Date().toISOString()
  };
}

export function createAPIHeaders(adminConfig: { apiKey: string; ownerEmail: string }): Record<string, string> {
  const headers = generateHeaders(adminConfig.ownerEmail);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminConfig.apiKey}`,
    'correlationId': headers.correlationId,
    'user': headers.user,
    'source': headers.source,
    'requestDate': headers.requestDate
  };
}

export function createFormDataHeaders(adminConfig: { apiKey: string; ownerEmail: string }): Record<string, string> {
  const headers = generateHeaders(adminConfig.ownerEmail);
  
  return {
    'Authorization': `Bearer ${adminConfig.apiKey}`,
    'correlationId': headers.correlationId,
    'user': headers.user,
    'source': headers.source,
    'requestDate': headers.requestDate
  };
}