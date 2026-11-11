interface EvalOutcome {
  value?: unknown;
  error?: unknown;
}

let evalCounter = 0;

/**
 * Evaluates plugin source without `eval` or `new Function`.
 *
 * Yapin's Content-Security-Policy does not allow `unsafe-eval`, but it does
 * allow inline scripts. A short-lived inline script evaluates the plugin
 * expression inside a function that receives the `yapmod` API, then leaves the
 * result on a temporary global for the caller to collect. The temporary
 * globals and the script element are removed immediately.
 *
 * The plugin source is an expression. It may be an object literal or a
 * function that returns one.
 */
export function evaluatePluginSource(source: string, api: unknown): unknown {
  const globals = globalThis as Record<string, unknown>;
  const token = `${Date.now().toString(36)}_${(evalCounter++).toString(36)}`;
  const apiKey = `__yapmod_api_${token}`;
  const resultKey = `__yapmod_result_${token}`;
  const script = document.createElement('script');

  globals[apiKey] = api;

  script.textContent = `
(function (yapmod) {
  try {
    let value = (function () {
      return ${source}
    })();
    if (typeof value === 'function') value = value(yapmod);
    globalThis[${JSON.stringify(resultKey)}] = { value: value };
  } catch (error) {
    globalThis[${JSON.stringify(resultKey)}] = { error: error };
  }
})(globalThis[${JSON.stringify(apiKey)}]);
`;

  const parent = document.head ?? document.documentElement;

  try {
    parent.append(script);
    script.remove();

    const outcome = globals[resultKey] as EvalOutcome | undefined;
    if (!outcome) throw new Error('Plugin code could not be parsed.');

    if ('error' in outcome) throw outcome.error;
    return outcome.value;
  } finally {
    script.remove();
    delete globals[apiKey];
    delete globals[resultKey];
  }
}
