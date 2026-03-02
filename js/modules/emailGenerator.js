import { buildEmailPromptText } from '../utils/templates.js';

export const EmailGenerator = {
  buildEmailPrompt(profile, job, companyContext) {
    return buildEmailPromptText(profile, job, companyContext || '');
  }
};
