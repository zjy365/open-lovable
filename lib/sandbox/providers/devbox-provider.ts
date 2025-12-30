import { DevboxRuntime, DevboxSDK } from 'devbox-sdk';
import { SandboxProvider, SandboxInfo, CommandResult } from '../types';
import { appConfig } from '@/config/app.config';

export class DevboxProvider extends SandboxProvider {
  private existingFiles: Set<string> = new Set();
  private sdk: DevboxSDK | null = null;
  private devbox: any = null;

  async createSandbox(): Promise<SandboxInfo> {
    try {
      // Kill existing sandbox if any
      if (this.devbox) {
        try {
          await this.devbox.delete();
        } catch (e) {
          console.error('[DevboxProvider] Failed to delete existing devbox:', e);
        }
        this.devbox = null;
      }

      // Close existing SDK if any
      if (this.sdk) {
        try {
          await this.sdk.close();
        } catch (e) {
          console.error('[DevboxProvider] Failed to close existing SDK:', e);
        }
        this.sdk = null;
      }

      // Clear existing files tracking
      this.existingFiles.clear();

      // Initialize SDK
      const kubeconfig = this.config.devbox?.kubeconfig || process.env.KUBECONFIG;

      if (!kubeconfig) {
        throw new Error('KUBECONFIG environment variable is required');
      }

      this.sdk = new DevboxSDK({
        kubeconfig,
        http: {
          timeout: 300000,
          retries: 3,
          rejectUnauthorized: false,
        },
      });

      // Create devbox
      const devboxName = `sandbox-${Date.now()}`;
      const cpu = 2; // Fixed: 2 cores
      const memory = 4; // Fixed: 4 GB

      this.devbox = await this.sdk.createDevbox({
        name: devboxName,
        runtime: DevboxRuntime.TEST_AGENT,
        resource: {
          cpu,
          memory,
        },
      });

      console.log('[DevboxProvider] Devbox created:', this.devbox.name);

      // Start the devbox
      await this.devbox.start();
      console.log('[DevboxProvider] Devbox started');

      // Wait for Running status with error checking
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts) {
        const currentDevbox = await this.sdk.getDevbox(devboxName);

        if (currentDevbox.status === 'Running') {
          console.log('[DevboxProvider] Devbox is Running');
          break;
        }

        // Check for failure states
        if (currentDevbox.status === 'Failed' || currentDevbox.status === 'Error') {
          throw new Error(`Devbox failed to start: ${currentDevbox.status}`);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Devbox failed to reach Running status within timeout');
      }

      const sandboxId = this.devbox.name || devboxName;

      // Configure npm registry (from full-lifecycle.ts)
      // npm config is global, no need for cwd parameter
      try {
        await this.devbox.execSync({
          command: 'npm',
          args: ['config', 'set', 'registry', 'https://registry.npmmirror.com'],
          env: { HOME: '/home/devbox' },
        });
        console.log('[DevboxProvider] npm registry configured');
      } catch (error) {
        console.warn('[DevboxProvider] Failed to configure npm registry:', error);
      }

      // Get preview URL for port 5173 (Vite default port)
      let sandboxUrl = '';
      try {
        const previewLink = await this.devbox.getPreviewLink(5173);
        sandboxUrl = previewLink.url;
        console.log('[DevboxProvider] Preview URL:', sandboxUrl);
      } catch (error) {
        console.warn('[DevboxProvider] Failed to get preview URL:', error);
        // Fallback: use devbox name
        sandboxUrl = `devbox://${sandboxId}`;
      }

      this.sandboxInfo = {
        sandboxId,
        url: sandboxUrl,
        provider: 'devbox',
        createdAt: new Date(),
      };

      return this.sandboxInfo;

    } catch (error) {
      console.error('[DevboxProvider] Error creating sandbox:', error);
      throw error;
    }
  }

