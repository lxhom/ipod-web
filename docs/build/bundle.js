
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
                start_hydrating();
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
            end_hydrating();
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*!
     * 
     * ZingTouch v1.0.6
     * Author: ZingChart http://zingchart.com
     * License: MIT
     */
    !function(e){function t(r){if(n[r])return n[r].exports;var i=n[r]={exports:{},id:r,loaded:!1};return e[r].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}var i=n(1),u=r(i);window.ZingTouch=u.default;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(2),u=r(i),o=n(4),a=r(o),s=n(10),c=r(s),f=n(12),l=r(f),d=n(13),p=r(d),h=n(14),y=r(h),v=n(15),g=r(v),m=n(16),b=r(m),w={_regions:[],Gesture:a.default,Expand:c.default,Pan:l.default,Pinch:p.default,Rotate:y.default,Swipe:g.default,Tap:b.default,Region:function(e,t,n){var r=w._regions.length,i=new u.default(e,t,n,r);return w._regions.push(i),i}};t.default=w;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var u=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),o=n(3),a=r(o),s=n(4),c=r(s),f=n(6),l=r(f),d=n(9),p=r(d),h=function(){function e(t,n,r,u){var o=this;i(this,e),this.id=u,this.element=t,this.capture="undefined"!=typeof n&&n,this.preventDefault="undefined"==typeof r||r,this.state=new p.default(u);var a=[];a=window.PointerEvent&&!window.TouchEvent?["pointerdown","pointermove","pointerup"]:["mousedown","mousemove","mouseup","touchstart","touchmove","touchend"],a.map(function(e){t.addEventListener(e,function(e){(0, l.default)(e,o);},o.capture);});}return u(e,[{key:"bind",value:function(e,t,n,r,i){if(!e||e&&!e.tagName)throw "Bind must contain an element";return i="undefined"!=typeof i&&i,t?void this.state.addBinding(e,t,n,r,i):new a.default(e,i,this.state)}},{key:"bindOnce",value:function(e,t,n,r){this.bind(e,t,n,r,!0);}},{key:"unbind",value:function(e,t){var n=this,r=this.state.retrieveBindingsByElement(e),i=[];return r.forEach(function(r){if(t){if("string"==typeof t&&n.state.registeredGestures[t]){var u=n.state.registeredGestures[t];u.id===r.gesture.id&&(e.removeEventListener(r.gesture.getId(),r.handler,r.capture),i.push(r));}}else e.removeEventListener(r.gesture.getId(),r.handler,r.capture),i.push(r);}),i}},{key:"register",value:function(e,t){if("string"!=typeof e)throw new Error("Parameter key is an invalid string");if(!t instanceof c.default)throw new Error("Parameter gesture is an invalid Gesture object");t.setType(e),this.state.registerGesture(t,e);}},{key:"unregister",value:function(e){this.state.bindings.forEach(function(t){t.gesture.getType()===e&&t.element.removeEventListener(t.gesture.getId(),t.handler,t.capture);});var t=this.state.registeredGestures[e];return delete this.state.registeredGestures[e],t}}]),e}();t.default=h;},function(e,t){function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var r=function e(t,r,i){var u=this;n(this,e),this.element=t,Object.keys(i.registeredGestures).forEach(function(e){u[e]=function(t,n){return i.addBinding(u.element,e,t,n,r),u};});};t.default=r;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var u=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),o=n(5),a=r(o),s=function(){function e(){i(this,e),this.type=null,this.id=null;}return u(e,[{key:"setType",value:function(e){this.type=e;}},{key:"getType",value:function(){return this.type}},{key:"setId",value:function(e){this.id=e;}},{key:"getId",value:function(){return null!==this.id?this.id:this.type}},{key:"update",value:function(e){for(var t in e)this[t]&&(this[t]=e[t]);}},{key:"start",value:function(e,t,n){return null}},{key:"move",value:function(e,t,n){return null}},{key:"end",value:function(e){return null}},{key:"isValid",value:function(e,t,n){var r=!0;return e.length>1&&e.forEach(function(e){a.default.isInside(e.initial.x,e.initial.y,n)||(r=!1);}),r}}]),e}();t.default=s;},function(e,t){Object.defineProperty(t,"__esModule",{value:!0});var n=360,r=180,i={normalizeEvent:function(e){switch(e){case"mousedown":case"touchstart":case"pointerdown":return "start";case"mousemove":case"touchmove":case"pointermove":return "move";case"mouseup":case"touchend":case"pointerup":return "end";default:return null}},isWithin:function(e,t,n,r,i){return Math.abs(t-r)<=i&&Math.abs(e-n)<=i},distanceBetweenTwoPoints:function(e,t,n,r){var i=Math.sqrt((t-e)*(t-e)+(r-n)*(r-n));return Math.round(100*i)/100},getMidpoint:function(e,t,n,r){return {x:(e+t)/2,y:(n+r)/2}},getAngle:function(e,t,i,u){var o=Math.atan2(u-t,i-e)*(r/Math.PI);return n-(o<0?n+o:o)},getAngularDistance:function(e,t){var i=(t-e)%n,u=i<0?1:-1;return i=Math.abs(i),i>r?u*(n-i):u*i},getVelocity:function(e,t,n,r,i,u){var o=this.distanceBetweenTwoPoints(e,r,t,i);return o/(u-n)},getRightMostInput:function(e){var t=null,n=Number.MIN_VALUE;return e.forEach(function(e){e.initial.x>n&&(t=e);}),t},isInteger:function(e){return "number"==typeof e&&e%1===0},isInside:function(e,t,n){var r=n.getBoundingClientRect();return e>r.left&&e<r.left+r.width&&t>r.top&&t<r.top+r.height},getPropagationPath:function(e){if(e.path)return e.path;for(var t=[],n=e.target;n!=document;)t.push(n),n=n.parentNode;return t},getPathIndex:function(e,t){var n=e.length;return e.forEach(function(e,r){e===t&&(n=r);}),n},setMSPreventDefault:function(e){e.style["-ms-content-zooming"]="none",e.style["touch-action"]="none";},removeMSPreventDefault:function(e){e.style["-ms-content-zooming"]="",e.style["touch-action"]="";}};t.default=i;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){var n=t.state;if(0!==n.inputs.length||"start"===f.default.normalizeEvent(e.type)){if("undefined"!=typeof e.buttons&&"end"!==f.default.normalizeEvent(e.type)&&0===e.buttons)return void n.resetInputs();if(n.updateInputs(e,t.element)){var r=n.retrieveBindingsByInitialPos();r.length>0&&!function(){t.preventDefault?(f.default.setMSPreventDefault(t.element),e.preventDefault?e.preventDefault():e.returnValue=!1):f.default.removeMSPreventDefault(t.element);var i={},u=(0, s.default)(r,e,n);u.forEach(function(t){var n=t.binding.gesture.id;if(i[n]){var r=f.default.getPropagationPath(e);f.default.getPathIndex(r,t.binding.element)<f.default.getPathIndex(r,i[n].binding.element)&&(i[n]=t);}else i[n]=t;}),Object.keys(i).forEach(function(e){var t=i[e];(0, o.default)(t.binding,t.data,t.events);});}();var i=0;n.inputs.forEach(function(e){"end"===e.getCurrentEventType()&&i++;}),i===n.inputs.length&&n.resetInputs();}}}Object.defineProperty(t,"__esModule",{value:!0});var u=n(7),o=r(u),a=n(8),s=r(a),c=n(5),f=r(c);t.default=i;},function(e,t){function n(e,t,n){t.events=n;var i=new CustomEvent(e.gesture.getId(),{detail:t,bubbles:!0,cancelable:!0});r(e.element,i,e);}function r(e,t,n){e.dispatchEvent(t),n.bindOnce&&ZingTouch.unbind(n.element,n.gesture.getType());}Object.defineProperty(t,"__esModule",{value:!0}),t.default=n;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t,n){var r=o.default.normalizeEvent(t.type),i=[];return e.forEach(function(e){var t=e.gesture[r](n.inputs,n,e.element);t&&!function(){var r=[];n.inputs.forEach(function(e){r.push(e.current);}),i.push({binding:e,data:t,events:r});}();}),i}Object.defineProperty(t,"__esModule",{value:!0});var u=n(5),o=r(u);t.default=i;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){for(var n=0;n<e.length;n++)if(e[n].identifier===t)return e[n];return null}Object.defineProperty(t,"__esModule",{value:!0});var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(4),c=r(s),f=n(10),l=r(f),d=n(12),p=r(d),h=n(13),y=r(h),v=n(14),g=r(v),m=n(15),b=r(m),w=n(16),_=r(w),P=n(17),E=r(P),O=n(18),x=r(O),j=n(5),I=r(j),T=0,k=function(){function e(t){i(this,e),this.regionId=t,this.inputs=[],this.bindings=[],this.numGestures=0,this.registeredGestures={},this.registerGesture(new l.default,"expand"),this.registerGesture(new p.default,"pan"),this.registerGesture(new g.default,"rotate"),this.registerGesture(new y.default,"pinch"),this.registerGesture(new b.default,"swipe"),this.registerGesture(new _.default,"tap");}return a(e,[{key:"addBinding",value:function(e,t,n,r,i){var u=void 0;if(e&&"undefined"==typeof e.tagName)throw new Error("Parameter element is an invalid object.");if("function"!=typeof n)throw new Error("Parameter handler is invalid.");if("string"==typeof t&&Object.keys(this.registeredGestures).indexOf(t)===-1)throw new Error("Parameter "+t+" is not a registered gesture");if("object"===("undefined"==typeof t?"undefined":o(t))&&!(t instanceof c.default))throw new Error("Parameter for the gesture is not of a Gesture type");"string"==typeof t?u=this.registeredGestures[t]:(u=t,""===u.id&&this.assignGestureId(u)),this.bindings.push(new E.default(e,u,n,r,i)),e.addEventListener(u.getId(),n,r);}},{key:"retrieveBindingsByElement",value:function(e){var t=[];return this.bindings.map(function(n){n.element===e&&t.push(n);}),t}},{key:"retrieveBindingsByInitialPos",value:function(){var e=this,t=[];return this.bindings.forEach(function(n){var r=e.inputs.filter(function(e){return I.default.isInside(e.initial.x,e.initial.y,n.element)});r.length>0&&t.push(n);}),t}},{key:"updateInputs",value:function(e,t){function n(e,t,n,r){var i=I.default.normalizeEvent(e.type),o=u(t.inputs,n);return "start"===i&&o?void t.resetInputs():"start"!==i&&o&&!I.default.isInside(o.current.x,o.current.y,r)?void t.resetInputs():"start"===i||o?void("start"===i?t.inputs.push(new x.default(e,n)):o.update(e,n)):void t.resetInputs()}var r=T,i=e.touches?"TouchEvent":e.pointerType?"PointerEvent":"MouseEvent";switch(i){case"TouchEvent":for(var o in e.changedTouches)e.changedTouches.hasOwnProperty(o)&&I.default.isInteger(parseInt(o))&&(r=e.changedTouches[o].identifier,n(e,this,r,t));break;case"PointerEvent":r=e.pointerId,n(e,this,r,t);break;case"MouseEvent":default:n(e,this,T,t);}return !0}},{key:"resetInputs",value:function(){this.inputs=[];}},{key:"numActiveInputs",value:function(){var e=this.inputs.filter(function(e){return "end"!==e.current.type});return e.length}},{key:"registerGesture",value:function(e,t){this.assignGestureId(e),this.registeredGestures[t]=e;}},{key:"assignGestureId",value:function(e){e.setId(this.regionId+"-"+this.numGestures++);}}]),e}();t.default=k;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a=n(11),s=r(a),c=function(e){function t(e){i(this,t);var n=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.type="expand",n}return o(t,e),t}(s.default);t.default=c;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(4),c=r(s),f=n(5),l=r(f),d=2,p=1,h=function(e){function t(e){i(this,t);var n=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.type="distance",n.threshold=e&&e.threshold?e.threshold:p,n}return o(t,e),a(t,[{key:"start",value:function(e,t,n){if(!this.isValid(e,t,n))return null;if(e.length===d){var r=e[0].getGestureProgress(this.type);r.lastEmittedDistance=l.default.distanceBetweenTwoPoints(e[0].current.x,e[1].current.x,e[0].current.y,e[1].current.y);}}},{key:"move",value:function(e,t,n){if(t.numActiveInputs()===d){var r=l.default.distanceBetweenTwoPoints(e[0].current.x,e[1].current.x,e[0].current.y,e[1].current.y),i=l.default.distanceBetweenTwoPoints(e[0].previous.x,e[1].previous.x,e[0].previous.y,e[1].previous.y),u=l.default.getMidpoint(e[0].current.x,e[1].current.x,e[0].current.y,e[1].current.y),o=e[0].getGestureProgress(this.type);if("Expand"===this.constructor.name){if(r<i)o.lastEmittedDistance=r;else if(r-o.lastEmittedDistance>=this.threshold)return o.lastEmittedDistance=r,{distance:r,center:u}}else if(r>i)o.lastEmittedDistance=r;else if(r<i&&o.lastEmittedDistance-r>=this.threshold)return o.lastEmittedDistance=r,{distance:r,center:u};return null}}}]),t}(c.default);t.default=h;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(4),c=r(s),f=n(5),l=r(f),d=1,p=1,h=function(e){function t(e){i(this,t);var n=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.type="pan",n.numInputs=e&&e.numInputs?e.numInputs:d,n.threshold=e&&e.threshold?e.threshold:p,n}return o(t,e),a(t,[{key:"start",value:function(e){var t=this;e.forEach(function(e){var n=e.getGestureProgress(t.getId());n.active=!0,n.lastEmitted={x:e.current.x,y:e.current.y};});}},{key:"move",value:function(e,t,n){if(this.numInputs===e.length)for(var r={data:[]},i=0;i<e.length;i++){var u=e[i].getGestureProgress(this.getId()),o=!1,a=Math.abs(e[i].current.y-u.lastEmitted.y)>this.threshold,s=Math.abs(e[i].current.x-u.lastEmitted.x)>this.threshold;if(o=a||s,!u.active||!o)return null;r.data[i]={distanceFromOrigin:l.default.distanceBetweenTwoPoints(e[i].initial.x,e[i].current.x,e[i].initial.y,e[i].current.y),directionFromOrigin:l.default.getAngle(e[i].initial.x,e[i].initial.y,e[i].current.x,e[i].current.y),currentDirection:l.default.getAngle(u.lastEmitted.x,u.lastEmitted.y,e[i].current.x,e[i].current.y)},u.lastEmitted.x=e[i].current.x,u.lastEmitted.y=e[i].current.y;}return r}},{key:"end",value:function(e){var t=this;return e.forEach(function(e){var n=e.getGestureProgress(t.getId());n.active=!1;}),null}}]),t}(c.default);t.default=h;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a=n(11),s=r(a),c=n(5),f=(r(c),function(e){function t(e){i(this,t);var n=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.type="pinch",n}return o(t,e),t}(s.default));t.default=f;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(4),c=r(s),f=n(5),l=r(f),d=2,p=function(e){function t(){i(this,t);var e=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return e.type="rotate",e}return o(t,e),a(t,[{key:"move",value:function(e,t,n){if(t.numActiveInputs()<=d){var r=void 0,i=void 0,u=void 0,o=void 0;if(1===t.numActiveInputs()){var a=n.getBoundingClientRect();r={x:a.left+a.width/2,y:a.top+a.height/2},o=e[0],i=u=0;}else {r=l.default.getMidpoint(e[0].initial.x,e[1].initial.x,e[0].initial.y,e[1].initial.y);var s=l.default.getMidpoint(e[0].current.x,e[1].current.x,e[0].current.y,e[1].current.y);i=r.x-s.x,u=r.y-s.y,o=l.default.getRightMostInput(e);}var c=l.default.getAngle(r.x,r.y,o.current.x+i,o.current.y+u),f=o.getGestureProgress(this.getId());return f.initialAngle?(f.change=l.default.getAngularDistance(f.previousAngle,c),f.distance=f.distance+f.change):(f.initialAngle=f.previousAngle=c,f.distance=f.change=0),f.previousAngle=c,{angle:c,distanceFromOrigin:f.distance,distanceFromLast:f.change}}return null}}]),t}(c.default);t.default=p;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(4),c=r(s),f=n(5),l=r(f),d=1,p=100,h=.2,y=100,v=10,g=function(e){function t(e){i(this,t);var n=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.type="swipe",n.numInputs=e&&e.numInputs?e.numInputs:d,n.maxRestTime=e&&e.maxRestTime?e.maxRestTime:p,n.escapeVelocity=e&&e.escapeVelocity?e.escapeVelocity:h,n.timeDistortion=e&&e.timeDistortion?e.timeDistortion:y,n.maxProgressStack=e&&e.maxProgressStack?e.maxProgressStack:v,n}return o(t,e),a(t,[{key:"move",value:function(e,t,n){if(this.numInputs===e.length)for(var r=0;r<e.length;r++){var i=e[r].getGestureProgress(this.getId());i.moves||(i.moves=[]),i.moves.push({time:(new Date).getTime(),x:e[r].current.x,y:e[r].current.y}),i.length>this.maxProgressStack&&i.moves.shift();}return null}},{key:"end",value:function(e){if(this.numInputs===e.length){for(var t={data:[]},n=0;n<e.length;n++){if("end"!==e[n].current.type)return;var r=e[n].getGestureProgress(this.getId());if(r.moves&&r.moves.length>2){var i=r.moves.pop();if((new Date).getTime()-i.time>this.maxRestTime)return null;for(var u=void 0,o=r.moves.length-1;o!==-1;){if(r.moves[o].time!==i.time){u=r.moves[o];break}o--;}u||(u=r.moves.pop(),u.time+=this.timeDistortion);var a=l.default.getVelocity(u.x,u.y,u.time,i.x,i.y,i.time);t.data[n]={velocity:a,distance:l.default.distanceBetweenTwoPoints(u.x,i.x,u.y,i.y),duration:i.time-u.time,currentDirection:l.default.getAngle(u.x,u.y,i.x,i.y)};}}for(var n=0;n<t.data.length;n++)if(a<this.escapeVelocity)return null;if(t.data.length>0)return t}return null}}]),t}(c.default);t.default=g;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function u(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},s=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),c=n(4),f=r(c),l=n(5),d=r(l),p=0,h=300,y=1,v=10,g=function(e){function t(e){i(this,t);var n=u(this,(t.__proto__||Object.getPrototypeOf(t)).call(this));return n.type="tap",n.minDelay=e&&e.minDelay?e.minDelay:p,n.maxDelay=e&&e.maxDelay?e.maxDelay:h,n.numInputs=e&&e.numInputs?e.numInputs:y,n.tolerance=e&&e.tolerance?e.tolerance:v,n}return o(t,e),s(t,[{key:"start",value:function(e){var t=this;return e.length===this.numInputs&&e.forEach(function(e){var n=e.getGestureProgress(t.type);n.start=(new Date).getTime();}),null}},{key:"move",value:function(e,t,n){for(var r=this,i=0;i<e.length;i++)if("move"===e[i].getCurrentEventType()){var u=e[i].current,o=e[i].previous;if(!d.default.isWithin(u.x,u.y,o.x,o.y,this.tolerance)){var s=function(){var t=r.type;return e.forEach(function(e){e.resetProgress(t);}),{v:null}}();if("object"===("undefined"==typeof s?"undefined":a(s)))return s.v}}return null}},{key:"end",value:function(e){var t=this;if(e.length!==this.numInputs)return null;for(var n=Number.MAX_VALUE,r=0;r<e.length;r++){if("end"!==e[r].getCurrentEventType())return null;var i=e[r].getGestureProgress(this.type);if(!i.start)return null;i.start<n&&(n=i.start);}var u=(new Date).getTime()-n;if(this.minDelay<=u&&this.maxDelay>=u)return {interval:u};var o=function(){var n=t.type;return e.forEach(function(e){e.resetProgress(n);}),{v:null}}();return "object"===("undefined"==typeof o?"undefined":a(o))?o.v:void 0}}]),t}(f.default);t.default=g;},function(e,t){function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var r=function e(t,r,i,u,o){n(this,e),this.element=t,this.gesture=r,this.handler=i,this.capture="undefined"!=typeof u&&u,this.bindOnce="undefined"!=typeof o&&o;};t.default=r;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var u=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),o=n(19),a=r(o),s=function(){function e(t,n){i(this,e);var r=new a.default(t,n);this.initial=r,this.current=r,this.previous=r,this.identifier="undefined"!=typeof n?n:0,this.progress={};}return u(e,[{key:"update",value:function(e,t){this.previous=this.current,this.current=new a.default(e,t);}},{key:"getGestureProgress",value:function(e){return this.progress[e]||(this.progress[e]={}),this.progress[e]}},{key:"getCurrentEventType",value:function(){return this.current.type}},{key:"resetProgress",value:function(e){this.progress[e]={};}}]),e}();t.default=s;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var u=n(5),o=r(u),a=0,s=function e(t,n){i(this,e),this.originalEvent=t,this.type=o.default.normalizeEvent(t.type),this.x=a,this.y=a;var r=void 0;if(t.touches&&t.changedTouches){for(var u=0;u<t.changedTouches.length;u++)if(t.changedTouches[u].identifier===n){r=t.changedTouches[u];break}}else r=t;this.x=this.clientX=r.clientX,this.y=this.clientY=r.clientY,this.pageX=r.pageX,this.pageY=r.pageY,this.screenX=r.screenX,this.screenY=r.screenY;};t.default=s;}]);

    var zingtouch = ZingTouch;

    /* src\Clickwheel.svelte generated by Svelte v3.38.3 */
    const file$1 = "src\\Clickwheel.svelte";

    function create_fragment$2(ctx) {
    	let div11;
    	let div0;
    	let svg;
    	let path;
    	let text_1;
    	let textPath;
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let t3;
    	let div3;
    	let t4;
    	let div5;
    	let div4;
    	let t5;
    	let div10;
    	let div6;
    	let t6;
    	let div7;
    	let t7;
    	let div8;
    	let t8;
    	let div9;

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			text_1 = svg_element("text");
    			textPath = svg_element("textPath");
    			t0 = text("menu");
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			div5 = element("div");
    			div4 = element("div");
    			t5 = space();
    			div10 = element("div");
    			div6 = element("div");
    			t6 = space();
    			div7 = element("div");
    			t7 = space();
    			div8 = element("div");
    			t8 = space();
    			div9 = element("div");
    			attr_dev(path, "id", "curve");
    			attr_dev(path, "d", "m0,30 c16,-4 32,-4 48,0");
    			attr_dev(path, "class", "svelte-1pt1d4s");
    			add_location(path, file$1, 65, 12, 1507);
    			xlink_attr(textPath, "xlink:href", "#curve");
    			add_location(textPath, file$1, 67, 16, 1592);
    			attr_dev(text_1, "class", "svelte-1pt1d4s");
    			add_location(text_1, file$1, 66, 12, 1568);
    			attr_dev(svg, "viewBox", "-150 5 350 350");
    			add_location(svg, file$1, 64, 8, 1463);
    			attr_dev(div0, "class", "menu");
    			add_location(div0, file$1, 63, 4, 1435);
    			attr_dev(div1, "class", "skip forward svelte-1pt1d4s");
    			add_location(div1, file$1, 71, 4, 1692);
    			attr_dev(div2, "class", "skip back svelte-1pt1d4s");
    			add_location(div2, file$1, 72, 4, 1730);
    			attr_dev(div3, "class", "play-pause svelte-1pt1d4s");
    			add_location(div3, file$1, 73, 4, 1765);
    			attr_dev(div4, "class", "center-button centered svelte-1pt1d4s");
    			add_location(div4, file$1, 75, 8, 1863);
    			attr_dev(div5, "class", "touch-wheel centered svelte-1pt1d4s");
    			add_location(div5, file$1, 74, 4, 1801);
    			attr_dev(div6, "class", "r0 svelte-1pt1d4s");
    			add_location(div6, file$1, 78, 8, 1971);
    			attr_dev(div7, "class", "r90 svelte-1pt1d4s");
    			add_location(div7, file$1, 79, 8, 2020);
    			attr_dev(div8, "class", "r180 svelte-1pt1d4s");
    			add_location(div8, file$1, 80, 8, 2069);
    			attr_dev(div9, "class", "r270 svelte-1pt1d4s");
    			add_location(div9, file$1, 81, 8, 2118);
    			attr_dev(div10, "class", "hitboxes svelte-1pt1d4s");
    			add_location(div10, file$1, 77, 4, 1939);
    			attr_dev(div11, "class", "outer-ring svelte-1pt1d4s");
    			add_location(div11, file$1, 62, 0, 1405);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    			append_dev(svg, text_1);
    			append_dev(text_1, textPath);
    			append_dev(textPath, t0);
    			append_dev(div11, t1);
    			append_dev(div11, div1);
    			append_dev(div11, t2);
    			append_dev(div11, div2);
    			append_dev(div11, t3);
    			append_dev(div11, div3);
    			append_dev(div11, t4);
    			append_dev(div11, div5);
    			append_dev(div5, div4);
    			/*div4_binding*/ ctx[7](div4);
    			/*div5_binding*/ ctx[8](div5);
    			append_dev(div11, t5);
    			append_dev(div11, div10);
    			append_dev(div10, div6);
    			/*div6_binding*/ ctx[9](div6);
    			append_dev(div10, t6);
    			append_dev(div10, div7);
    			/*div7_binding*/ ctx[10](div7);
    			append_dev(div10, t7);
    			append_dev(div10, div8);
    			/*div8_binding*/ ctx[11](div8);
    			append_dev(div10, t8);
    			append_dev(div10, div9);
    			/*div9_binding*/ ctx[12](div9);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			/*div4_binding*/ ctx[7](null);
    			/*div5_binding*/ ctx[8](null);
    			/*div6_binding*/ ctx[9](null);
    			/*div7_binding*/ ctx[10](null);
    			/*div8_binding*/ ctx[11](null);
    			/*div9_binding*/ ctx[12](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Clickwheel", slots, []);
    	const dispatch = createEventDispatcher();
    	let { angle = 45 } = $$props;
    	let menu, fwd, pp, bck, wheel, btn;
    	let rotateRegion, btnRegions = {};

    	onMount(() => {
    		let map = {
    			menu,
    			forward: fwd,
    			playPause: pp,
    			back: bck,
    			click: btn
    		};

    		for (name in map) {
    			(() => {
    				let button = name;
    				let el = map[name];
    				let region = new zingtouch.Region(el);
    				btnRegions[name] = { el, region };

    				region.bind(el, "tap", () => {
    					dispatch("button", { button });
    				});
    			})();
    		}

    		let rotateRegion = new zingtouch.Region(wheel);
    		let last = 0;
    		let lastRel = 0;

    		rotateRegion.bind(wheel, "rotate", e => {
    			let dfo = e.detail.distanceFromOrigin;

    			if (dfo === 0) {
    				last = 0;
    			} else {
    				let rotation = Math.round((dfo - 10 * lastRel) / angle);

    				if (rotation !== last) {
    					dispatch("wheel", { steps: rotation - last });
    				}

    				last = rotation;
    			}
    		});
    	});

    	onDestroy(() => {
    		rotateRegion?.unbind(wheel, "rotate");

    		for (name in btnRegions) {
    			let { region, el } = btnRegions[name];
    			region?.unbind(el, "tap");
    		}
    	});

    	const writable_props = ["angle"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clickwheel> was created with unknown prop '${key}'`);
    	});

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			btn = $$value;
    			$$invalidate(5, btn);
    		});
    	}

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			wheel = $$value;
    			$$invalidate(4, wheel);
    		});
    	}

    	function div6_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			menu = $$value;
    			$$invalidate(0, menu);
    		});
    	}

    	function div7_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			fwd = $$value;
    			$$invalidate(1, fwd);
    		});
    	}

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			pp = $$value;
    			$$invalidate(2, pp);
    		});
    	}

    	function div9_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			bck = $$value;
    			$$invalidate(3, bck);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("angle" in $$props) $$invalidate(6, angle = $$props.angle);
    	};

    	$$self.$capture_state = () => ({
    		ZingTouch: zingtouch,
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		dispatch,
    		angle,
    		menu,
    		fwd,
    		pp,
    		bck,
    		wheel,
    		btn,
    		rotateRegion,
    		btnRegions
    	});

    	$$self.$inject_state = $$props => {
    		if ("angle" in $$props) $$invalidate(6, angle = $$props.angle);
    		if ("menu" in $$props) $$invalidate(0, menu = $$props.menu);
    		if ("fwd" in $$props) $$invalidate(1, fwd = $$props.fwd);
    		if ("pp" in $$props) $$invalidate(2, pp = $$props.pp);
    		if ("bck" in $$props) $$invalidate(3, bck = $$props.bck);
    		if ("wheel" in $$props) $$invalidate(4, wheel = $$props.wheel);
    		if ("btn" in $$props) $$invalidate(5, btn = $$props.btn);
    		if ("rotateRegion" in $$props) rotateRegion = $$props.rotateRegion;
    		if ("btnRegions" in $$props) btnRegions = $$props.btnRegions;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		menu,
    		fwd,
    		pp,
    		bck,
    		wheel,
    		btn,
    		angle,
    		div4_binding,
    		div5_binding,
    		div6_binding,
    		div7_binding,
    		div8_binding,
    		div9_binding
    	];
    }

    class Clickwheel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { angle: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clickwheel",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get angle() {
    		throw new Error("<Clickwheel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set angle(value) {
    		throw new Error("<Clickwheel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\IPod.svelte generated by Svelte v3.38.3 */

    const { console: console_1 } = globals;
    const file = "src\\IPod.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (191:16) {#each items.map((v, i) => ({v, i})) as item}
    function create_each_block(ctx) {
    	let div;
    	let t_value = /*item*/ ctx[7].v + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "option arr svelte-1ybk6eg");
    			toggle_class(div, "selected", /*selected*/ ctx[1] === /*item*/ ctx[7].i);
    			add_location(div, file, 191, 20, 5676);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t_value !== (t_value = /*item*/ ctx[7].v + "")) set_data_dev(t, t_value);

    			if (dirty & /*selected, items*/ 3) {
    				toggle_class(div, "selected", /*selected*/ ctx[1] === /*item*/ ctx[7].i);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(191:16) {#each items.map((v, i) => ({v, i})) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let link0;
    	let link1;
    	let t0;
    	let div8;
    	let div7;
    	let div6;
    	let div4;
    	let div3;
    	let div0;
    	let i;
    	let i_class_value;
    	let t1;
    	let div1;
    	let t3;
    	let div2;
    	let t4;
    	let div5;
    	let t5;
    	let clickwheel;
    	let current;
    	let each_value = /*items*/ ctx[0].map(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	clickwheel = new Clickwheel({ $$inline: true });
    	clickwheel.$on("wheel", /*handleWheel*/ ctx[3]);
    	clickwheel.$on("button", /*handleButton*/ ctx[4]);

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			link1 = element("link");
    			t0 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "iPod";
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			create_component(clickwheel.$$.fragment);
    			attr_dev(link0, "href", "/fa/css/solid.min.css");
    			attr_dev(link0, "rel", "stylesheet");
    			attr_dev(link0, "class", "svelte-1ybk6eg");
    			add_location(link0, file, 1, 4, 19);
    			attr_dev(link1, "href", "/fa/css/fontawesome.min.css");
    			attr_dev(link1, "rel", "stylesheet");
    			attr_dev(link1, "class", "svelte-1ybk6eg");
    			add_location(link1, file, 2, 4, 77);
    			attr_dev(i, "class", i_class_value = "" + (null_to_empty("fas " + (/*playing*/ ctx[2] ? "fa-pause" : "fa-play")) + " svelte-1ybk6eg"));
    			add_location(i, file, 184, 45, 5327);
    			attr_dev(div0, "class", "player-icon svelte-1ybk6eg");
    			add_location(div0, file, 184, 20, 5302);
    			attr_dev(div1, "class", "title centered svelte-1ybk6eg");
    			add_location(div1, file, 185, 20, 5414);
    			attr_dev(div2, "class", "battery small svelte-1ybk6eg");
    			add_location(div2, file, 186, 20, 5474);
    			attr_dev(div3, "class", "title-container svelte-1ybk6eg");
    			add_location(div3, file, 183, 16, 5251);
    			attr_dev(div4, "class", "title-bar svelte-1ybk6eg");
    			add_location(div4, file, 182, 12, 5210);
    			attr_dev(div5, "class", "menu-options svelte-1ybk6eg");
    			add_location(div5, file, 189, 12, 5565);
    			attr_dev(div6, "class", "screen svelte-1ybk6eg");
    			add_location(div6, file, 181, 8, 5176);
    			attr_dev(div7, "class", "ipod svelte-1ybk6eg");
    			add_location(div7, file, 180, 4, 5148);
    			attr_dev(div8, "class", "container centered svelte-1ybk6eg");
    			add_location(div8, file, 179, 0, 5110);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link0);
    			append_dev(document.head, link1);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, i);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div6, t4);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			append_dev(div7, t5);
    			mount_component(clickwheel, div7, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*playing*/ 4 && i_class_value !== (i_class_value = "" + (null_to_empty("fas " + (/*playing*/ ctx[2] ? "fa-pause" : "fa-play")) + " svelte-1ybk6eg"))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*selected, items*/ 3) {
    				each_value = /*items*/ ctx[0].map(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clickwheel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clickwheel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(link1);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div8);
    			destroy_each(each_blocks, detaching);
    			destroy_component(clickwheel);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = (v, i) => ({ v, i });

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("IPod", slots, []);
    	let itemsStore = null, isDefault = true;
    	let items = ["Playlists", "Artists", "Songs", "Settings", "About", "Now Playing"];
    	let selected = 3;
    	let playing = false;

    	let handleWheel = e => {
    		navigator.vibrate([15]);
    		$$invalidate(1, selected += e.detail.steps);
    		if (selected > items.length - 1) $$invalidate(1, selected = 0);
    		if (selected < 0) $$invalidate(1, selected = items.length - 1);
    	};

    	let handleButton = e => {
    		navigator.vibrate([50]);
    		let button = e.detail.button;

    		if (button === "click") {
    			if (isDefault) {
    				itemsStore = items;

    				$$invalidate(0, items = selected === 4
    				? [
    						"Made by lxhom with Svelte & zingTouch",
    						"URL: iPod.lxhom.codes",
    						"Source: github.com/ lxhom/ipod-web",
    						"Version: PB-58dee7+1"
    					]
    				: ["Not implemented"]);

    				$$invalidate(1, selected = 0);
    				isDefault = false;
    				console.log(items);
    			} else {
    				$$invalidate(0, items = itemsStore);
    				isDefault = true;
    			}
    		} else if (button === "playPause") {
    			$$invalidate(2, playing = !playing);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<IPod> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Clickwheel,
    		itemsStore,
    		isDefault,
    		items,
    		selected,
    		playing,
    		handleWheel,
    		handleButton
    	});

    	$$self.$inject_state = $$props => {
    		if ("itemsStore" in $$props) itemsStore = $$props.itemsStore;
    		if ("isDefault" in $$props) isDefault = $$props.isDefault;
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("playing" in $$props) $$invalidate(2, playing = $$props.playing);
    		if ("handleWheel" in $$props) $$invalidate(3, handleWheel = $$props.handleWheel);
    		if ("handleButton" in $$props) $$invalidate(4, handleButton = $$props.handleButton);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, selected, playing, handleWheel, handleButton];
    }

    class IPod extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IPod",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.3 */

    function create_fragment(ctx) {
    	let ipod;
    	let current;
    	ipod = new IPod({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(ipod.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(ipod, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ipod.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ipod.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ipod, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ IPod });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
