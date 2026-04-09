export const defaultParamType = 'unknown';

function resolveRef(obj: any, apiSpec: any) {
  if (!obj || !obj.$ref) return obj;

  const refPath = obj.$ref.split('/').slice(1);
  let current = apiSpec;

  for (const key of refPath) {
    if (current?.[key] === undefined) {
      return {};
    }
    current = current[key];
  }

  return resolveRef(current, apiSpec);
}

function processNestedProperties(properties: any, required: any, inStr: string, apiSpec: any): any[] | undefined {
  if (!properties) return undefined;

  return Object.keys(properties).map((name: string) => {
    const property = properties[name];
    const resolvedProperty = resolveRef(property, apiSpec);

    return {
      input_name: name,
      input_type: resolvedProperty.type || defaultParamType,
      input_desc: resolvedProperty.description || '',
      required: Array.isArray(required) ? required.includes(name) : false,
      in: inStr,
      children: processNestedProperties(resolvedProperty.properties, resolvedProperty.required || [], inStr, apiSpec),
    };
  });
}

/** Merge OpenAPI parameters + request_body into the same shape as operator-web AddToolModal. */
export function getInputParamsFromOpenAPISpec(apiSpec: any) {
  const inputParams: any[] = [];

  if (apiSpec?.parameters) {
    const paramInputs = apiSpec.parameters.map((param: any) => {
      const resolvedParam = resolveRef(param, apiSpec);

      return {
        input_name: resolvedParam.name,
        input_type: resolvedParam.schema?.type || defaultParamType,
        input_desc: resolvedParam.description || '',
        required: resolvedParam.required || false,
        in: resolvedParam.in,
        children: processNestedProperties(
          resolvedParam.properties,
          resolvedParam.required || [],
          resolvedParam.in,
          apiSpec
        ),
      };
    });

    inputParams.push(...paramInputs);
  }

  const bodySchema = apiSpec.request_body?.content?.['application/json']?.schema;
  if (bodySchema) {
    const resolvedSchema = resolveRef(bodySchema, apiSpec);
    if (resolvedSchema?.properties) {
      const bodyInputs = processNestedProperties(
        resolvedSchema.properties,
        resolvedSchema.required || [],
        'body',
        apiSpec
      );
      inputParams.push(...(bodyInputs || []));
    }
  }

  return inputParams;
}
