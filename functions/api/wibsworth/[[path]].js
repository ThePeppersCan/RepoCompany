import config from '../../../dashboard-config.json';
import { createWibsworthHandler } from '../../../lib/wibsworth-service.mjs';
import { retrieveKnowledge, isCanonicalProduct } from '../../../lib/wibsworth-knowledge.mjs';

const handler = createWibsworthHandler({ config, retrieveKnowledge, isCanonicalProduct });
export const onRequest = context => handler(context);
