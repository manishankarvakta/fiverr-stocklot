#!/usr/bin/env node
/**
 * Communication Coverage Auditor
 * Compares backend endpoint inventory vs frontend usage
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8001';

/**
 * Load backend endpoint inventory from introspection API
 */
async function loadBackendInventory() {
  try {
    console.log('🔍 Loading backend endpoint inventory...');
    
    // Try to fetch from introspection endpoint first
    const fetch = (await import('node-fetch')).default;
    
    try {
      const endpointsResponse = await fetch(`${BACKEND_BASE_URL}/api/__introspection/endpoints`);
      const sseResponse = await fetch(`${BACKEND_BASE_URL}/api/__introspection/sse-topics`);
      
      if (endpointsResponse.ok && sseResponse.ok) {
        const endpointsData = await endpointsResponse.json();
        const sseData = await sseResponse.json();
        
        return {
          endpoints: endpointsData.endpoints || [],
          sseTopics: sseData.topics || [],
          source: 'introspection_api'
        };
      } else {
        console.warn('⚠️ Introspection API not available, trying fallback...');
      }
    } catch (apiError) {
      console.warn('⚠️ Could not connect to backend introspection API:', apiError.message);
    }
    
    // Fallback: try to load from generated OpenAPI spec
    try {
      console.log('📄 Attempting to load from OpenAPI specification...');
      const openApiData = JSON.parse(await fs.readFile('openapi.gen.json', 'utf8'));
      
      const endpoints = Object.keys(openApiData.paths || {}).map(path => ({
        path,
        method: Object.keys(openApiData.paths[path] || {}),
        source: 'openapi'
      }));
      
      return {
        endpoints,
        sseTopics: [], // OpenAPI doesn't typically include SSE topics
        source: 'openapi_spec'
      };
    } catch (openApiError) {
      console.warn('⚠️ OpenAPI spec not available:', openApiError.message);
    }
    
    // Final fallback: use static endpoint list (for demonstration)
    console.warn('📋 Using static endpoint inventory as fallback...');
    return {
      endpoints: [
        { path: '/api/auth/login', method: ['POST'] },
        { path: '/api/auth/register', method: ['POST'] },
        { path: '/api/auth/logout', method: ['POST'] },
        { path: '/api/listings', method: ['GET', 'POST'] },
        { path: '/api/listings/:id', method: ['GET', 'PUT', 'DELETE'] },
        { path: '/api/orders', method: ['GET', 'POST'] },
        { path: '/api/orders/:id', method: ['GET', 'PUT'] },
        { path: '/api/checkout/preview', method: ['POST'] },
        { path: '/api/admin/moderation/stats', method: ['GET'] },
        { path: '/api/admin/roles/requests', method: ['GET'] },
        { path: '/api/admin/roles/requests/:id/approve', method: ['POST'] },
        { path: '/api/admin/roles/requests/:id/reject', method: ['POST'] },
        { path: '/api/admin/disease/zones', method: ['GET'] },
        { path: '/api/admin/disease/changes', method: ['GET'] },
        { path: '/api/admin/config/fees', method: ['GET', 'POST'] },
        { path: '/api/admin/config/flags', method: ['GET'] },
        { path: '/api/admin/config/flags/:key', method: ['POST'] }
      ],
      sseTopics: [
        'admin.stats.updated',
        'admin.role.request.created',
        'orders.updated',
        'checkout.preview.updated',
        'heartbeat'
      ],
      source: 'static_fallback'
    };
    
  } catch (error) {
    console.error('❌ Error loading backend inventory:', error);
    throw error;
  }
}

/**
 * Load frontend scan results
 */
async function loadFrontendScan() {
  try {
    const scanData = JSON.parse(await fs.readFile('comm-scan.frontend.json', 'utf8'));
    return scanData;
  } catch (error) {
    console.error('❌ Could not load frontend scan results. Run frontend scan first.');
    throw error;
  }
}

/**
 * Normalize API paths for comparison
 */
