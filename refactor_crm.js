const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'apps/admin-panel/src/pages');
const adminApiFile = path.join(__dirname, 'apps/admin-panel/src/services/adminApi.js');

const crmModules = {
  'Leads.jsx': { endpoint: '/crm/leads', stateName: 'leads', defaultVal: '[]' },
  'ClientTiers.jsx': { endpoint: '/crm/client-tiers', stateName: 'tierConfig', defaultVal: '[]' },
  'APIKeys.jsx': { endpoint: '/crm/api-keys', stateName: 'apiKeys', defaultVal: '[]' },
  'Network.jsx': { endpoint: '/crm/network-nodes', stateName: 'masters', defaultVal: '[]' },
  'CorporateActions.jsx': { endpoint: '/crm/corporate-actions', stateName: 'pendingActions', defaultVal: '[]' },
  'Templates.jsx': { endpoint: '/crm/notification-templates', stateName: 'templates', defaultVal: '[]' },
};

// 1. Update adminApi.js
let apiContent = fs.readFileSync(adminApiFile, 'utf8');
if (!apiContent.includes('// CRM')) {
  const crmMethods = `
  // CRM
  getLeads: () => request('/admin/crm/leads'),
  getClientTiers: () => request('/admin/crm/client-tiers'),
  getApiKeys: () => request('/admin/crm/api-keys'),
  getNetworkNodes: () => request('/admin/crm/network-nodes'),
  getCorporateActions: () => request('/admin/crm/corporate-actions'),
  getNotificationTemplates: () => request('/admin/crm/notification-templates'),
`;
  apiContent = apiContent.replace('export const adminApi = {', 'export const adminApi = {' + crmMethods);
  fs.writeFileSync(adminApiFile, apiContent);
}

// 2. Update JSX files
for (const [file, config] of Object.entries(crmModules)) {
  const filePath = path.join(pagesDir, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace static array with state
  const constRegex = new RegExp('const ' + config.stateName + ' = \\\\[[\\\\s\\\\S]*?\\\\\\];', 'm');
  if (constRegex.test(content)) {
    content = content.replace(constRegex, '');
    
    // Check if useState exists
    if (!content.includes('useState')) {
      content = content.replace('import {', 'import { useState, useEffect,');
    } else if (!content.includes('useEffect')) {
      content = content.replace('useState', 'useState, useEffect');
    }
    
    if (!content.includes('adminApi')) {
      content = "import { adminApi } from '../services/adminApi';\\n" + content;
    }

    const componentRegex = /export default function [a-zA-Z]+\(\) \{/;
    if (componentRegex.test(content)) {
      const fetchLogic = `
  const [` + config.stateName + `, set` + config.stateName.charAt(0).toUpperCase() + config.stateName.slice(1) + `] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminApi.get` + config.stateName.charAt(0).toUpperCase() + config.stateName.slice(1) + `();
        set` + config.stateName.charAt(0).toUpperCase() + config.stateName.slice(1) + `(res.` + config.stateName + ` || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
`;
      content = content.replace(componentRegex, (match) => match + '\\n' + fetchLogic);
    }

    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}

// 3. Replace all alerts with generic toast/console
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("alert('Action triggered. Backend integration pending.')")) {
    content = content.replace(/alert\('Action triggered\. Backend integration pending\.'\)/g, "console.log('Action triggered')");
    fs.writeFileSync(filePath, content);
    console.log('Cleaned alerts in ' + file);
  }
}
