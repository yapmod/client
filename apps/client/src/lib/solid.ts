import type { SharedSolid } from '@yapmod/types';
import * as solid from 'solid-js';
import * as solidStore from 'solid-js/store';
import * as solidWeb from 'solid-js/web';

/**
 * The one copy of SolidJS inlined into the client bundle.
 *
 * Plugins and embedders must never bundle their own copy: two copies break
 * reactivity between them, because signals from one instance are invisible
 * to the other. Everything that renders or reacts goes through these three
 * module objects — `YapmodClient.api` exposes them to embedders, and the
 * plugin API puts the same references on `yapmod.solid` and friends.
 */
export const sharedSolid: SharedSolid = { solid, solidStore, solidWeb };