function normalizePath(path) {
  return path
    .replace(/:([a-zA-Z_]+)/g, ':param')  // Backend param style
    .replace(/\{[^}]+\}/g, ':param')      // OpenAPI param style
    .replace(/\/\d+/g, '/:id')            // Numeric IDs
    .replace(/\/[0-9a-f-]{36}/g, '/:uuid') // UUIDs
    .replace(/\?.*$/g, '')                // Remove query parameters for matching
    .toLowerCase()
    .replace(/\/$/, '');  // Remove trailing slash
}

/**
 * Check if a frontend path matches any backend endpoint
 */
function findMatchingBackendEndpoint(frontendPath, backendEndpoints) {
  const normalizedFrontend = normalizePath(frontendPath);
  
  return backendEndpoints.find(endpoint => {
    const normalizedBackend = normalizePath(endpoint.path);
    
    // Exact match
    if (normalizedFrontend === normalizedBackend) {
      return true;
    }
    
    // Handle query parameter variations
    const frontendWithoutQuery = frontendPath.split('?')[0];
    const backendWithoutQuery = endpoint.path.split('?')[0];
    
    if (normalizePath(frontendWithoutQuery) === normalizePath(backendWithoutQuery)) {
      return true;
    }
    
    // Fuzzy match for parameterized paths
    const frontendParts = normalizePath(frontendWithoutQuery).split('/');
    const backendParts = normalizePath(backendWithoutQuery).split('/');
    
    if (frontendParts.length === backendParts.length) {
      return frontendParts.every((part, index) => {
        const backendPart = backendParts[index];
        return part === backendPart || 
               part === ':param' || backendPart === ':param' ||
               part === ':id' || backendPart === ':id' ||
               part === ':uuid' || backendPart === ':uuid';
      });
    }
    
    return false;
  });
}

/**
 * Generate communication coverage report
 */
