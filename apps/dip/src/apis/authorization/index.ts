import { post } from '@/utils/http';

const apis = {
  resourceTypeOperation: '/api/authorization/v1/resource-type-operation',
};

export function postResourceTypeOperation(data: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  resource_types: string[];
}) {
  return post(apis.resourceTypeOperation, { body: data }) as Promise<
    Array<{ resource_type: string; operation: string[] }>
  >;
}

