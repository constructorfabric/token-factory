import { createRequire } from 'node:module';
import path from 'node:path';
import mixins from 'postcss-mixins';

// The kit's typography, ellipsis and breakpoint mixins (`@mixin acv-text-*`),
// which its styling guidelines require instead of hardcoded values.
// postcss-mixins does not follow `@import`, so the two files that hold the
// definitions are listed directly; the glob needs forward slashes on Windows.
const require = createRequire(import.meta.url);
const dir = path.dirname(require.resolve('@constructor/ui/styles/mixins.pcss')).split(path.sep).join('/');

export default {
  plugins: [mixins({ mixinsFiles: [`${dir}/typography.pcss`, `${dir}/adaptive.pcss`] })],
};
