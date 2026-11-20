type Cleanup = () => void;

function runCleanup(cleanup: Cleanup): void {
  try {
    cleanup();
  } catch (error) {
    console.error('[yapmod] plugin cleanup failed', error);
  }
}

/** Owns the resources of a single setup attempt, including callbacks that outlive it. */
export class PluginScope {
  private cleanups: Cleanup[] | undefined = [];
  private pendingUi: Set<() => void> | undefined;

  constructor(replacing: boolean) {
    if (replacing) this.pendingUi = new Set();
  }

  onDispose(cleanup: Cleanup): Cleanup {
    if (this.cleanups) this.cleanups.push(cleanup);
    else runCleanup(cleanup);
    return cleanup;
  }

  install(mount: () => Cleanup): Cleanup {
    if (!this.cleanups) return () => {};
    return this.onDispose(mount());
  }

  // A modal or section can replace the running instance's UI. Delay those
  // requests until evaluation succeeds, and respect any early cancellation.
  installUi(install: () => Cleanup): Cleanup {
    const queue = this.pendingUi;
    if (!queue) return this.install(install);

    let remove: Cleanup | undefined;
    const mount = () => {
      remove = install();
    };
    queue.add(mount);
    return this.onDispose(() => {
      queue.delete(mount);
      remove?.();
    });
  }

  publishUi(): void {
    const queue = this.pendingUi;
    this.pendingUi = undefined;
    if (!queue) return;
    for (const mount of queue) {
      queue.delete(mount);
      mount();
    }
  }

  dispose(): void {
    const cleanups = this.cleanups;
    if (!cleanups) return;
    this.cleanups = undefined;
    this.pendingUi = undefined;
    for (let index = cleanups.length - 1; index >= 0; index -= 1) {
      const cleanup = cleanups[index];
      if (cleanup) runCleanup(cleanup);
    }
  }
}
