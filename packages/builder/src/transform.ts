import { transformSync, types as t } from '@babel/core';
import type { PluginObj } from '@babel/core';
import presetSolid from 'babel-preset-solid';
import presetTypescript from '@babel/preset-typescript';

/*
 * Turns plugin source into code the client's loader can evaluate.
 *
 * Pass 1 strips TypeScript and compiles JSX with the Solid preset, which
 * injects its helpers (`template`, `insert`, `Show`, ...) as `solid-js*`
 * imports. Pass 2 rewrites every such import onto the shared instance hanging
 * off the `yapmod` API, so the bundle never resolves — and can never carry —
 * a second copy of Solid. What remains is module code without any `solid-js`
 * imports, ready for esbuild (or a bundler recipe) to wrap in the expression
 * from `expression.ts`.
 */

/** Host-shared modules mapped onto the plugin API members that expose them. */
const SHARED_MODULES: Record<string, string> = {
  'solid-js': 'solid',
  'solid-js/web': 'solidWeb',
  'solid-js/store': 'solidStore',
};

/** Fresh `yapmod.solid...` access — one node per use, never shared. */
function sharedAccess(namespace: string) {
  return t.memberExpression(t.identifier('yapmod'), t.identifier(namespace));
}

function reexportError(source: string): string {
  return (
    `@yapmod/builder cannot re-export from "${source}"; import the bindings ` +
    'and export them locally instead.'
  );
}

function rewriteSharedImports(): PluginObj {
  return {
    name: 'yapmod:rewrite-shared-imports',
    visitor: {
      ImportDeclaration(path) {
        const namespace = SHARED_MODULES[path.node.source.value];
        if (namespace === undefined) return;

        // Pass 1 removes type-only imports; drop any that survived so they
        // can never reach esbuild as a resolvable module.
        if (path.node.importKind === 'type') {
          path.remove();
          return;
        }

        const statements = [];
        const named = [];

        for (const specifier of path.node.specifiers) {
          if (t.isImportNamespaceSpecifier(specifier)) {
            statements.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(specifier.local, sharedAccess(namespace)),
              ]),
            );
            continue;
          }
          if (t.isImportDefaultSpecifier(specifier)) {
            statements.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  specifier.local,
                  t.memberExpression(sharedAccess(namespace), t.identifier('default')),
                ),
              ]),
            );
            continue;
          }
          if (specifier.importKind === 'type') continue;
          named.push(specifier);
        }

        if (named.length > 0) {
          const properties = [];
          for (const specifier of named) {
            const key = t.isIdentifier(specifier.imported)
              ? specifier.imported
              : t.stringLiteral(specifier.imported.value);
            properties.push(t.objectProperty(key, specifier.local));
          }
          statements.push(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.objectPattern(properties), sharedAccess(namespace)),
            ]),
          );
        }

        // A bare `import 'solid-js'` only exists for side effects the host
        // already provides, so dropping it is the correct rewrite.
        if (statements.length === 0) {
          path.remove();
          return;
        }
        path.replaceWithMultiple(statements);
      },
      ExportNamedDeclaration(path) {
        if (path.node.exportKind === 'type') {
          path.remove();
          return;
        }
        const source = path.node.source?.value;
        if (source !== undefined && source in SHARED_MODULES) {
          throw path.buildCodeFrameError(reexportError(source));
        }
      },
      ExportAllDeclaration(path) {
        if (path.node.exportKind === 'type') {
          path.remove();
          return;
        }
        const source = path.node.source.value;
        if (source in SHARED_MODULES) {
          throw path.buildCodeFrameError(reexportError(source));
        }
      },
    },
  };
}

/**
 * Compiles one plugin module: TypeScript and JSX first, then the shared-
 * import rewrite. Returns `null` only when Babel produced no code at all.
 */
export function transformPluginSource(code: string, id: string): string | null {
  const first = transformSync(code, {
    filename: id,
    babelrc: false,
    configFile: false,
    // Presets run in reverse, so TypeScript strips the source before the
    // Solid preset compiles the now annotation-free JSX.
    presets: [presetSolid, presetTypescript],
    sourceType: 'module',
    ast: false,
    cloneInputAst: false,
  });

  if (!first?.code) return null;

  const second = transformSync(first.code, {
    filename: id,
    babelrc: false,
    configFile: false,
    plugins: [rewriteSharedImports()],
    sourceType: 'module',
    ast: false,
  });

  return second?.code ?? null;
}
