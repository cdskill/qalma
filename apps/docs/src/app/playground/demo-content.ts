import {
  PLAYGROUND_EXAMPLE_IMAGE_ALT,
  PLAYGROUND_EXAMPLE_IMAGE_HEIGHT,
  PLAYGROUND_EXAMPLE_IMAGE_SRC,
  PLAYGROUND_EXAMPLE_IMAGE_TITLE,
  PLAYGROUND_EXAMPLE_IMAGE_WIDTH,
} from './image';

/**
 * A deliberately rich starting document so the playground exercises every
 * bundled plugin: headings, alignment, the full mark set, highlight, text and
 * background color, sub/superscript, links, mentions, blockquotes, nested
 * lists, a table, an image, and multi-language code blocks.
 */
export const PLAYGROUND_DEMO_CONTENT = `
<h1><strong>Qalma</strong> — write beautifully in Angular</h1>
<p style="text-align: center;">A <strong>headless</strong>, plugin-based rich text editor built on <a href="https://prosemirror.net" target="_blank" rel="noopener noreferrer">ProseMirror</a>. Every mark and node is yours to style.</p>
<blockquote><p>The pen is the tongue of the mind — so give it a good surface to write on.</p></blockquote>
<p>Shape text without surrendering UI ownership: try <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <mark>highlight</mark>, <span style="color: rgb(124, 76, 43); background-color: rgb(247, 238, 221);">sepia ink</span>, a <span style="color: rgb(15, 41, 71); background-color: rgb(186, 230, 253);">tinted background</span>, formulas like H<sub>2</sub>O and E=mc<sup>2</sup>, mention <span data-qalma-mention data-mention-id="ada-lovelace" data-mention-label="Ada Lovelace" data-mention-trigger="@">@Ada Lovelace</span>, and <a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a> with a hover preview.</p>
<h2>Composable by design</h2>
<p>You pick the capabilities for the current surface and render the controls yourself:</p>
<ul>
<li><p>Compose plugins in <strong>TypeScript</strong>, not configuration.</p></li>
<li><p>Keep toolbar markup in the consuming app.</p>
<ul><li><p>Bring your own components and design tokens.</p></li><li><p>Style nested lists, quotes, and code to taste.</p></li></ul></li>
<li><p>Stay accessible with real, focusable controls.</p></li>
</ul>
<ol>
<li><p>Install <code>@qalma/editor</code> from npm.</p></li>
<li><p>Select the plugins your product needs.</p></li>
<li><p>Render the surface with Angular templates.</p></li>
</ol>
<ul data-type="task-list">
<li data-type="task-item" data-checked="true"><div data-task-item-content><p>Keep engine behavior in the plugin.</p></div></li>
<li data-type="task-item" data-checked="false"><div data-task-item-content><p>Own checkbox styling in the consuming app.</p></div></li>
</ul>
<h2>At a glance</h2>
<p>Tables ship as a plugin too: drag a column border to resize, hop between cells with <strong>Tab</strong>, and toggle a header row.</p>
<table>
<tbody>
<tr><th><p>Plugin</p></th><th><p>What it adds</p></th><th><p>What you style</p></th></tr>
<tr><td><p>Headings</p></td><td><p><code>#</code> … <code>######</code> input rules</p></td><td><p>The type scale</p></td></tr>
<tr><td><p>Table</p></td><td><p>Resizable rows &amp; columns</p></td><td><p>Borders &amp; header cells</p></td></tr>
<tr><td><p>Slash menu</p></td><td><p>Insert blocks by typing <code>/</code></p></td><td><p>The menu surface</p></td></tr>
</tbody>
</table>
<h3>From TypeScript</h3>
<pre><code class="language-typescript">import { createQalmaEditor, HeadingsPlugin, HistoryPlugin } from "@qalma/editor";&#10;&#10;const editor = createQalmaEditor({&#10;  content: "&lt;p&gt;Hello, Qalma&lt;/p&gt;",&#10;  plugins: [HeadingsPlugin, HistoryPlugin.configure({ depth: 200 })],&#10;});&#10;&#10;editor.execute("toggleHeading1");</code></pre>
<h3>Plays well with any backend</h3>
<pre><code class="language-go">package main&#10;&#10;import "fmt"&#10;&#10;func main() {&#10;  fmt.Println("Serialized HTML from Qalma")&#10;}</code></pre>
<p style="text-align: right;">Insert images, then align blocks left, center, right, or justified.</p>
<img src="${PLAYGROUND_EXAMPLE_IMAGE_SRC}" alt="${PLAYGROUND_EXAMPLE_IMAGE_ALT}" title="${PLAYGROUND_EXAMPLE_IMAGE_TITLE}" width="${PLAYGROUND_EXAMPLE_IMAGE_WIDTH}" height="${PLAYGROUND_EXAMPLE_IMAGE_HEIGHT}">
<p>Switch paragraphs into lists, nest items with <strong>Tab</strong>, lift them back out with <strong>Shift+Tab</strong>, and undo it all with the history plugin. Everything you see is serialized to clean HTML.</p>
`;
