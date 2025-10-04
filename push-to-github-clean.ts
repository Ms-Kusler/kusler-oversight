import { Octokit } from '@octokit/rest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  'replit.nix',
  '.config',
  '.cache',
  '.upm',
  '*.tar.gz',
  '*.zip',
  '.env',
  '.env.local',
  'server/public',
  '.DS_Store',
  'push-to-github-clean.ts'
];

function shouldIgnore(path: string): boolean {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(path);
    }
    return path.includes(pattern);
  });
}

function getAllFiles(dir: string, baseDir: string = dir, files: { path: string, content: string }[] = []): { path: string, content: string }[] {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const relativePath = fullPath.substring(baseDir.length + 1);
    
    if (shouldIgnore(relativePath)) {
      continue;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllFiles(fullPath, baseDir, files);
    } else {
      try {
        const content = readFileSync(fullPath, 'utf-8');
        files.push({ path: relativePath, content });
      } catch (err) {
        // Skip binary files
      }
    }
  }
  
  return files;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  const owner = 'Ms-Kusler';
  const repo = 'kusler-oversight';
  
  // Initialize repository with README if empty
  console.log('🔍 Checking repository status...');
  try {
    await octokit.git.getRef({ owner, repo, ref: 'heads/main' });
    console.log('✓ Repository already has main branch');
  } catch (error: any) {
    if (error.status === 409 || error.status === 404) {
      console.log('📝 Initializing empty repository...');
      
      // Create initial README blob
      const readmeBlob = await octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from('# Kusler Oversight\n\nInitializing...').toString('base64'),
        encoding: 'base64'
      });
      
      // Create initial tree
      const initialTree = await octokit.git.createTree({
        owner,
        repo,
        tree: [{
          path: 'README.md',
          mode: '100644',
          type: 'blob',
          sha: readmeBlob.data.sha
        }]
      });
      
      // Create initial commit
      const initialCommit = await octokit.git.createCommit({
        owner,
        repo,
        message: 'Initialize repository',
        tree: initialTree.data.sha,
        parents: []
      });
      
      // Create main branch
      await octokit.git.createRef({
        owner,
        repo,
        ref: 'refs/heads/main',
        sha: initialCommit.data.sha
      });
      
      console.log('✓ Repository initialized');
    }
  }
  
  console.log('📦 Collecting source files (excluding node_modules)...');
  const files = getAllFiles('/home/runner/workspace');
  console.log(`✓ Found ${files.length} source files to upload`);

  if (files.length > 5000) {
    console.error('❌ Too many files. Please check .gitignore');
    process.exit(1);
  }

  console.log('📤 Creating blobs on GitHub...');
  const blobs = [];
  
  // Upload in batches to avoid timeout
  const batchSize = 50;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`  Uploading files ${i + 1} to ${Math.min(i + batchSize, files.length)} of ${files.length}...`);
    
    const batchBlobs = await Promise.all(
      batch.map(async (file) => {
        const blob = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        });
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.data.sha
        };
      })
    );
    
    blobs.push(...batchBlobs);
  }

  console.log(`✓ Created ${blobs.length} blobs`);

  // Get current main branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main'
  });
  const currentCommitSha = ref.object.sha;

  // Create tree
  console.log('🌳 Creating git tree...');
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: blobs
  });
  console.log('✓ Tree created');

  // Create commit
  console.log('💾 Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Initial commit: Kusler Oversight dashboard\n\nMulti-tenant financial operations dashboard for Kusler Consulting clients.',
    tree: tree.sha,
    parents: [currentCommitSha]
  });
  console.log('✓ Commit created');

  // Update main branch
  console.log('🌿 Updating main branch...');
  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: commit.sha
  });

  console.log('\n✅ SUCCESS! Code pushed to GitHub!');
  console.log(`🔗 Repository: https://github.com/${owner}/${repo}`);
  console.log('\n📦 Next step: Deploy to Vercel');
  console.log('   1. Go to https://vercel.com');
  console.log('   2. Import from GitHub: Ms-Kusler/kusler-oversight');
  console.log('   3. Add environment variables:');
  console.log('      - SESSION_SECRET');
  console.log('      - RESEND_API_KEY');
  console.log('   4. Deploy!');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