async function generateReport() {
  console.log('📊 Generating communication coverage report...');
  
  const backend = await loadBackendInventory();
  const frontend = await loadFrontendScan();
  
  console.log(`📡 Backend: ${backend.endpoints.length} endpoints, ${backend.sseTopics.length} SSE topics (source: ${backend.source})`);
  console.log(`🖥️ Frontend: ${frontend.discovered.apis.length} API calls, ${frontend.discovered.sseTopics.length} SSE topics`);
  
  // Find missing backend implementations
  const missingInBackend = [];
  for (const frontendApi of frontend.discovered.apis) {
    const match = findMatchingBackendEndpoint(frontendApi, backend.endpoints);
    if (!match) {
      missingInBackend.push(frontendApi);
    }
  }
  
  // Find unused backend endpoints
  const unusedInFrontend = [];
  for (const backendEndpoint of backend.endpoints) {
    const isUsed = frontend.discovered.apis.some(frontendApi => 
      findMatchingBackendEndpoint(frontendApi, [backendEndpoint])
    );
    if (!isUsed) {
      unusedInFrontend.push(backendEndpoint.path);
    }
  }
  
  // SSE topic analysis
  const frontendSseTopics = new Set(frontend.discovered.sseTopics);
  const backendSseTopics = new Set(backend.sseTopics);
  
  const sseMissingInBackend = [...frontendSseTopics].filter(topic => !backendSseTopics.has(topic));
  const sseUnusedInFrontend = [...backendSseTopics].filter(topic => !frontendSseTopics.has(topic));
  
  // Component coverage analysis
  const componentCoverage = {};
  for (const [component, data] of Object.entries(frontend.componentApiMap || {})) {
    const matchedApis = data.apis.filter(api => 
      findMatchingBackendEndpoint(api, backend.endpoints)
    );
    const unmatchedApis = data.apis.filter(api => 
      !findMatchingBackendEndpoint(api, backend.endpoints)
    );
    
    componentCoverage[component] = {
      file: data.file,
      total_apis: data.apis.length,
      matched_apis: matchedApis.length,
      unmatched_apis: unmatchedApis.length,
      unmatched_list: unmatchedApis,
      sse_topics: data.sseTopics.length,
      coverage_percentage: data.apis.length > 0 ? Math.round((matchedApis.length / data.apis.length) * 100) : 100
    };
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    backend_source: backend.source,
    summary: {
      backend_endpoints: backend.endpoints.length,
      backend_sse_topics: backend.sseTopics.length,
      frontend_api_calls: frontend.discovered.apis.length,
      frontend_sse_topics: frontend.discovered.sseTopics.length,
      missing_in_backend: missingInBackend.length,
      unused_in_frontend: unusedInFrontend.length,
      sse_missing_in_backend: sseMissingInBackend.length,
      sse_unused_in_frontend: sseUnusedInFrontend.length
    },
    gaps: {
      missingInBackend: missingInBackend.sort(),
      unusedInFrontend: unusedInFrontend.sort(),
      sseMissingInBackend: sseMissingInBackend.sort(),
      sseUnusedInFrontend: sseUnusedInFrontend.sort()
    },
    component_coverage: componentCoverage,
    recommendations: generateRecommendations(missingInBackend, unusedInFrontend, sseMissingInBackend, componentCoverage)
  };
  
  return report;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(missingInBackend, unusedInFrontend, sseMissingInBackend, componentCoverage) {
  const recommendations = [];
  
  if (missingInBackend.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Missing Backend Implementation',
      message: `${missingInBackend.length} frontend API calls have no backend implementation`,
      action: 'Implement missing backend endpoints or update frontend calls',
      items: missingInBackend.slice(0, 5) // Show first 5
    });
  }
  
  if (sseMissingInBackend.length > 0) {
    recommendations.push({
      priority: 'HIGH', 
      category: 'Missing SSE Topics',
      message: `${sseMissingInBackend.length} SSE topics used by frontend are not declared on backend`,
      action: 'Add SSE topics to backend registry or remove unused frontend subscriptions',
      items: sseMissingInBackend
    });
  }
  
  if (unusedInFrontend.length > 5) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Unused Backend Endpoints',
      message: `${unusedInFrontend.length} backend endpoints have no frontend consumers`,
      action: 'Consider deprecating unused endpoints or add frontend integration',
      items: unusedInFrontend.slice(0, 10)
    });
  }
  
  // Find components with low coverage
  const lowCoverageComponents = Object.entries(componentCoverage)
    .filter(([_, data]) => data.coverage_percentage < 80 && data.total_apis > 2)
    .sort((a, b) => a[1].coverage_percentage - b[1].coverage_percentage);
  
  if (lowCoverageComponents.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Low Component Coverage',
      message: `${lowCoverageComponents.length} components have missing backend implementations`,
      action: 'Review and implement missing endpoints for these components',
      items: lowCoverageComponents.slice(0, 5).map(([name, data]) => 
        `${name} (${data.coverage_percentage}% coverage, ${data.unmatched_apis.length} missing)`
      )
    });
  }
  
  return recommendations;
}

/**
 * Format report as Markdown
 */
