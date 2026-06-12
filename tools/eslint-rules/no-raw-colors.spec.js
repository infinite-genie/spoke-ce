import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import plugin from '@spoke/eslint-rules';

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
});

describe('no-raw-colors', () => {
  it('accepts token usage and innocent strings', () => {
    ruleTester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
      valid: [
        { code: 'const c = tokens.color.primary;' },
        { code: "const border = 'solid';" },
        { code: "const id = 'user#42';" },
        { code: "const tag = 'rgbish';" },
      ],
      invalid: [],
    });
  });

  it('rejects hex, rgb()/rgba(), hsl() literals and template chunks', () => {
    ruleTester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
      valid: [],
      invalid: [
        { code: "const c = '#FFF';", errors: [{ messageId: 'rawColor' }] },
        { code: "const c = '#1E1A3C';", errors: [{ messageId: 'rawColor' }] },
        { code: "const c = 'rgba(0,0,0,0.5)';", errors: [{ messageId: 'rawColor' }] },
        { code: "const c = 'hsl(220, 50%, 50%)';", errors: [{ messageId: 'rawColor' }] },
        { code: 'const s = `1px solid #ABCDEF`;', errors: [{ messageId: 'rawColor' }] },
      ],
    });
  });
});
