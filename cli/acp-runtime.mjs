import { spawn } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { join } from 'node:path';
import * as acp from '@agentclientprotocol/sdk';

export class CodexAcpRuntime {
  constructor({ root, executable, onUpdate, onPermission, onLog = console.log }) {
    this.root = root;
    this.executable = executable;
    this.onUpdate = onUpdate;
    this.onPermission = onPermission;
    this.onLog = onLog;
    this.child = null;
    this.connection = null;
    this.sessionId = null;
    this.configOptions = [];
    this.ready = false;
    this.closed = false;
  }

  async start() {
    if (this.child) throw new Error('Codex ACP runtime is already started');

    const executable = process.env.MAGICBRO_CODEX_ACP_BIN
      || this.executable
      || join(this.root, 'node_modules', '.bin', process.platform === 'win32' ? 'codex-acp.cmd' : 'codex-acp');

    this.child = spawn(executable, [], {
      cwd: this.root,
      env: {
        ...process.env,
        INITIAL_AGENT_MODE: 'agent',
        NO_BROWSER: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.child.stderr.on('data', (chunk) => {
      process.stderr.write(`[codex-acp] ${chunk}`);
    });
    this.child.on('error', (error) => {
      this.ready = false;
      this.onLog(`Codex ACP process error: ${error.message}`);
    });
    this.child.on('exit', (code, signal) => {
      this.ready = false;
      if (!this.closed) this.onLog(`Codex ACP exited (${signal || code})`);
    });

    const stream = acp.ndJsonStream(
      Writable.toWeb(this.child.stdin),
      Readable.toWeb(this.child.stdout),
    );

    const client = acp
      .client({ name: 'magicbro' })
      .onNotification(acp.methods.client.session.update, (ctx) => {
        this.onUpdate?.(ctx.params);
      })
      .onRequest(acp.methods.client.session.requestPermission, async (ctx) => {
        const decision = await this.onPermission?.(ctx.params);
        if (decision) return decision;
        const allowed = ctx.params.options.find((option) => option.kind === 'allow_once');
        return allowed
          ? { outcome: { outcome: 'selected', optionId: allowed.optionId } }
          : { outcome: { outcome: 'cancelled' } };
      });

    this.connection = client.connect(stream);
    const initialized = await this.connection.agent.request(acp.methods.agent.initialize, {
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        session: { configOptions: { boolean: {} } },
      },
      clientInfo: { name: 'magicbro', title: 'MagicBro', version: '0.6.3' },
    });

    const session = await this.connection.agent.request(acp.methods.agent.session.new, {
      cwd: this.root,
      mcpServers: [],
    });

    this.sessionId = session.sessionId;
    this.configOptions = session.configOptions || [];
    this.ready = true;
    this.onLog(`Codex ACP session ready: ${this.sessionId} (protocol ${initialized.protocolVersion})`);
  }

  async setExecutionOptions({ model, reasoningEffort } = {}) {
    this.assertReady();
    if (model) await this.setConfigOption('model', model);
    if (reasoningEffort) await this.setConfigOption('reasoning_effort', reasoningEffort);
  }

  async setConfigOption(configId, value) {
    const response = await this.connection.agent.request(acp.methods.agent.session.setConfigOption, {
      sessionId: this.sessionId,
      configId,
      value,
    });
    if (response.configOptions) this.configOptions = response.configOptions;
  }

  async prompt(blocks) {
    this.assertReady();
    return this.connection.agent.request(acp.methods.agent.session.prompt, {
      sessionId: this.sessionId,
      prompt: blocks,
    });
  }

  async cancel() {
    if (!this.ready) return;
    await this.connection.agent.notify(acp.methods.agent.session.cancel, {
      sessionId: this.sessionId,
    });
  }

  describe() {
    return {
      ready: this.ready,
      sessionId: this.sessionId,
      configOptions: this.configOptions,
    };
  }

  assertReady() {
    if (!this.ready || !this.connection || !this.sessionId) {
      throw new Error('Codex ACP session is not ready');
    }
  }

  async close() {
    this.closed = true;
    this.ready = false;
    try {
      if (this.connection && this.sessionId) {
        await this.connection.agent.request(acp.methods.agent.session.close, {
          sessionId: this.sessionId,
        });
      }
    } catch (error) {
      this.onLog(`Could not close Codex ACP session cleanly: ${error.message}`);
    }
    this.connection?.close();
    this.child?.kill('SIGTERM');
  }
}
