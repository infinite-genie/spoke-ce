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
        { code: 'const border = `1px solid ${tokens.color.border}`;' },
        { code: "const c = 'color: red';" },
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

  it('supports allowPattern for known false positives', () => {
    // Documents the default false positives (no options → these are invalid)
    ruleTester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
      valid: [],
      invalid: [
        { code: "const href = '#add-button';", errors: [{ messageId: 'rawColor' }] },
        { code: "const msg = 'Expected rgba() format';", errors: [{ messageId: 'rawColor' }] },
      ],
    });

    // With allowPattern option, the same strings are allowed
    ruleTester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
      valid: [
        {
          code: "const href = '#add-button';",
          options: [{ allowPattern: '^#[a-z][a-z-]*$' }],
        },
        {
          code: "const msg = 'Expected rgba() format';",
          options: [{ allowPattern: 'rgba?\\(\\) format' }],
        },
      ],
      invalid: [],
    });
  });
});
