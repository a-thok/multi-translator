// ==UserScript==
// @name    多语言划词翻译
// @description    支持英、法、日、韩、泰、越、他加禄语，部分语言的翻译结果为英语
// @version    2.0
// @match    *://*/*
// @allFrames    true
// @grant    GM_xmlhttpRequest
// @run-at    document-end
// ==/UserScript==

(function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function append_styles(target, style_sheet_id, styles) {
        const append_styles_to = get_root_for_style(target);
        if (!append_styles_to.getElementById(style_sheet_id)) {
            const style = element('style');
            style.id = style_sheet_id;
            style.textContent = styles;
            append_stylesheet(append_styles_to, style);
        }
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const getYoudaoApi = (le, dict) => (`http://dict.youdao.com/jsonapi?le=${le}&dicts=${encodeURIComponent(`{"count": 1, dicts: [["${dict}"]]}`)}&jsonversion=2&q=`);
    const getYoudaoVoice = (audio) => `https://dict.youdao.com/dictvoice?audio=${audio}`;
    function get(url, responseType) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType,
                onload: (res) => resolve(res.response),
                onerror: reject,
            });
        });
    }
    function setPosition(el, rect) {
        const { innerWidth, innerHeight } = window;
        let left = rect.right;
        let top = rect.bottom;
        const { clientWidth, clientHeight } = el;
        if (left + clientWidth > innerWidth) {
            left -= (rect.width + clientWidth);
        }
        if (top + clientHeight > innerHeight) {
            top -= (rect.height + clientHeight);
        }
        /* eslint-disable no-param-reassign */
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
    }

    /* src/components/ResultEntry.svelte generated by Svelte v3.46.4 */

    function add_css$2(target) {
    	append_styles(target, "svelte-1pu7zp2", ".info.svelte-1pu7zp2{display:flex;align-items:baseline;margin:0.5em 0}.word.svelte-1pu7zp2{margin:0}.phonetic.svelte-1pu7zp2{margin-left:0.5em;color:#a2a5a6}.sound.svelte-1pu7zp2{all:unset;align-self:center;width:1.5em;height:1.5em;padding:0.1em;margin-left:auto;color:var(--main-color);cursor:pointer}.sound.svelte-1pu7zp2:disabled{opacity:0.3}.meanings.svelte-1pu7zp2{all:unset}.meaning.svelte-1pu7zp2{list-style:none;margin:0.4em 0}.meaning-type.svelte-1pu7zp2{margin-right:0.5em;color:var(--main-color)}.meaning-content.svelte-1pu7zp2{all:unset}.en .meaning.svelte-1pu7zp2,.fr .meaning.svelte-1pu7zp2,.th .meaning.svelte-1pu7zp2{display:flex}");
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (22:2) {#if entry.word}
    function create_if_block_1$1(ctx) {
    	let div;
    	let h2;
    	let raw_value = /*entry*/ ctx[0].word + "";
    	let t0;
    	let t1;
    	let if_block0 = /*entry*/ ctx[0].phonetic && create_if_block_3(ctx);
    	let if_block1 = /*entry*/ ctx[0].sound && create_if_block_2(ctx);

    	return {
    		c() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr(h2, "class", "word svelte-1pu7zp2");
    			attr(div, "class", "info svelte-1pu7zp2");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h2);
    			h2.innerHTML = raw_value;
    			append(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t1);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && raw_value !== (raw_value = /*entry*/ ctx[0].word + "")) h2.innerHTML = raw_value;
    			if (/*entry*/ ctx[0].phonetic) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*entry*/ ctx[0].sound) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};
    }

    // (25:6) {#if entry.phonetic}
    function create_if_block_3(ctx) {
    	let span;
    	let t0;
    	let html_tag;
    	let raw_value = /*entry*/ ctx[0].phonetic + "";
    	let t1;

    	return {
    		c() {
    			span = element("span");
    			t0 = text("[");
    			html_tag = new HtmlTag();
    			t1 = text("]");
    			html_tag.a = t1;
    			attr(span, "class", "phonetic svelte-1pu7zp2");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t0);
    			html_tag.m(raw_value, span);
    			append(span, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && raw_value !== (raw_value = /*entry*/ ctx[0].phonetic + "")) html_tag.p(raw_value);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (28:6) {#if entry.sound}
    function create_if_block_2(ctx) {
    	let button;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "stroke-linecap", "round");
    			attr(path, "stroke-linejoin", "round");
    			attr(path, "d", "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "fill", "none");
    			attr(svg, "viewBox", "0 0 24 24");
    			attr(svg, "stroke", "currentColor");
    			attr(svg, "stroke-width", "2");
    			attr(button, "class", "sound svelte-1pu7zp2");
    			attr(button, "aria-label", "播放");
    			button.disabled = /*isPlaying*/ ctx[1];
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, svg);
    			append(svg, path);

    			if (!mounted) {
    				dispose = listen(button, "click", /*play*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*isPlaying*/ 2) {
    				button.disabled = /*isPlaying*/ ctx[1];
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (46:8) {#if meaning.type}
    function create_if_block$1(ctx) {
    	let div;
    	let t_value = /*meaning*/ ctx[4].type + "";
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(t_value);
    			attr(div, "class", "meaning-type svelte-1pu7zp2");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && t_value !== (t_value = /*meaning*/ ctx[4].type + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (50:10) {#each meaning.items as item}
    function create_each_block_1(ctx) {
    	let li;
    	let raw_value = /*item*/ ctx[7] + "";

    	return {
    		c() {
    			li = element("li");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			li.innerHTML = raw_value;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*entry*/ 1 && raw_value !== (raw_value = /*item*/ ctx[7] + "")) li.innerHTML = raw_value;		},
    		d(detaching) {
    			if (detaching) detach(li);
    		}
    	};
    }

    // (44:4) {#each entry.meanings as meaning}
    function create_each_block$2(ctx) {
    	let li;
    	let t0;
    	let ol;
    	let t1;
    	let if_block = /*meaning*/ ctx[4].type && create_if_block$1(ctx);
    	let each_value_1 = /*meaning*/ ctx[4].items;
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c() {
    			li = element("li");
    			if (if_block) if_block.c();
    			t0 = space();
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr(ol, "class", "meaning-content svelte-1pu7zp2");
    			attr(li, "class", "meaning svelte-1pu7zp2");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			if (if_block) if_block.m(li, null);
    			append(li, t0);
    			append(li, ol);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}

    			append(li, t1);
    		},
    		p(ctx, dirty) {
    			if (/*meaning*/ ctx[4].type) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(li, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*entry*/ 1) {
    				each_value_1 = /*meaning*/ ctx[4].items;
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let div;
    	let t;
    	let ul;
    	let if_block = /*entry*/ ctx[0].word && create_if_block_1$1(ctx);
    	let each_value = /*entry*/ ctx[0].meanings;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(ul, "class", "meanings svelte-1pu7zp2");
    			attr(div, "class", "entry");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append(div, t);
    			append(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*entry*/ ctx[0].word) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*entry*/ 1) {
    				each_value = /*entry*/ ctx[0].meanings;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { entry } = $$props;
    	let isPlaying = false;
    	const audio = new Audio();

    	audio.addEventListener('ended', () => {
    		$$invalidate(1, isPlaying = false);
    	});

    	async function play() {
    		$$invalidate(1, isPlaying = true);

    		if (audio.src) {
    			audio.play();
    			return;
    		}

    		const res = await get(entry.sound, 'blob');
    		const blob = res.slice(0, res.size, 'audio/mpeg');
    		audio.src = URL.createObjectURL(blob);
    		audio.play();
    	}

    	$$self.$$set = $$props => {
    		if ('entry' in $$props) $$invalidate(0, entry = $$props.entry);
    	};

    	return [entry, isPlaying, play];
    }

    class ResultEntry extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { entry: 0 }, add_css$2);
    	}
    }

    /* src/components/LangSection.svelte generated by Svelte v3.46.4 */

    function add_css$1(target) {
    	append_styles(target, "svelte-15vln8g", ".lang.svelte-15vln8g.svelte-15vln8g:not(:first-child){margin-top:1em}.header.svelte-15vln8g.svelte-15vln8g{display:flex;align-items:center;height:2.5em;border-bottom:1px solid #f5f5f5;font-size:12px;transition:0.2s}.switch.svelte-15vln8g.svelte-15vln8g{all:unset;width:1em;height:1em;padding:0.5em;margin-left:-0.5em;cursor:pointer}.switch.svelte-15vln8g>svg.svelte-15vln8g{fill:#a2a5a6}.switch.svelte-15vln8g:hover>svg.svelte-15vln8g{fill:var(--main-color)}.name.svelte-15vln8g.svelte-15vln8g{margin:0;color:var(--main-color);font-family:'Segoe UI', 'Malgun Gothic', meiryo, sans-serif;font-weight:600;margin-right:auto}.more.svelte-15vln8g.svelte-15vln8g{width:1rem;height:1rem;padding:0.5em;color:#a2a5a6;transition:0.3s}.more.svelte-15vln8g.svelte-15vln8g:hover{color:#000}.content.svelte-15vln8g.svelte-15vln8g{min-height:var(--content-min-height);max-height:250px;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin}.content.svelte-15vln8g a.svelte-15vln8g{color:var(--main-color)}.tip.svelte-15vln8g.svelte-15vln8g{display:flex;width:100%;height:var(--content-min-height);justify-content:center;align-items:center;color:#666;font-size:12px}.loading.svelte-15vln8g.svelte-15vln8g{box-sizing:border-box;display:block;padding:0.5em;margin:0 auto;width:var(--content-min-height);height:var(--content-min-height);color:#999}");
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (22:6) {:else}
    function create_else_block(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "fill-rule", "evenodd");
    			attr(path, "d", "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z");
    			attr(path, "clip-rule", "evenodd");
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 20 20");
    			attr(svg, "fill", "currentColor");
    			attr(svg, "class", "svelte-15vln8g");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (18:6) {#if lang.enabled}
    function create_if_block_1(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "fill-rule", "evenodd");
    			attr(path, "d", "M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z");
    			attr(path, "clip-rule", "evenodd");
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 20 20");
    			attr(svg, "fill", "currentColor");
    			attr(svg, "class", "svelte-15vln8g");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (46:2) {#if lang.enabled}
    function create_if_block(ctx) {
    	let div;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 4,
    		error: 8,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*lang*/ ctx[0].request(/*text*/ ctx[1]), info);

    	return {
    		c() {
    			div = element("div");
    			info.block.c();
    			attr(div, "class", "content svelte-15vln8g");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*lang, text*/ 3 && promise !== (promise = /*lang*/ ctx[0].request(/*text*/ ctx[1])) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};
    }

    // (78:6) {:catch error}
    function create_catch_block(ctx) {
    	let div;
    	let t_value = (/*error*/ ctx[8].message || '查询出错') + "";
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(t_value);
    			attr(div, "class", "tip svelte-15vln8g");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*lang, text*/ 3 && t_value !== (t_value = (/*error*/ ctx[8].message || '查询出错') + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (74:6) {:then results}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*results*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty & /*lang, text*/ 3) {
    				each_value = /*results*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (75:8) {#each results as entry}
    function create_each_block$1(ctx) {
    	let resultentry;
    	let current;
    	resultentry = new ResultEntry({ props: { entry: /*entry*/ ctx[5] } });

    	return {
    		c() {
    			create_component(resultentry.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(resultentry, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const resultentry_changes = {};
    			if (dirty & /*lang, text*/ 3) resultentry_changes.entry = /*entry*/ ctx[5];
    			resultentry.$set(resultentry_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(resultentry.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(resultentry.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(resultentry, detaching);
    		}
    	};
    }

    // (48:33)          <svg aria-hidden="true" class="loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">             <rect x="20" y="20" width="4" height="10">               <animateTransform                 attributeType="xml"                 attributeName="transform" type="translate"                 values="0 0; 0 20; 0 0"                 begin="0" dur="0.6s" repeatCount="indefinite"               />             </rect>             <rect x="30" y="20" width="4" height="10">               <animateTransform attributeType="xml"                 attributeName="transform" type="translate"                 values="0 0; 0 20; 0 0"                 begin="0.2s" dur="0.6s" repeatCount="indefinite"               />             </rect>             <rect x="40" y="20" width="4" height="10">               <animateTransform                 attributeType="xml"                 attributeName="transform" type="translate"                 values="0 0; 0 20; 0 0"                 begin="0.4s" dur="0.6s" repeatCount="indefinite"               />             </rect>         </svg>       {:then results}
    function create_pending_block(ctx) {
    	let svg;
    	let rect0;
    	let animateTransform0;
    	let rect1;
    	let animateTransform1;
    	let rect2;
    	let animateTransform2;

    	return {
    		c() {
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			animateTransform0 = svg_element("animateTransform");
    			rect1 = svg_element("rect");
    			animateTransform1 = svg_element("animateTransform");
    			rect2 = svg_element("rect");
    			animateTransform2 = svg_element("animateTransform");
    			attr(animateTransform0, "attributeType", "xml");
    			attr(animateTransform0, "attributeName", "transform");
    			attr(animateTransform0, "type", "translate");
    			attr(animateTransform0, "values", "0 0; 0 20; 0 0");
    			attr(animateTransform0, "begin", "0");
    			attr(animateTransform0, "dur", "0.6s");
    			attr(animateTransform0, "repeatCount", "indefinite");
    			attr(rect0, "x", "20");
    			attr(rect0, "y", "20");
    			attr(rect0, "width", "4");
    			attr(rect0, "height", "10");
    			attr(animateTransform1, "attributeType", "xml");
    			attr(animateTransform1, "attributeName", "transform");
    			attr(animateTransform1, "type", "translate");
    			attr(animateTransform1, "values", "0 0; 0 20; 0 0");
    			attr(animateTransform1, "begin", "0.2s");
    			attr(animateTransform1, "dur", "0.6s");
    			attr(animateTransform1, "repeatCount", "indefinite");
    			attr(rect1, "x", "30");
    			attr(rect1, "y", "20");
    			attr(rect1, "width", "4");
    			attr(rect1, "height", "10");
    			attr(animateTransform2, "attributeType", "xml");
    			attr(animateTransform2, "attributeName", "transform");
    			attr(animateTransform2, "type", "translate");
    			attr(animateTransform2, "values", "0 0; 0 20; 0 0");
    			attr(animateTransform2, "begin", "0.4s");
    			attr(animateTransform2, "dur", "0.6s");
    			attr(animateTransform2, "repeatCount", "indefinite");
    			attr(rect2, "x", "40");
    			attr(rect2, "y", "20");
    			attr(rect2, "width", "4");
    			attr(rect2, "height", "10");
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "class", "loading svelte-15vln8g");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 64 64");
    			attr(svg, "fill", "currentColor");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, rect0);
    			append(rect0, animateTransform0);
    			append(svg, rect1);
    			append(rect1, animateTransform1);
    			append(svg, rect2);
    			append(rect2, animateTransform2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let button;
    	let button_aria_checked_value;
    	let button__aria_label_value;
    	let t0;
    	let span;
    	let t1_value = /*lang*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let a;
    	let svg;
    	let path0;
    	let path1;
    	let a_href_value;
    	let t3;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*lang*/ ctx[0].enabled) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*lang*/ ctx[0].enabled && create_if_block(ctx);

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			if_block0.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			a = element("a");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t3 = space();
    			if (if_block1) if_block1.c();
    			attr(button, "class", "switch svelte-15vln8g");
    			attr(button, "role", "switch");
    			attr(button, "aria-checked", button_aria_checked_value = /*lang*/ ctx[0].enabled);
    			attr(button, ":aria-label", button__aria_label_value = "" + (/*lang*/ ctx[0].name + "语查询"));
    			attr(span, "class", "name svelte-15vln8g");
    			attr(path0, "d", "M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z");
    			attr(path1, "d", "M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z");
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 20 20");
    			attr(svg, "fill", "currentColor");
    			attr(a, "class", "more svelte-15vln8g");
    			attr(a, "target", "_blank");
    			attr(a, "rel", "noopener noreferrer");
    			attr(a, "href", a_href_value = "" + (/*lang*/ ctx[0].url + /*text*/ ctx[1]));
    			attr(a, "title", "详细释义");
    			attr(div0, "class", "header svelte-15vln8g");
    			attr(div1, "class", div1_class_value = "lang " + /*lang*/ ctx[0].type + " svelte-15vln8g");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, button);
    			if_block0.m(button, null);
    			append(div0, t0);
    			append(div0, span);
    			append(span, t1);
    			append(div0, t2);
    			append(div0, a);
    			append(a, svg);
    			append(svg, path0);
    			append(svg, path1);
    			append(div1, t3);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", /*onToggleLanguage*/ ctx[2]),
    					listen(a, "click", stop_propagation(/*click_handler*/ ctx[3]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button, null);
    				}
    			}

    			if (!current || dirty & /*lang*/ 1 && button_aria_checked_value !== (button_aria_checked_value = /*lang*/ ctx[0].enabled)) {
    				attr(button, "aria-checked", button_aria_checked_value);
    			}

    			if (!current || dirty & /*lang*/ 1 && button__aria_label_value !== (button__aria_label_value = "" + (/*lang*/ ctx[0].name + "语查询"))) {
    				attr(button, ":aria-label", button__aria_label_value);
    			}

    			if ((!current || dirty & /*lang*/ 1) && t1_value !== (t1_value = /*lang*/ ctx[0].name + "")) set_data(t1, t1_value);

    			if (!current || dirty & /*lang, text*/ 3 && a_href_value !== (a_href_value = "" + (/*lang*/ ctx[0].url + /*text*/ ctx[1]))) {
    				attr(a, "href", a_href_value);
    			}

    			if (/*lang*/ ctx[0].enabled) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*lang*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*lang*/ 1 && div1_class_value !== (div1_class_value = "lang " + /*lang*/ ctx[0].type + " svelte-15vln8g")) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { lang } = $$props;
    	let { text } = $$props;

    	function onToggleLanguage() {
    		$$invalidate(0, lang.enabled = !lang.enabled, lang);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('lang' in $$props) $$invalidate(0, lang = $$props.lang);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    	};

    	return [lang, text, onToggleLanguage, click_handler];
    }

    class LangSection extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { lang: 0, text: 1 }, add_css$1);
    	}
    }

    const langs = [
        {
            enabled: true,
            type: 'en',
            name: '英',
            api: getYoudaoApi('eng', 'ec'),
            url: 'https://dict.cn/',
            is(text) {
                return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const { ec } = JSON.parse(res);
                if (!ec)
                    throw new Error('查无结果');
                return ec.word.map((word) => ({
                    word: word['return-phrase'].l.i,
                    phonetic: word.ukphone,
                    sound: word.ukspeech && getYoudaoVoice(word.ukspeech),
                    meanings: word.trs.map((tr) => {
                        let [type, items] = tr.tr[0].l.i[0].split('.');
                        if (!items) {
                            items = type;
                            type = '';
                        }
                        return {
                            type: type.trim(),
                            items: [items.trim()],
                        };
                    }),
                }));
            },
        },
        {
            enabled: false,
            type: 'fr',
            name: '法',
            api: getYoudaoApi('fr', 'fc'),
            url: 'https://www.frdic.com/dicts/fr/',
            is(text) {
                return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const { fc } = JSON.parse(res);
                if (!fc)
                    throw new Error('查无结果');
                return fc.word.map((word) => ({
                    word: word['return-phrase'].l.i,
                    phonetic: word.phone.replace(/\s/g, ''),
                    sound: word.speech && getYoudaoVoice(word.speech),
                    meanings: word.trs.map((tr) => ({
                        type: tr.pos,
                        items: tr.tr[0].l.i,
                    })),
                }));
            },
        },
        {
            enabled: true,
            type: 'ja',
            name: '日',
            api: getYoudaoApi('ja', 'newjc'),
            url: 'http://dict.asia/jc/',
            is(text) {
                return /^(\p{sc=Han}|\p{sc=Hira}|\p{scx=Kana})+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const { newjc: { word: data } } = JSON.parse(res);
                const { mPhonicD, homonymD = [] } = data;
                const words = mPhonicD || [data];
                words.push(...homonymD.filter((part) => part.head.pjm));
                return words.map((word) => ({
                    word: word.head.hw,
                    phonetic: `${word.head.pjm} ${word.head.tone || ''}`,
                    sound: getYoudaoVoice(`${word.head.hw}&le=jap`),
                    meanings: word.sense.map((sensePart) => ({
                        type: sensePart.cx,
                        items: sensePart.phrList.map(({ jmsy }) => jmsy),
                    })),
                }));
            },
        },
        {
            enabled: true,
            type: 'kr',
            name: '韩',
            api: 'https://zh.dict.naver.com/api3/kozh/tooltip?query=',
            url: 'https://zh.dict.naver.com/#/search?query=',
            is(text) {
                return /^\p{sc=Hangul}+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const { jsonResult } = JSON.parse(res);
                if (!jsonResult.length)
                    throw new Error('查无结果');
                return jsonResult.map((item) => ({
                    word: item.entryName,
                    phonetic: item.phoneticSymbolP,
                    meanings: item.partOfSpeechs.map((speech) => ({
                        type: speech.partOfSpeechNameForeign,
                        items: speech.means.map(({ mean }) => mean),
                    })),
                }));
            },
        },
        {
            enabled: true,
            type: 'th',
            name: '泰',
            api: 'https://api.thai2english.com/translations?q=',
            url: 'https://www.thai2english.com/search?q=',
            is(text) {
                return /^\p{sc=Thai}+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const [{ wordObjects }] = JSON.parse(res);
                return wordObjects.map((item) => ({
                    word: item.word,
                    phonetic: item.phonetic,
                    meanings: [{
                            items: item.meanings.map(({ meaning }) => meaning),
                        }],
                }));
            },
        },
        {
            enabled: false,
            type: 'vt',
            name: '越',
            api: 'https://vtudien.com/viet-trung/dictionary/nghia-cua-tu-',
            url: 'https://vtudien.com/viet-trung/dictionary/nghia-cua-tu-',
            is(text) {
                return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const doc = new DOMParser().parseFromString(res, 'text/html');
                const div = doc.getElementById('idnghia');
                const word = div?.querySelector('h2')?.textContent?.trim();
                if (!word)
                    throw new Error('查无结果');
                const tds = div?.querySelectorAll('td[colspan="2"]') || [];
                const items = Array.from(tds).map((td) => td.textContent);
                return [{
                        word,
                        sound: `https://vtudien.com/doc/viet/${word}.mp3`,
                        meanings: [{
                                items,
                            }],
                    }];
            },
        },
        {
            enabled: false,
            type: 'tl',
            name: '他加禄',
            api: 'https://www.tagalog.com/ajax/reference_guide_search_results.php?json=1&num_results=5&keyword=',
            url: 'https://www.tagalog.com/dictionary/#',
            is(text) {
                return /^(\p{sc=Latin}|-|\s)+$/u.test(text);
            },
            async request(text) {
                const res = await get(this.api + text);
                const entries = JSON.parse(res);
                if (!entries.length)
                    throw new Error('查无结果');
                return entries.map((entry) => {
                    const { content, english, has_conjugations: hasConjugations, conjugations, } = entry;
                    const meanings = english.split('[').slice(1)
                        .map((segment) => segment.split(']'))
                        .map(([type, meaning]) => ({
                        type,
                        items: [
                            ...(type === 'verb' && hasConjugations === 1 ? [`( ${conjugations} )`] : []),
                            meaning.trim(),
                        ],
                    }));
                    return {
                        word: content.replaceAll('***', '<u>').replaceAll('^^^', '</u>'),
                        meanings,
                    };
                });
            },
        },
        {
            enabled: false,
            type: 'all',
            name: '谷歌翻译',
            api: 'https://translate.google.cn/translate_a/single?client=gtx&dt=t&dt=bd&dj=1&source=input&sl=auto&tl=en&q=',
            url: 'https://translate.google.cn/?sl=auto&tl=en&op=translate&text=',
            is() {
                return true;
            },
            async request(text) {
                const res = await get(this.api + text);
                const result = JSON.parse(res);
                return [{
                        meanings: [{
                                items: [result.sentences[0].trans],
                            }],
                    }];
            },
        },
    ];

    /* src/components/App.svelte generated by Svelte v3.46.4 */

    function add_css(target) {
    	append_styles(target, "svelte-pudc07", ".app.svelte-pudc07{--main-color:#0C9553;font-size:16px;color:#000}.trigger.svelte-pudc07{position:fixed;top:0;left:0;z-index:9999;display:block;width:24px;height:24px;padding:4px;border:0;border-radius:15%;background-color:var(--main-color);color:#fff;transition:visibility 0.3s, opcacity 0.3s;cursor:pointer}.trigger.svelte-pudc07:hover{opacity:0.85}.panel.svelte-pudc07{--content-min-height:80px;position:fixed;top:0;left:0;z-index:9999;display:flex;flex-direction:column;justify-content:center;width:20em;max-height:90vh;padding:0.5em 1em 1.2em;border:1px solid #eee;background-color:#fff;box-shadow:3px 2.8px 4.2px -5px rgba(0, 0, 0, 0.07),\n    7.3px 6.7px 10px -5px rgba(0, 0, 0, 0.05),\n    13.8px 12.5px 18.8px -5px rgba(0, 0, 0, 0.042),\n    24.6px 22.3px 33.5px -5px rgba(0, 0, 0, 0.035),\n    46px 41.8px 62.7px -5px rgba(0, 0, 0, 0.028),\n    110px 100px 150px -5px rgba(0, 0, 0, 0.02)\n  ;font-family:\"Segoe UI\", \"Microsoft Yahei\", meiryo, sans-serif;font-size:13px;line-height:1.5;transition:visibility 0.3s, opcacity 0.3s}.trigger.svelte-pudc07:not(.is-show),.panel.svelte-pudc07:not(.is-show){visibility:hidden;opacity:0}.panel.svelte-pudc07:empty{align-items:center}.panel.svelte-pudc07:empty::before{content:\"不受支持的文本\"}");
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (58:4) {#each currentLangs as lang}
    function create_each_block(ctx) {
    	let langsection;
    	let current;

    	langsection = new LangSection({
    			props: {
    				lang: /*lang*/ ctx[12],
    				text: /*text*/ ctx[0]
    			}
    		});

    	return {
    		c() {
    			create_component(langsection.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(langsection, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const langsection_changes = {};
    			if (dirty & /*currentLangs*/ 32) langsection_changes.lang = /*lang*/ ctx[12];
    			if (dirty & /*text*/ 1) langsection_changes.text = /*text*/ ctx[0];
    			langsection.$set(langsection_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(langsection.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(langsection.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(langsection, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div1;
    	let button;
    	let t;
    	let div0;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*currentLangs*/ ctx[5];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			div1 = element("div");
    			button = element("button");
    			button.innerHTML = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>`;
    			t = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(button, "class", "trigger svelte-pudc07");
    			attr(button, "aria-label", "开始翻译");
    			toggle_class(button, "is-show", /*showTrigger*/ ctx[3]);
    			attr(div0, "class", "panel svelte-pudc07");
    			toggle_class(div0, "is-show", /*showPanel*/ ctx[4]);
    			attr(div1, "class", "app svelte-pudc07");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, button);
    			/*button_binding*/ ctx[9](button);
    			append(div1, t);
    			append(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[10](div0);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", /*onTranslate*/ ctx[6]),
    					listen(div1, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[7])),
    					listen(div1, "mouseup", stop_propagation(/*mouseup_handler*/ ctx[8]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*showTrigger*/ 8) {
    				toggle_class(button, "is-show", /*showTrigger*/ ctx[3]);
    			}

    			if (dirty & /*currentLangs, text*/ 33) {
    				each_value = /*currentLangs*/ ctx[5];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*showPanel*/ 16) {
    				toggle_class(div0, "is-show", /*showPanel*/ ctx[4]);
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			/*button_binding*/ ctx[9](null);
    			destroy_each(each_blocks, detaching);
    			/*div0_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let text = '';
    	let rect;
    	let trigger;
    	let panel;
    	let showTrigger = false;
    	let showPanel = false;
    	let currentLangs = [];

    	window.addEventListener('mouseup', () => {
    		const selection = window.getSelection();
    		$$invalidate(0, text = selection.toString().trim().toLowerCase());

    		if (text) {
    			const rects = selection.getRangeAt(0).getClientRects();
    			rect = rects[rects.length - 1];
    			setPosition(trigger, rect);
    			$$invalidate(3, showTrigger = true);
    		}
    	});

    	window.addEventListener('mousedown', () => {
    		$$invalidate(3, showTrigger = false);
    		$$invalidate(4, showPanel = false);
    		$$invalidate(5, currentLangs = []);
    	});

    	function onTranslate() {
    		$$invalidate(5, currentLangs = Object.values(langs).filter(lang => lang.is(text)));

    		setTimeout(() => {
    			setPosition(panel, rect);
    			$$invalidate(3, showTrigger = false);
    			$$invalidate(4, showPanel = true);
    		});
    	}

    	function mousedown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function mouseup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			trigger = $$value;
    			$$invalidate(1, trigger);
    		});
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			panel = $$value;
    			$$invalidate(2, panel);
    		});
    	}

    	return [
    		text,
    		trigger,
    		panel,
    		showTrigger,
    		showPanel,
    		currentLangs,
    		onTranslate,
    		mousedown_handler,
    		mouseup_handler,
    		button_binding,
    		div0_binding
    	];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {}, add_css);
    	}
    }

    const wrapper = document.createElement('div');
    document.body.append(wrapper);
    wrapper.attachShadow({ mode: 'open' });
    if (wrapper.shadowRoot) {
        // eslint-disable-next-line no-new
        new App({
            target: wrapper.shadowRoot,
        });
    }

})();
//# sourceMappingURL=index.js.map
