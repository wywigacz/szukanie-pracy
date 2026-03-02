import { buildSearchPromptText } from '../utils/templates.js';

export const PromptGenerator = {
  buildSearchPrompt(profile, preferences, iterationNumber) {
    return buildSearchPromptText(profile, preferences, iterationNumber);
  }
};
