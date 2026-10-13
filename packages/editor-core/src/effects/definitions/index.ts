import { effectsRegistry } from "../registry";
import { blurEffectDefinition } from "./blur";
import { adjustEffectDefinition } from "./adjust";
import { filterEffectDefinition } from "./filter";

// Adjust and filter both emit the `color-adjust` pass. Blur emits the
// gaussian pass. Native export mirrors those three on iOS.
const defaultEffects = [
	blurEffectDefinition,
	adjustEffectDefinition,
	filterEffectDefinition,
];

export function registerDefaultEffects(): void {
	for (const definition of defaultEffects) {
		if (effectsRegistry.has(definition.type)) {
			continue;
		}
		effectsRegistry.register({
			key: definition.type,
			definition,
		});
	}
}
