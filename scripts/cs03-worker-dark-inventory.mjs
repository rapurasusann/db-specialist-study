// Read-only normalization. Route enumeration must cover every account zone.
export async function readDarkInventory(reader) {
 const [settings, exposure, routes, domains] = await Promise.all([
  reader.settings(), reader.exposure(), reader.routes(), reader.domains()
 ]);
 if (!Array.isArray(settings?.bindings) ||
     typeof exposure?.enabled !== 'boolean' ||
     typeof exposure?.previews_enabled !== 'boolean' ||
     routes?.complete !== true || domains?.complete !== true ||
     !Array.isArray(routes.items) || !Array.isArray(domains.items)) {
  throw Error('WORKER_INVENTORY_INCOMPLETE');
 }
 const bindings = settings.bindings.map(b => {
  if (b.type === 'durable_object_namespace') {
   return {name:b.name,type:b.type,class_name:b.class_name,namespace_id:b.namespace_id,script_name:b.script_name,environment:b.environment};
  }
  if (b.type === 'secret_text') return {name:b.name,type:b.type};
  // Unknown binding types cannot be compared safely without a defined schema.
  throw Error('WORKER_BINDING_TYPE_UNSUPPORTED');
 });
 return {workersDev:exposure.enabled,preview:exposure.previews_enabled,
  routes:routes.items,domains:domains.items,bindings,inventoryComplete:true};
}