function formatReportAsMarkdown(report) {
  const mdSections = [];
  
  mdSections.push('# 📡 StockLot Communication Coverage Report');
  mdSections.push(`Generated: ${report.timestamp}`);
  mdSections.push(`Backend Source: ${report.backend_source}`);
  mdSections.push('');
  
  // Summary
  mdSections.push('## 📊 Summary');
  mdSections.push('| Metric | Backend | Frontend | Status |');
  mdSections.push('|--------|---------|----------|--------|');
  mdSections.push(`| API Endpoints | ${report.summary.backend_endpoints} | ${report.summary.frontend_api_calls} | ${report.summary.missing_in_backend === 0 ? '✅' : '❌'} |`);
  mdSections.push(`| SSE Topics | ${report.summary.backend_sse_topics} | ${report.summary.frontend_sse_topics} | ${report.summary.sse_missing_in_backend === 0 ? '✅' : '❌'} |`);
  mdSections.push(`| Missing in Backend | - | ${report.summary.missing_in_backend} | ${report.summary.missing_in_backend === 0 ? '✅' : '❌'} |`);
  mdSections.push(`| Unused in Frontend | ${report.summary.unused_in_frontend} | - | ℹ️ |`);
  mdSections.push('');
  
  // Gaps
  if (report.gaps.missingInBackend.length > 0) {
    mdSections.push('## ❌ Missing Backend Implementations');
    mdSections.push('_Frontend references these endpoints but backend doesn\'t implement them:_');
    mdSections.push('');
    report.gaps.missingInBackend.forEach(endpoint => {
      mdSections.push(`- \`${endpoint}\``);
    });
    mdSections.push('');
  }
  
  if (report.gaps.sseMissingInBackend.length > 0) {
    mdSections.push('## 📡 Missing SSE Topics');
    mdSections.push('_Frontend listens to these topics but backend doesn\'t declare them:_');
    mdSections.push('');
    report.gaps.sseMissingInBackend.forEach(topic => {
      mdSections.push(`- \`${topic}\``);
    });
    mdSections.push('');
  }
  
  if (report.gaps.unusedInFrontend.length > 0) {
    mdSections.push('## ℹ️ Unused Backend Endpoints');
    mdSections.push('_Backend implements these but frontend doesn\'t use them:_');
    mdSections.push('');
    const showCount = Math.min(10, report.gaps.unusedInFrontend.length);
    report.gaps.unusedInFrontend.slice(0, showCount).forEach(endpoint => {
      mdSections.push(`- \`${endpoint}\``);
    });
    if (report.gaps.unusedInFrontend.length > showCount) {
      mdSections.push(`- _... and ${report.gaps.unusedInFrontend.length - showCount} more_`);
    }
    mdSections.push('');
  }
  
  // Component Coverage
  mdSections.push('## 🧩 Component Coverage');
  const sortedComponents = Object.entries(report.component_coverage)
    .sort((a, b) => b[1].coverage_percentage - a[1].coverage_percentage);
  
  if (sortedComponents.length > 0) {
    mdSections.push('| Component | Coverage | APIs | Missing |');
    mdSections.push('|-----------|----------|------|---------|');
    sortedComponents.forEach(([name, data]) => {
      const status = data.coverage_percentage === 100 ? '✅' : data.coverage_percentage >= 80 ? '⚠️' : '❌';
      mdSections.push(`| ${name} | ${status} ${data.coverage_percentage}% | ${data.total_apis} | ${data.unmatched_apis} |`);
    });
    mdSections.push('');
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    mdSections.push('## 🎯 Recommendations');
    report.recommendations.forEach(rec => {
      const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      mdSections.push(`### ${priority} ${rec.category}`);
      mdSections.push(rec.message);
      mdSections.push(`**Action:** ${rec.action}`);
      if (rec.items && rec.items.length > 0) {
        rec.items.forEach(item => mdSections.push(`- ${item}`));
      }
      mdSections.push('');
    });
  }
  
  return mdSections.join('\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting communication coverage audit...');
    
    const report = await generateReport();
    
    // Save JSON report
    await fs.writeFile('comm-report.json', JSON.stringify(report, null, 2));
    
    // Save Markdown report
    const markdown = formatReportAsMarkdown(report);
    await fs.writeFile('comm-report.md', markdown);
    
    // Print to console
    console.log(markdown);
    
    // Determine exit code based on critical issues
    const criticalIssues = report.summary.missing_in_backend + report.summary.sse_missing_in_backend;
    
    if (criticalIssues > 0) {
      console.error(`\n❌ Communication audit failed: ${criticalIssues} critical issues found.`);
      process.exit(1);
    } else {
      console.log('\n✅ Communication audit passed: No critical issues found.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Communication audit failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateReport, loadBackendInventory, loadFrontendScan };