#!/usr/bin/env node
/**
 * Frontend Communication Scanner
 * Scans React/TypeScript code for API calls and SSE subscriptions
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

const SRC_DIRS = ['frontend/src'];

// Patterns to find API calls
const API_PATTERNS = [
  // fetch calls
  /fetch\(\s*[`"']([^`"']*\/api\/[^`"']*)[`"']/g,
  /fetch\(\s*`([^`]*\/api\/[^`]*)`/g,
  
  // axios calls
  /axios\.(get|post|put|patch|delete)\(\s*[`"']([^`"']*\/api\/[^`"']*)[`"']/g,
  /axios\.(get|post|put|patch|delete)\(\s*`([^`]*\/api\/[^`]*)`/g,
  
  // custom api client calls  
  /api\.(get|post|put|patch|delete)\(\s*[`"']([^`"']*\/[^`"']*)[`"']/g,
  /api\.(get|post|put|patch|delete)\(\s*`([^`]*\/[^`]*)`/g,
  
  // adminApi client calls
  /adminApi\.(get|post|put|patch|delete)\(\s*[`"']([^`"']*\/[^`"']*)[`"']/g,
  /adminApi\.(get|post|put|patch|delete)\(\s*`([^`]*\/[^`]*)`/g,
  
  // Direct URL construction
  /[`"']\/api\/[^`"']*[`"']/g,
];

// Patterns to find SSE subscriptions
const SSE_PATTERNS = [
  // EventSource connections
  /new\s+EventSource\(\s*[`"']([^`"']*\/api\/[^`"']*)[`"']/g,
  /new\s+EventSource\(\s*`([^`]*\/api\/[^`]*)`/g,
  
  // addEventListener for SSE topics
  /\.addEventListener\(\s*[`"']([a-zA-Z0-9\.\-_]+)[`"']/g,
  
  // onmessage handlers that might reference topics
  /event\.data.*[`"']([a-zA-Z0-9\.\-_]+)[`"']/g,
  
  // SSE topic constants or references
  /SSE_TOPIC[S]?.*[`"']([a-zA-Z0-9\.\-_]+)[`"']/g,
];

// Patterns to find component-endpoint relationships
const COMPONENT_PATTERNS = [
  // Component function declarations
  /(?:function\s+|const\s+)([A-Z][a-zA-Z0-9]*)\s*[=\(]/g,
  
  // React component exports
  /export\s+(?:default\s+)?(?:function\s+)?([A-Z][a-zA-Z0-9]*)/g,
];

async function scanFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const relativeFile = path.relative(process.cwd(), filePath);
  
  const result = {
    file: relativeFile,
    apis: new Set(),
    sseTopics: new Set(),
    sseEndpoints: new Set(),
    components: new Set(),
    lines: content.split('\n').length
  };
  
  // Find API calls
  for (const pattern of API_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Extract the API path from different match groups
      const apiPath = match[2] || match[1] || match[0];
      
      if (apiPath && apiPath.includes('/api/')) {
        // Clean up the API path
        let cleanPath = apiPath;
        if (cleanPath.startsWith('"') || cleanPath.startsWith("'") || cleanPath.startsWith('`')) {
          cleanPath = cleanPath.slice(1);
        }
        if (cleanPath.endsWith('"') || cleanPath.endsWith("'") || cleanPath.endsWith('`')) {
          cleanPath = cleanPath.slice(0, -1);
        }
        
        // Normalize dynamic segments
        cleanPath = cleanPath
          .replace(/\$\{[^}]+\}/g, ':param')  // Template literals
          .replace(/\/[0-9a-f-]{36}/g, '/:uuid')  // UUIDs
          .replace(/\/\d+/g, '/:id')  // Numeric IDs
          .replace(/\/\$\{[^}]*id[^}]*\}/g, '/:id')  // Template ID references
          .replace(/\/\$\{[^}]*\}/g, '/:param');  // Other template params
        
        if (cleanPath.startsWith('/api/')) {
          result.apis.add(cleanPath);
        }
      }
    }
  }
  
  // Find SSE patterns
  for (const pattern of SSE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const value = match[1];
      
      if (value) {
        // If it looks like an endpoint (starts with /), add to SSE endpoints
        if (value.startsWith('/')) {
          result.sseEndpoints.add(value);
        } 
        // If it contains template variables, skip it (not a real topic)
        else if (value.includes('${') || value.includes('BACKEND_URL')) {
          // Skip template literals that aren't actual topics
          continue;
        }
        // If it looks like a topic (contains dots or underscores), add to topics
        else if (value.includes('.') || value.includes('_') || /^[a-z]/.test(value)) {
          // Filter out common false positives
          if (!['click', 'change', 'submit', 'load', 'error', 'message'].includes(value.toLowerCase())) {
            result.sseTopics.add(value);
          }
        }
      }
    }
  }
  
  // Find React components
  for (const pattern of COMPONENT_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const componentName = match[1];
      if (componentName && /^[A-Z]/.test(componentName)) {
        result.components.add(componentName);
      }
    }
  }
  
  // Convert Sets to Arrays for JSON serialization
  return {
    ...result,
    apis: Array.from(result.apis),
    sseTopics: Array.from(result.sseTopics),
    sseEndpoints: Array.from(result.sseEndpoints),
    components: Array.from(result.components)
  };
}

async function scanDirectory(dir) {
  const pattern = path.join(dir, '**/*.{js,jsx,ts,tsx}');
  
  console.log(`   Scanning pattern: ${pattern}`);
  
  const files = await glob(pattern, { 
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
    maxDepth: 10 // Limit search depth
  });
  
  console.log(`   Found ${files.length} files to scan...`);
  
  const results = [];
  const allApis = new Set();
  const allSseTopics = new Set();
  const allSseEndpoints = new Set();
  const allComponents = new Set();
  const componentApiMap = {};
  
  let processed = 0;
  
  for (const file of files) {
    try {
      const result = await scanFile(file);
      processed++;
      
      if (processed % 20 === 0) {
        console.log(`   Progress: ${processed}/${files.length} files...`);
      }
      
      if (result.apis.length || result.sseTopics.length || result.sseEndpoints.length) {
        results.push(result);
        
        // Aggregate data
        result.apis.forEach(api => allApis.add(api));
        result.sseTopics.forEach(topic => allSseTopics.add(topic));
        result.sseEndpoints.forEach(endpoint => allSseEndpoints.add(endpoint));
        result.components.forEach(comp => allComponents.add(comp));
        
        // Map components to their API usage
        result.components.forEach(comp => {
          if (!componentApiMap[comp]) {
            componentApiMap[comp] = { apis: [], sseTopics: [], file: result.file };
          }
          componentApiMap[comp].apis.push(...result.apis);
          componentApiMap[comp].sseTopics.push(...result.sseTopics);
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${file}: ${error.message}`);
    }
  }
  
  console.log(`   Completed scanning ${processed} files.`);
  
  return {
    summary: {
      files_scanned: files.length,
      files_with_communications: results.length,
      total_api_calls: allApis.size,
      total_sse_topics: allSseTopics.size,
      total_sse_endpoints: allSseEndpoints.size,
      total_components: allComponents.size
    },
    discovered: {
      apis: Array.from(allApis).sort(),
      sseTopics: Array.from(allSseTopics).sort(),
      sseEndpoints: Array.from(allSseEndpoints).sort(),
      components: Array.from(allComponents).sort()
    },
    componentApiMap,
    perFile: results
  };
}

async function main() {
  try {
    console.log('🔍 Scanning frontend for API calls and SSE subscriptions...');
    
    const allResults = {
      summary: { files_scanned: 0, files_with_communications: 0, total_api_calls: 0, total_sse_topics: 0, total_sse_endpoints: 0, total_components: 0 },
      discovered: { apis: new Set(), sseTopics: new Set(), sseEndpoints: new Set(), components: new Set() },
      componentApiMap: {},
      perFile: []
    };
    
    // Scan each source directory
    for (const dir of SRC_DIRS) {
      if (await fs.access(dir).then(() => true).catch(() => false)) {
        console.log(`📁 Scanning ${dir}...`);
        const dirResults = await scanDirectory(dir);
        
        // Merge results
        allResults.summary.files_scanned += dirResults.summary.files_scanned;
        allResults.summary.files_with_communications += dirResults.summary.files_with_communications;
        allResults.summary.total_components += dirResults.summary.total_components;
        
        dirResults.discovered.apis.forEach(api => allResults.discovered.apis.add(api));
        dirResults.discovered.sseTopics.forEach(topic => allResults.discovered.sseTopics.add(topic));
        dirResults.discovered.sseEndpoints.forEach(endpoint => allResults.discovered.sseEndpoints.add(endpoint));
        dirResults.discovered.components.forEach(comp => allResults.discovered.components.add(comp));
        
        Object.assign(allResults.componentApiMap, dirResults.componentApiMap);
        allResults.perFile.push(...dirResults.perFile);
      } else {
        console.warn(`⚠️ Directory ${dir} not found, skipping...`);
      }
    }
    
    // Convert Sets to Arrays for final output
    const finalResults = {
      ...allResults,
      summary: {
        ...allResults.summary,
        total_api_calls: allResults.discovered.apis.size,
        total_sse_topics: allResults.discovered.sseTopics.size,
        total_sse_endpoints: allResults.discovered.sseEndpoints.size,
        total_components: allResults.discovered.components.size
      },
      discovered: {
        apis: Array.from(allResults.discovered.apis).sort(),
        sseTopics: Array.from(allResults.discovered.sseTopics).sort(),
        sseEndpoints: Array.from(allResults.discovered.sseEndpoints).sort(),
        components: Array.from(allResults.discovered.components).sort()
      }
    };
    
    // Save results
    await fs.writeFile('comm-scan.frontend.json', JSON.stringify(finalResults, null, 2));
    
    console.log('✅ Frontend scan complete!');
    console.log(`📊 Summary:`);
    console.log(`   Files scanned: ${finalResults.summary.files_scanned}`);
    console.log(`   Files with communications: ${finalResults.summary.files_with_communications}`);
    console.log(`   API endpoints found: ${finalResults.summary.total_api_calls}`);
    console.log(`   SSE topics found: ${finalResults.summary.total_sse_topics}`);
    console.log(`   SSE endpoints found: ${finalResults.summary.total_sse_endpoints}`);
    console.log(`   Components found: ${finalResults.summary.total_components}`);
    console.log(`📄 Results saved to comm-scan.frontend.json`);
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Error during frontend scan:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFile, main };