  async runCommand(command: string, timeout?: number): Promise<CommandResult> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    try {
      // For complex commands with &&, ||, pipes, etc., use shell
      // Otherwise, parse into cmd and args
      const needsShell = /[&|><;`$()]/.test(command);

      let result;
      if (needsShell) {
        // Use shell for complex commands
        result = await this.devbox.execSync({
          command: 'sh',
          args: ['-c', command],
          cwd: appConfig.devbox.workingDirectory,
          timeout: timeout || 300000, // Default 5 minutes for shell commands
        });
      } else {
        // Simple command: parse into cmd and args
        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        result = await this.devbox.execSync({
          command: cmd,
          args: args,
          cwd: appConfig.devbox.workingDirectory,
          timeout: timeout || 120000, // Default 2 minutes for simple commands
        });
      }

      return {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.exitCode || 0,
        success: (result.exitCode || 0) === 0,
      };
    } catch (error: any) {
      return {
        stdout: '',
        stderr: error.message || 'Command failed',
        exitCode: 1,
        success: false,
      };
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const fullPath = path.startsWith('/') ? path : `${appConfig.devbox.workingDirectory}/${path}`;

    // Ensure parent directory exists before writing file
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (dirPath) {
      try {
        await this.devbox.execSync({
          command: 'mkdir',
          args: ['-p', dirPath],
        });
      } catch (error) {
        console.warn(`[DevboxProvider] Failed to create directory ${dirPath}:`, error);
      }
    }

    await this.devbox.writeFile(fullPath, content);
    this.existingFiles.add(path);
  }

  async readFile(path: string): Promise<string> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const fullPath = path.startsWith('/') ? path : `${appConfig.devbox.workingDirectory}/${path}`;
    
    const content = await this.devbox.readFile(fullPath);
    
    // readFile returns Buffer, convert to string
    if (Buffer.isBuffer(content)) {
      return content.toString('utf-8');
    }
    
    return String(content);
  }

  async listFiles(directory: string = appConfig.devbox.workingDirectory): Promise<string[]> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    // SDK returns { files: string[] } (from full-lifecycle.ts line 300)
    const response = await this.devbox.listFiles(directory);
    const files = response.files || [];

    // Filter out node_modules, .git, etc.
    return files.filter((file: string) => {
      const normalizedPath = file.replace(directory, '').replace(/^\//, '');
      return !normalizedPath.includes('node_modules') &&
             !normalizedPath.includes('.git') &&
             !normalizedPath.includes('.next') &&
             !normalizedPath.includes('dist') &&
             !normalizedPath.includes('build');
    });
  }

  async installPackages(packages: string[]): Promise<CommandResult> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const packageList = packages.join(' ');
    const flags = appConfig.packages.useLegacyPeerDeps ? '--legacy-peer-deps' : '';

    const command = flags
      ? `npm install ${flags} ${packageList}`
      : `npm install ${packageList}`;

    const result = await this.runCommand(command, 600000); // 10 minutes timeout for npm install

    // Restart Vite if configured
    if (appConfig.packages.autoRestartVite && result.success) {
      await this.restartViteServer();
    }

    return result;
  }

  async setupViteApp(): Promise<void> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    // Ensure working directory exists first
    try {
      await this.devbox.execSync({
        command: 'mkdir',
        args: ['-p', appConfig.devbox.workingDirectory],
      });
      console.log('[DevboxProvider] Working directory created:', appConfig.devbox.workingDirectory);
    } catch (error) {
      console.warn('[DevboxProvider] Failed to create working directory:', error);
    }

    // Create directory structure
    await this.runCommand(`mkdir -p ${appConfig.devbox.workingDirectory}/src`);

    // Create package.json
    const packageJson = {
      name: "sandbox-app",
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite --host 0.0.0.0",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.0.0",
        vite: "^4.3.9",
        tailwindcss: "^3.3.0",
        postcss: "^8.4.31",
        autoprefixer: "^10.4.16"
      }
    };
    
    await this.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    
    // Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true, // Allow all hosts for devbox compatibility
    hmr: false
  }
})`;
    
    await this.writeFile('vite.config.js', viteConfig);
    
    // Create tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
    
    await this.writeFile('tailwind.config.js', tailwindConfig);
    
    // Create postcss.config.js
    const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    
    await this.writeFile('postcss.config.js', postcssConfig);
    
    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
    
    await this.writeFile('index.html', indexHtml);
    
    // Create src/main.jsx
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
    
    await this.writeFile('src/main.jsx', mainJsx);
    
    // Create src/App.jsx
    const appJsx = `function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <p className="text-lg text-gray-400">
          Devbox Sandbox Ready<br/>
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App`;
    
    await this.writeFile('src/App.jsx', appJsx);
    
    // Create src/index.css
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}`;
    
    await this.writeFile('src/index.css', indexCss);

    console.log('[DevboxProvider] All files created, starting npm install...');

    // Install dependencies (with longer timeout for npm install)
    try {
      console.log('[DevboxProvider] Running: npm install (this may take a while...)');
      const installResult = await this.runCommand(
        `cd ${appConfig.devbox.workingDirectory} && npm install`,
        600000 // 10 minutes timeout for npm install
      );

      if (installResult.exitCode !== 0) {
        console.warn('[DevboxProvider] npm install had issues:', installResult.stderr);
      } else {
        console.log('[DevboxProvider] npm install completed successfully');
      }
    } catch (error: any) {
      console.error('[DevboxProvider] npm install error:', error);
      console.warn('[DevboxProvider] Continuing without npm install - packages may need to be installed manually');
    }

    console.log('[DevboxProvider] Starting Vite dev server...');

    // Start Vite dev server
    // Kill any existing Vite processes
    await this.runCommand(`pkill -f vite || true`);

    // Start Vite in background
    console.log('[DevboxProvider] Running: npm run dev (background)');
    await this.runCommand(`cd ${appConfig.devbox.workingDirectory} && nohup npm run dev > /tmp/vite.log 2>&1 &`);
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, appConfig.devbox.viteStartupDelay));
    
    // Track initial files
    this.existingFiles.add('src/App.jsx');
    this.existingFiles.add('src/main.jsx');
    this.existingFiles.add('src/index.css');
    this.existingFiles.add('index.html');
    this.existingFiles.add('package.json');
    this.existingFiles.add('vite.config.js');
    this.existingFiles.add('tailwind.config.js');
    this.existingFiles.add('postcss.config.js');
  }

  async restartViteServer(): Promise<void> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    // Kill existing Vite process
    await this.runCommand(`pkill -f vite || true`);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start Vite in background
    await this.runCommand(`cd ${appConfig.devbox.workingDirectory} && nohup npm run dev > /tmp/vite.log 2>&1 &`);
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, appConfig.devbox.viteStartupDelay));
  }

  getSandboxUrl(): string | null {
    return this.sandboxInfo?.url || null;
  }

  getSandboxInfo(): SandboxInfo | null {
    return this.sandboxInfo;
  }

  async terminate(): Promise<void> {
    if (this.devbox) {
      try {
        await this.devbox.delete();
      } catch (e) {
        console.error('[DevboxProvider] Failed to delete devbox:', e);
      }
      this.devbox = null;
    }

    if (this.sdk) {
      try {
        await this.sdk.close();
      } catch (e) {
        console.error('[DevboxProvider] Failed to close SDK:', e);
      }
      this.sdk = null;
    }

    this.sandboxInfo = null;
  }

  isAlive(): boolean {
    return !!this.devbox && !!this.sdk;
  }

  // Additional helper methods based on full-lifecycle.ts example

  /**
   * Clone a git repository into the devbox
   * @param url - Repository URL
   * @param targetDir - Target directory path
   */
  async cloneRepository(url: string, targetDir: string): Promise<void> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    // Clean up directory first to avoid clone conflicts
    try {
      await this.devbox.execSync({
        command: 'rm',
        args: ['-rf', targetDir],
      });
    } catch {
      // Ignore errors if directory doesn't exist
    }

    // Clone repository using git.clone API
    await this.devbox.git.clone({
      url,
      targetDir,
    });
  }

  /**
   * Start a long-running process (e.g., dev server)
   * @param command - Command to execute
   * @param args - Command arguments
   * @param cwd - Working directory
   * @returns Process ID and PID
   */
  async startLongRunningProcess(
    command: string,
    args: string[],
    cwd?: string
  ): Promise<{ processId: string; pid: number }> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const process = await this.devbox.executeCommand({
      command,
      args,
      cwd: cwd || appConfig.devbox.workingDirectory,
      timeout: 600, // 10 minutes
    });

    return {
      processId: process.processId,
      pid: process.pid,
    };
  }

  /**
   * Get process status
   * @param processId - Process ID
   * @returns Process status
   */
  async getProcessStatus(processId: string): Promise<{ processStatus: string }> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    return await this.devbox.getProcessStatus(processId);
  }

  /**
   * Get process logs
   * @param processId - Process ID
   * @returns Process logs
   */
  async getProcessLogs(processId: string): Promise<string[]> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const response = await this.devbox.getProcessLogs(processId);
    return response.logs || [];
  }

  /**
   * Get list of open ports
   * @returns List of port numbers
   */
  async getPorts(): Promise<number[]> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const response = await this.devbox.getPorts();
    return response.ports || [];
  }

  /**
   * Get preview URL for a specific port
   * @param port - Port number
   * @returns Preview URL
   */
  async getPreviewLink(port: number): Promise<string> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    const previewLink = await this.devbox.getPreviewLink(port);
    return previewLink.url;
  }

  /**
   * Configure npm registry (useful for faster package installation)
   * @param registry - Registry URL (default: https://registry.npmmirror.com)
   */
  async configureNpmRegistry(registry: string = 'https://registry.npmmirror.com'): Promise<void> {
    if (!this.devbox) {
      throw new Error('No active sandbox');
    }

    await this.devbox.execSync({
      command: 'npm',
      args: ['config', 'set', 'registry', registry],
      cwd: appConfig.devbox.workingDirectory,
    });
    console.log('[DevboxProvider] npm registry configured:', registry);
  }
}

