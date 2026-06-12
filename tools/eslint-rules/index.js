const COLOR_PATTERN = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\b(?:rgba?|hsla?)\(/;

const noRawColors = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw color literals (hex, rgb/rgba, hsl/hsla) — use @spoke/design-tokens semantic tokens.',
    },
    messages: {
      rawColor:
        'Raw color "{{value}}" is forbidden here; use a semantic token from @spoke/design-tokens.',
    },
    schema: [],
  },
  create(context) {
    const report = (node, value) =>
      context.report({ node, messageId: 'rawColor', data: { value } });
    return {
      Literal(node) {
        if (typeof node.value === 'string' && COLOR_PATTERN.test(node.value)) {
          report(node, node.value);
        }
      },
      TemplateElement(node) {
        if (COLOR_PATTERN.test(node.value.raw)) {
          report(node, node.value.raw);
        }
      },
    };
  },
};

export default {
  meta: { name: '@spoke/eslint-rules' },
  rules: { 'no-raw-colors': noRawColors },
};
