Avoid client-side dependencies, including frameworks using Astro client islands.
Dev dependencies are ok.

Always add "AI:" in front of explanatory comments you add, unless otherwise specified.

Always keep the code elegant, efficient (fast), readable, and concise (dense).
Follow modern practices and Astro best practices.

A nice UI is paramount. Keep things friendly and minimal with simple shapes and muted colors. Use subtle visual cues.
Use CSS nesting liberally. Use a unique root CSS class per Astro component and is:global styles with CSS nesting to scope component styles, ensuring consistent styling even for dynamically generated elements.

Prefer functions over classes.
Prefer async/await over layers of callbacks or `Promise.then`.
Unless requested, need not emit runtime checks against states that are logically unreachable regardless of input.
Make good use of helper functions.

When asked to critically review existing or user-proposed code, be more negative and discuss possible improvements.